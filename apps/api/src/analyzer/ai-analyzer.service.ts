import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// AI Prompts
const TRANSLATE_PROMPT = `
以下の英語ニュース記事を日本語に翻訳してください。

## タイトルの翻訳ルール

### スタイル
日経テレ東やPIVOTのようなビジネス系ニュースチャンネルの動画タイトル風。
信頼感がありつつも、クリックしたくなる簡潔な表現。

### 必須ルール
- 20〜35文字程度
- 句読点は使わない（読点「、」は1回まで許容）
- 「!」「?」「…」は絶対に使わない
- 【】や「」で囲む表現は使わない
- 「衝撃」「ヤバい」「とんでもない」などの煽り表現は禁止

### 推奨する表現パターン
- 「〇〇、△△を表明」「〇〇が△△へ」「〇〇の狙い」「〇〇と△△の行方」
- 体言止め：「トランプの新関税政策」「対中戦略の転換点」
- 具体的な数字や固有名詞を含める

### 良い例
- 「トランプ、対中関税25%引き上げを表明」
- 「グリーンランド買収構想の全貌と米国の狙い」
- 「トランプ政権の移民政策が与える経済的影響」

### 悪い例（これらは絶対に避ける）
- 「トランプがとんでもない発表！」（煽り＋感嘆符）
- 「【速報】トランプの衝撃発言」（括弧＋煽り語）
- 「トランプの真の狙いとは？」（疑問符）

## 本文の翻訳ルール
- です・ます調
- 政治・経済用語は平易な言葉で補足
- 原文の情報を正確に伝えつつ、日本人読者に分かりやすく

## 入力
タイトル: {title}
本文: {content}

## 出力（JSON形式のみ、他の文章は出力しない）
{ "titleJa": "...", "contentJa": "..." }
`;

const SUMMARIZE_PROMPT = `
以下のニュース記事を3つの要点にまとめてください。

## 要約ルール

### スタイル
ニュースアプリのプッシュ通知や、YouTube動画の概要欄に書かれているような簡潔な箇条書き。

### 必須ルール
- 各要点は20〜40文字
- 「!」「?」は使わない
- 「〜とのこと」「〜らしい」など曖昧な表現は避ける
- 事実ベースで具体的に

### 推奨する表現
- 「〇〇が△△を発表」「〇〇、△△へ」「〇〇で△△が加速」
- 数字・固有名詞・日付など具体的情報を優先
- 3つ目は影響や今後の見通しを含める

### 良い例
- 「トランプ大統領、中国製品への関税を25%に引き上げ」
- 「米中貿易摩擦が再び激化する見通し」
- 「日本の自動車産業にも影響が波及か」

## 入力
記事タイトル: {title}
本文: {content}

## 出力（JSON形式のみ）
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

const TAGS_PROMPT = `
以下のニュース記事から、主要なトピックタグを3〜5個抽出してください。
タグは英語の単語またはフレーズで、スペースなしのPascalCaseで返してください。

一般的なトピック例: Tariff, Immigration, Election, Trial, Economy, China, Border, Rally, Indictment, TruthSocial, Vance, DJTStock

記事タイトル: {title}
本文: {content}

JSON形式: { "tags": ["Tariff", "China", "Economy"] }
`;

const GLOSSARY_PROMPT = `
あなたは米国政治の専門家です。以下のニュース記事を読み、**一般的な日本人読者が知らない可能性が高い項目**を特定し、簡潔に解説してください。

## 解説が【必要】な項目
- 知名度の低い政治家（州議会議員、多くの下院議員、メディア露出の少ない上院議員など）
- 具体的な法案・法律（CHIPS法、第14修正条項、Insurrection Actなど）
- 条約・協定（USMCA、ABM条約など）
- 政府機関・委員会（GAO、OMB、J6委員会など）
- 政治専門用語（フィリバスター、reconciliation、executive orderなど）

## 解説が【不要】な項目（必ず除外）
- 歴代大統領・副大統領（トランプ、バイデン、オバマ、ブッシュ、クリントン、カマラ・ハリス、ペンスなど）
- 超有名政治家（ペロシ、マコーネル、AOC、イーロン・マスクなど）
- 基本用語（民主党、共和党、上院、下院、ホワイトハウス、FBI、CIAなど）
- 国際的に有名な機関（NATO、国連、WHO、IMFなど）
- 誰でも知っている国名・都市名

## 記事
タイトル: {title}
本文: {content}

## 出力ルール
1. 該当項目がある場合のみ解説を出力（最大5件、重要度順）
2. 各解説は40〜80文字で簡潔に
3. **該当項目がなければ必ず空配列を返す**（これが最も重要）

## JSON出力形式
{
  "glossary": [
    {
      "term": "Bill Cassidy",
      "termJa": "ビル・キャシディ",
      "type": "person",
      "description": "ルイジアナ州選出の共和党上院議員。医師出身で、医療政策に詳しい。2021年トランプ弾劾裁判で有罪票を投じた。"
    }
  ]
}

