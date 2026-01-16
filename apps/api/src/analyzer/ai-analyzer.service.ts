import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

// AI Prompts
const SUMMARIZE_PROMPT = `
以下のニュース記事を3つの要点（各30文字以内）にまとめてください。

記事タイトル: {title}
本文: {content}

JSON形式で返してください:
{ "summary": ["要点1", "要点2", "要点3"] }
`;

const SENTIMENT_PROMPT = `
以下の記事のトーンを分析し、-1.0（非常にネガティブ）から+1.0（非常にポジティブ）の数値で評価してください。

記事: {content}

JSON形式: { "sentiment": 0.5 }
`;

const BIAS_PROMPT = `
この記事の政治的バイアスを判定してください。
- "Left": 左派寄り
- "Center": 中立
- "Right": 右派寄り

記事: {content}

JSON形式: { "bias": "Center" }
`;

const IMPACT_PROMPT = `
このニュースの緊急度を判定してください:
- S: 極めて重要（選挙結果、逮捕、重大発言など）
- A: 重要（政策発表、裁判進展など）
- B: やや重要（支持率変動、メディア出演など）
- C: 参考情報（日常的な発言、過去記事の引用など）

記事タイトル: {title}

JSON形式: { "impactLevel": "A" }
`;

function fillPrompt(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

const prisma = new PrismaClient();

interface AnalysisResult {
  summary: string[];
  sentiment: number;
  bias: 'Left' | 'Center' | 'Right';
  impactLevel: 'S' | 'A' | 'B' | 'C';
}

@Injectable()
export class AIAnalyzerService {
  private readonly logger = new Logger(AIAnalyzerService.name);
  private openai: OpenAI;
  private maxRetries = 3;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeArticle(articleId: string): Promise<AnalysisResult | null> {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      this.logger.error(`Article not found: ${articleId}`);
      return null;
    }

    this.logger.log(`Analyzing article: ${article.title.substring(0, 50)}...`);

    try {
      // Run all analyses in parallel
      const [summary, sentiment, bias, impactLevel] = await Promise.all([
        this.getSummary(article.title, article.content),
        this.getSentiment(article.content),
        this.getBias(article.content),
        this.getImpact(article.title),
      ]);

      const result: AnalysisResult = {
        summary,
        sentiment,
        bias,
        impactLevel,
      };

      // Update the article with analysis results
      await prisma.article.update({
        where: { id: articleId },
        data: {
          summary: result.summary,
          sentiment: result.sentiment,
          bias: result.bias,
          impactLevel: result.impactLevel,
        },
      });

      this.logger.log(`Analysis complete for article ${articleId}`);
      return result;
    } catch (error) {
      this.logger.error(`Analysis failed for article ${articleId}: ${error}`);

      // Save default values on failure
      await prisma.article.update({
        where: { id: articleId },
        data: {
          summary: [
            'Analysis failed',
            'Please try again',
            'No summary available',
          ],
          sentiment: 0,
          impactLevel: 'C',
        },
      });

      return null;
    }
  }

  private async getSummary(title: string, content: string): Promise<string[]> {
    const prompt = fillPrompt(SUMMARIZE_PROMPT, {
      title,
      content: content.substring(0, 2000),
    });

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 300,
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        if (Array.isArray(result.summary) && result.summary.length === 3) {
          return result.summary;
        }
      } catch (error) {
        this.logger.warn(`Summary attempt ${attempt + 1} failed: ${error}`);
        await this.sleep(1000 * Math.pow(2, attempt)); // Exponential backoff
      }
    }

    return ['Summary unavailable', 'AI analysis pending', 'Check back later'];
  }

  private async getSentiment(content: string): Promise<number> {
    const prompt = fillPrompt(SENTIMENT_PROMPT, {
      content: content.substring(0, 2000),
    });

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 50,
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        if (typeof result.sentiment === 'number') {
          return Math.max(-1, Math.min(1, result.sentiment)); // Clamp to -1 to 1
        }
      } catch (error) {
        this.logger.warn(`Sentiment attempt ${attempt + 1} failed: ${error}`);
        await this.sleep(1000 * Math.pow(2, attempt));
      }
    }

    return 0; // Neutral default
  }

  private async getBias(content: string): Promise<'Left' | 'Center' | 'Right'> {
    const prompt = fillPrompt(BIAS_PROMPT, {
      content: content.substring(0, 2000),
    });

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 50,
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        if (['Left', 'Center', 'Right'].includes(result.bias)) {
          return result.bias;
        }
      } catch (error) {
        this.logger.warn(`Bias attempt ${attempt + 1} failed: ${error}`);
        await this.sleep(1000 * Math.pow(2, attempt));
      }
    }

    return 'Center'; // Default
  }

  private async getImpact(title: string): Promise<'S' | 'A' | 'B' | 'C'> {
    const prompt = fillPrompt(IMPACT_PROMPT, { title });

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 50,
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        if (['S', 'A', 'B', 'C'].includes(result.impactLevel)) {
          return result.impactLevel;
        }
      } catch (error) {
        this.logger.warn(`Impact attempt ${attempt + 1} failed: ${error}`);
        await this.sleep(1000 * Math.pow(2, attempt));
      }
    }

    return 'C'; // Default to lowest impact
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
