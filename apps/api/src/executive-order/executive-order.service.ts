import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface FederalRegisterDocument {
  document_number: string;
  executive_order_number: number | null;
  type: string;
  title: string;
  abstract: string | null;
  signing_date: string;
  publication_date: string;
  html_url: string;
  pdf_url: string | null;
  president: {
    name: string;
    identifier: string;
  };
}

interface FederalRegisterResponse {
  count: number;
  results: FederalRegisterDocument[];
}

const FEDERAL_REGISTER_API = 'https://www.federalregister.gov/api/v1';

const TRANSLATE_EO_PROMPT = `
以下の大統領令のタイトルと概要を日本語に翻訳し、わかりやすく要約してください。

タイトル: {title}
概要: {abstract}

JSON形式で返してください:
{
  "titleJa": "日本語タイトル（50文字以内）",
  "summaryJa": "日本語要約（100文字以内、一般の人にもわかりやすく）"
}
`;

@Injectable()
export class ExecutiveOrderService {
  private readonly logger = new Logger(ExecutiveOrderService.name);
  private openai: OpenAI | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  // Collect every 6 hours
  @Cron(CronExpression.EVERY_6_HOURS)
  async collectExecutiveOrders() {
    this.logger.log('Starting executive order collection...');
    await this.fetchFromFederalRegister();
  }

  async findAll(type?: string, limit = 20, offset = 0) {
    const where: Record<string, unknown> = {};
    if (type) {
      where.type = type;
    }

    const [orders, total] = await Promise.all([
      this.prisma.executiveOrder.findMany({
        where,
        orderBy: { signingDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.executiveOrder.count({ where }),
    ]);

    return {
      orders,
      total,
      hasMore: offset + orders.length < total,
    };
  }

  async findById(id: string) {
    return this.prisma.executiveOrder.findUnique({
      where: { id },
    });
  }

  async getRecent(limit = 5) {
    return this.prisma.executiveOrder.findMany({
      orderBy: { signingDate: 'desc' },
      take: limit,
      select: {
        id: true,
        executiveOrderNumber: true,
        type: true,
        title: true,
        titleJa: true,
        summaryJa: true,
        signingDate: true,
        htmlUrl: true,
      },
    });
  }

  async fetchFromFederalRegister() {
    try {
      // Fetch Trump's presidential documents from 2nd term
      const url = new URL(`${FEDERAL_REGISTER_API}/documents.json`);
      url.searchParams.set('conditions[president]', 'donald-trump');
      url.searchParams.set(
        'conditions[presidential_document_type_id][]',
        '2' // Executive Order
      );
      url.searchParams.set(
        'conditions[presidential_document_type_id][]',
        '3' // Proclamation
      );
      url.searchParams.set(
        'conditions[presidential_document_type_id][]',
        '5' // Presidential Memorandum
      );
      url.searchParams.set('conditions[publication_date][gte]', '2025-01-20');
      url.searchParams.set('per_page', '100');
      url.searchParams.set('order', 'newest');
      url.searchParams.set(
        'fields[]',
        'document_number,executive_order_number,type,title,abstract,signing_date,publication_date,html_url,pdf_url,president'
      );

      this.logger.log(`Fetching from Federal Register: ${url.toString()}`);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Federal Register API error: ${response.status}`);
      }

      const data: FederalRegisterResponse = await response.json();
      this.logger.log(`Found ${data.count} documents from Federal Register`);

      let newCount = 0;
      for (const doc of data.results) {
        const created = await this.saveDocument(doc);
        if (created) newCount++;
      }

      this.logger.log(
        `Collection complete: ${newCount} new documents saved out of ${data.results.length}`
      );
      return { newCount, total: data.results.length };
    } catch (error) {
      this.logger.error(`Failed to fetch from Federal Register: ${error}`);
      throw error;
    }
  }

  private async saveDocument(doc: FederalRegisterDocument): Promise<boolean> {
    // Check if already exists
    const existing = await this.prisma.executiveOrder.findUnique({
      where: { documentNumber: doc.document_number },
    });

    if (existing) {
      return false;
    }

    // Map type string
    const typeMap: Record<string, string> = {
      'Executive Order': 'executive_order',
      Proclamation: 'proclamation',
      'Presidential Memorandum': 'memorandum',
    };

    const type = typeMap[doc.type] || 'other';

    // Translate and summarize with AI
    let titleJa: string | null = null;
    let summaryJa: string | null = null;

    if (this.openai && doc.abstract) {
      try {
        const translation = await this.translateAndSummarize(
          doc.title,
          doc.abstract
        );
        titleJa = translation.titleJa;
        summaryJa = translation.summaryJa;
      } catch (error) {
        this.logger.warn(
          `Translation failed for ${doc.document_number}: ${error}`
        );
      }
    }

    // Save to database
    await this.prisma.executiveOrder.create({
      data: {
        documentNumber: doc.document_number,
        executiveOrderNumber: doc.executive_order_number,
        type,
        title: doc.title,
        titleJa,
        abstract: doc.abstract,
        summaryJa,
        signingDate: new Date(doc.signing_date),
        publicationDate: new Date(doc.publication_date),
        htmlUrl: doc.html_url,
        pdfUrl: doc.pdf_url,
        president: doc.president?.identifier || 'donald-trump',
      },
    });

    this.logger.log(`Saved: ${doc.title.substring(0, 50)}...`);
    return true;
  }

  private async translateAndSummarize(
    title: string,
    abstract: string
  ): Promise<{ titleJa: string; summaryJa: string }> {
    if (!this.openai) {
      return { titleJa: title, summaryJa: abstract };
    }

    const prompt = TRANSLATE_EO_PROMPT.replace('{title}', title).replace(
      '{abstract}',
      abstract.substring(0, 1500)
    );

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { titleJa: title, summaryJa: abstract };
    }

    const result = JSON.parse(content);
    return {
      titleJa: result.titleJa || title,
      summaryJa: result.summaryJa || abstract,
    };
  }

  // Manual trigger for testing
  async triggerCollection() {
    return this.fetchFromFederalRegister();
  }
}