該当なしの場合: { "glossary": [] }
`;

function fillPrompt(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

export interface GlossaryItem {
  term: string;
  termJa: string;
  type: 'person' | 'law' | 'treaty' | 'organization' | 'term';
  description: string;
}

export interface AnalysisResult {
  id: string;
  title: string;
  content: string;
  source: string;
  titleJa: string;
  contentJa: string;
  summary: string[];
  sentiment: number;
  bias: 'Left' | 'Center' | 'Right';
  impactLevel: 'S' | 'A' | 'B' | 'C';
  glossary: GlossaryItem[];
}

// GPT-4o-mini pricing (per 1M tokens)
const PRICING = {
  'gpt-4o-mini': {
    input: 0.15, // $0.15 per 1M input tokens
    output: 0.6, // $0.60 per 1M output tokens
  },
};

function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing =
    PRICING[model as keyof typeof PRICING] || PRICING['gpt-4o-mini'];
  return (
    (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
  );
}

@Injectable()
export class AIAnalyzerService {
  private readonly logger = new Logger(AIAnalyzerService.name);
  private openai: OpenAI;
  private maxRetries = 3;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private async trackUsage(
    operation: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    articleId?: string
  ): Promise<void> {
    try {
      const cost = calculateCost(model, inputTokens, outputTokens);
      await this.prisma.apiUsage.create({
        data: {
          provider: 'openai',
          model,
          operation,
          inputTokens,
          outputTokens,
          cost,
          articleId,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to track API usage: ${error}`);
    }
  }

  async analyzeArticle(articleId: string): Promise<AnalysisResult | null> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      this.logger.error(`Article not found: ${articleId}`);
      return null;
    }

    this.logger.log(`Analyzing article: ${article.title.substring(0, 50)}...`);

    try {
      // First, translate to Japanese
      const { titleJa, contentJa } = await this.translateToJapanese(
        article.title,
        article.content,
        articleId
      );

      // Then run all analyses in parallel
      const [summary, sentiment, bias, impactLevel, tags, glossary] =
        await Promise.all([
          this.getSummary(article.title, article.content, articleId),
          this.getSentiment(article.content, articleId),
          this.getBias(article.content, articleId),
          this.getImpact(article.title, articleId),
          this.getTags(article.title, article.content, articleId),
          this.getGlossary(article.title, article.content, articleId),
        ]);

      // Save tags to database
      await this.saveTags(articleId, tags);

      const result: AnalysisResult = {
        id: articleId,
        title: article.title,
        content: article.content,
        source: article.source,
        titleJa,
        contentJa,
        summary,
        sentiment,
        bias,
        impactLevel,
        glossary,
      };

      // Update the article with analysis results
      await this.prisma.article.update({
        where: { id: articleId },
        data: {
          titleJa: result.titleJa,
          contentJa: result.contentJa,
          summary: result.summary,
          sentiment: result.sentiment,
          bias: result.bias,
          impactLevel: result.impactLevel,
          glossary:
            result.glossary.length > 0
              ? (result.glossary as unknown as Prisma.InputJsonValue)
              : undefined,
        },
      });

      this.logger.log(`Analysis complete for article ${articleId}`);
      return result;
    } catch (error) {
      this.logger.error(`Analysis failed for article ${articleId}: ${error}`);

      // Save default values on failure
      await this.prisma.article.update({
        where: { id: articleId },
        data: {
          summary: [
            '分析に失敗しました',
            '後でもう一度お試しください',
            '要約は利用できません',
          ],
          sentiment: 0,
          impactLevel: 'C',
        },
      });

      return null;
    }
  }

  private async translateToJapanese(
    title: string,
    content: string,
    articleId?: string
  ): Promise<{ titleJa: string; contentJa: string }> {
    const prompt = fillPrompt(TRANSLATE_PROMPT, {
      title,
      content: content.substring(0, 3000),
    });

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 2000,
        });

        const usage = response.usage;
        if (usage) {
          await this.trackUsage(
            'translate',
            'gpt-4o-mini',
            usage.prompt_tokens,
            usage.completion_tokens,
            articleId
          );
        }

        const result = JSON.parse(response.choices[0].message.content || '{}');
        if (result.titleJa && result.contentJa) {
          return {
            titleJa: result.titleJa,
            contentJa: result.contentJa,
          };
        }
      } catch (error) {
        this.logger.warn(`Translation attempt ${attempt + 1} failed: ${error}`);
        await this.sleep(1000 * Math.pow(2, attempt));
      }
    }

    // Fallback to original text
    return { titleJa: title, contentJa: content };
  }

  private async getSummary(
    title: string,
    content: string,
    articleId?: string
  ): Promise<string[]> {
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

        const usage = response.usage;
        if (usage) {
          await this.trackUsage(
            'summarize',
            'gpt-4o-mini',
            usage.prompt_tokens,
            usage.completion_tokens,
            articleId
          );
        }

        const result = JSON.parse(response.choices[0].message.content || '{}');
        if (Array.isArray(result.summary) && result.summary.length === 3) {
          return result.summary;
        }
      } catch (error) {
        this.logger.warn(`Summary attempt ${attempt + 1} failed: ${error}`);
        await this.sleep(1000 * Math.pow(2, attempt)); // Exponential backoff
      }
    }

    return ['要約を取得できませんでした', 'AI分析中です', '後でご確認ください'];
  }

  private async getSentiment(
    content: string,
    articleId?: string
  ): Promise<number> {
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

        const usage = response.usage;
        if (usage) {
          await this.trackUsage(
            'sentiment',
            'gpt-4o-mini',
            usage.prompt_tokens,
            usage.completion_tokens,
            articleId
          );
        }

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

  private async getBias(
    content: string,
    articleId?: string
  ): Promise<'Left' | 'Center' | 'Right'> {
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

        const usage = response.usage;
        if (usage) {
          await this.trackUsage(
            'bias',
            'gpt-4o-mini',
            usage.prompt_tokens,
            usage.completion_tokens,
            articleId
          );
        }

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

  private async getImpact(
    title: string,
    articleId?: string
  ): Promise<'S' | 'A' | 'B' | 'C'> {
    const prompt = fillPrompt(IMPACT_PROMPT, { title });

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 50,
        });

        const usage = response.usage;
        if (usage) {
          await this.trackUsage(
            'impact',
            'gpt-4o-mini',
            usage.prompt_tokens,
            usage.completion_tokens,
            articleId
          );
        }

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

  private async getGlossary(
    title: string,
    content: string,
    articleId?: string
  ): Promise<GlossaryItem[]> {
    const prompt = fillPrompt(GLOSSARY_PROMPT, {
      title,
      content: content.substring(0, 2500),
    });

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 500,
        });

        const usage = response.usage;
        if (usage) {
          await this.trackUsage(
            'glossary',
            'gpt-4o-mini',
            usage.prompt_tokens,
            usage.completion_tokens,
            articleId
          );
        }

        const result = JSON.parse(response.choices[0].message.content || '{}');
        if (Array.isArray(result.glossary)) {
          // Validate and filter glossary items
          return result.glossary
            .filter(
              (item: GlossaryItem) =>
                item.term &&
                item.termJa &&
                item.type &&
                item.description &&
                ['person', 'law', 'treaty', 'organization', 'term'].includes(
                  item.type
                )
            )
            .slice(0, 5); // Max 5 items
        }
      } catch (error) {
        this.logger.warn(`Glossary attempt ${attempt + 1} failed: ${error}`);
        await this.sleep(1000 * Math.pow(2, attempt));
      }
    }

    return []; // Empty array if no glossary needed or on failure
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async getTags(
    title: string,
    content: string,
    articleId?: string
  ): Promise<string[]> {
    const prompt = fillPrompt(TAGS_PROMPT, {
      title,
      content: content.substring(0, 1500),
    });

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 100,
        });

        const usage = response.usage;
        if (usage) {
          await this.trackUsage(
            'tags',
            'gpt-4o-mini',
            usage.prompt_tokens,
            usage.completion_tokens,
            articleId
          );
        }

        const result = JSON.parse(response.choices[0].message.content || '{}');
        if (Array.isArray(result.tags) && result.tags.length > 0) {
          return result.tags.slice(0, 5); // Max 5 tags
        }
      } catch (error) {
        this.logger.warn(`Tags attempt ${attempt + 1} failed: ${error}`);
        await this.sleep(1000 * Math.pow(2, attempt));
      }
    }

    // Default tags based on simple keyword matching
    return this.getDefaultTags(title, content);
  }

  private getDefaultTags(title: string, content: string): string[] {
    const text = `${title} ${content}`.toLowerCase();
    const tags: string[] = [];

    const keywordMap: Record<string, string> = {
      tariff: 'Tariff',
      immigration: 'Immigration',
      border: 'Border',
      election: 'Election',
      trial: 'Trial',
      court: 'Trial',
      indictment: 'Indictment',
      china: 'China',
      economy: 'Economy',
      stock: 'DJTStock',
      rally: 'Rally',
      vance: 'Vance',
      'truth social': 'TruthSocial',
    };

    for (const [keyword, tag] of Object.entries(keywordMap)) {
      if (text.includes(keyword) && !tags.includes(tag)) {
        tags.push(tag);
      }
    }

    return tags.slice(0, 5);
  }

  private async saveTags(articleId: string, tagNames: string[]): Promise<void> {
    try {
      for (const tagName of tagNames) {
        // Find or create the tag
        let tag = await this.prisma.tag.findFirst({
          where: { name: tagName },
        });

        if (!tag) {
          tag = await this.prisma.tag.create({
            data: {
              id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: tagName,
            },
          });
        }

        // Check if the relationship already exists
        const existingRelation = await this.prisma.articleTag.findUnique({
          where: {
            articleId_tagId: {
              articleId,
              tagId: tag.id,
            },
          },
        });

        // Create the relationship if it doesn't exist
        if (!existingRelation) {
          await this.prisma.articleTag.create({
            data: {
              articleId,
              tagId: tag.id,
            },
          });
        }
      }

      this.logger.log(`Saved ${tagNames.length} tags for article ${articleId}`);
    } catch (error) {
      this.logger.error(
        `Failed to save tags for article ${articleId}: ${error}`
      );
    }
  }
}
