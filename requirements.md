# トランプアラート (Trump Alert) 要件定義書

## 1. プロジェクト概要

**プロジェクト名:** Trump Alert (トランプアラート)

**目的:** ドナルド・トランプ氏に関連するニュース、SNSの動向、株価（DJTなど）への影響をリアルタイムで収集・分析し、ユーザーに「今、何が起きているか」を即座に通知する。

**コアバリュー:** 情報の速報性、AIによる感情・要約分析、バイアス（偏向）の可視化。

**ターゲットユーザー:** 政治ニュース追跡者、トレーダー、メディアリサーチャー、トランプ関連情報を即座に知りたい日本語ユーザー。

## 2. 技術スタック (Tech Stack)

**「TypeScript Full-Stack Monorepo」**構成を採用します。型安全性と開発効率を最大化します。

### 開発環境・言語

- **言語:** TypeScript 5.x (Strict Mode)
- **Node.js:** v20.x LTS
- **パッケージ管理:** pnpm v8.x（workspace機能使用）
- **ビルドシステム:** Turborepo v2.x
- **モノレポ構成:**
  ```
  /
  ├── apps/
  │   ├── web/          # Next.js frontend
  │   └── api/          # NestJS backend
  ├── packages/
  │   ├── database/     # Prisma schema & client
  │   ├── shared/       # 共通型定義・ユーティリティ
  │   └── ui/           # Shadcn/UIコンポーネント
  ├── turbo.json
  ├── pnpm-workspace.yaml
  └── package.json
  ```

### フロントエンド (Web Client)

- **フレームワーク:** Next.js 15.x (App Router、React Server Components使用)
- **スタイリング:** Tailwind CSS 4.x
- **コンポーネント:** Shadcn/UI（Radix UI primitives）
  - 使用コンポーネント: Button, Card, Dialog, Alert, Tabs, Select, Checkbox, Skeleton
- **状態管理:** TanStack Query v5（サーバー状態）+ Zustand v4（クライアント状態）
  - TanStack Query: API取得・キャッシュ・リアルタイム更新
  - Zustand: ユーザー設定、UI状態（サイドバー開閉など）
- **チャート描画:** Recharts v2（感情分析グラフ、トランプ指数の折れ線グラフ）
- **リアルタイム通信:** SSE (Server-Sent Events) または WebSocket（速報プッシュ用）
  - 実装方法: Next.js Route Handlers でSSEエンドポイント `/api/stream` を作成
- **認証:** NextAuth.js v5（メール認証のみ、ソーシャルログインなし）
- **国際化:** next-intl（日本語・英語切り替え）
- **フォーム:** React Hook Form v7 + Zod v3（バリデーション）

### バックエンド (API & Worker)

- **フレームワーク:** NestJS v10.x
- **アーキテクチャパターン:** モジュラーモノリス（将来的にマイクロサービス化可能）
- **主要モジュール:**
  - `CollectorModule`: データ収集ロジック
  - `AnalyzerModule`: AI分析エンジン
  - `NotificationModule`: 通知配信
  - `ArticleModule`: 記事CRUD操作
  - `UserModule`: ユーザー管理
  - `AlertModule`: カスタムアラート設定
- **API設計:** tRPC v10（型安全なRPC、Next.js統合）
  - エンドポイント例:
    - `article.list({ limit: 50, offset: 0 })`
    - `article.getById({ id: string })`
    - `alert.create({ keyword: string, minImpact: 'S' | 'A' | 'B' | 'C' })`
    - `stats.getTrumpIndex({ date: string })` // 日別感情平均値
- **スクレイピング/クローラー:** Playwright v1.40+（ヘッドレスChromium）
  - 対象サイト別のScraperクラス:
    - `TruthSocialScraper.ts`
    - `TwitterScraper.ts`
    - `NewsAPIScraper.ts`
  - レート制限: 各サイト5秒間隔（`setTimeout`）
  - User-Agent: ランダムローテーション（5パターン用意）
  - Proxy: BrightData または ScraperAPI経由（環境変数で設定）
- **ジョブキュー:** BullMQ v5（Redisベース）
  - キュー種類:
    - `news-fetch`: 5分ごとにニュース取得
    - `social-scrape`: 1分ごとにSNS監視
    - `ai-analysis`: 取得した記事をAI分析（並列処理10件まで）
    - `notification-send`: アラート条件に合致したら即座に通知
  - リトライ戦略: 最大3回、指数バックオフ（1分、2分、4分）
- **Cron設定:**
  - `@nestjs/schedule` 使用
  - 実装例: `@Cron('*/5 * * * *')` でニュース収集ジョブをキューに追加

### データベース & インフラ

- **メインDB:** PostgreSQL 16.x
  - ホスティング: Supabase（無料枠から開始、後にRailway移行可）
  - 接続: Prisma経由（接続プーリング有効化）
  - インデックス設定:
    - `Article.publishedAt` (DESC) - タイムライン取得高速化
    - `Article.source + Article.publishedAt` - ソース別取得
    - `Article.impactLevel` - アラートフィルタリング
    - `Tag.name` - タグ検索
- **ORM:** Prisma v5.x
  - クライアント生成先: `packages/database/generated`
  - マイグレーション管理: `prisma migrate dev/deploy`
  - Seed データ: `prisma/seed.ts` で初期タグ（"Tariff", "Election", "Trial"など）を投入
- **キャッシュ/キュー:** Redis 7.x
  - ホスティング: Upstash（サーバーレスRedis、無料枠あり）
  - 用途:
    - BullMQキュー永続化
    - 記事重複チェック（URLのハッシュをキャッシュ、TTL 30日）
    - トランプ指数キャッシュ（1時間キャッシュ）
- **AI統合:** OpenAI API
  - モデル: `gpt-4o-mini`（コスト削減、速度優先）
  - プロンプトテンプレート（`packages/shared/prompts/`に保存）:

    ```typescript
    // summarize.ts
    export const SUMMARIZE_PROMPT = `
    以下のニュース記事を3つの要点（各30文字以内）にまとめてください。
    
    記事タイトル: {title}
    本文: {content}
    
    JSON形式で返してください:
    { "summary": ["要点1", "要点2", "要点3"] }
    `;

    // sentiment.ts
    export const SENTIMENT_PROMPT = `
    以下の記事のトーンを分析し、-1.0（非常にネガティブ）から+1.0（非常にポジティブ）の数値で評価してください。
    
    記事: {content}
    
    JSON形式: { "sentiment": 0.5 }
    `;

    // bias.ts
    export const BIAS_PROMPT = `
    この記事の政治的バイアスを判定してください。
    - "Left": 左派寄り
    - "Center": 中立
    - "Right": 右派寄り
    
    記事: {content}
    
    JSON形式: { "bias": "Center" }
    `;

    // impact.ts
    export const IMPACT_PROMPT = `
    このニュースの緊急度を判定してください:
    - S: 極めて重要（選挙結果、逮捕、重大発言など）
    - A: 重要（政策発表、裁判進展など）
    - B: やや重要（支持率変動、メディア出演など）
    - C: 参考情報（日常的な発言、過去記事の引用など）
    
    記事タイトル: {title}
    
    JSON形式: { "impactLevel": "A" }
    `;
    ```

  - レート制限対策: `p-queue`で並列3リクエストまで、429エラー時は60秒待機
  - エラーハンドリング: 3回失敗したら `impactLevel: "C"` でデフォルト保存

- **ホスティング:**
  - **Frontend:** Vercel（Next.js最適化、自動デプロイ）
  - **Backend/Worker:** Railway（NestJSコンテナ、Dockerfileベース）
    - Dockerfile: `node:20-alpine` ベース、pnpm使用
  - **環境変数管理:** `.env.example` をリポジトリに保存、実際の値は各プラットフォームのSecretsに設定
    ```bash
    # .env.example
    DATABASE_URL=postgresql://user:pass@host:5432/db
    REDIS_URL=redis://default:pass@host:6379
    OPENAI_API_KEY=sk-...
    PROXY_URL=http://scraperapi:pass@proxy.scraperapi.com:8001
    NEXTAUTH_SECRET=random-string
    NEXTAUTH_URL=http://localhost:3000
    ```

## 3. 機能要件 (Functional Requirements)

### A. データ収集 (Collector Service)

NestJS上のWorkerが以下のソースを定期監視（Cron/Streaming）します。

**News API / RSS:**

- **実装:** `CollectorModule` 内の `NewsCollector.service.ts`
- **データソース:**
  - News API: `https://newsapi.org/v2/everything?q=Trump&apiKey=xxx`（5分間隔）
  - RSS:
    - CNN Politics RSS: `http://rss.cnn.com/rss/cnn_allpolitics.rss`
    - Fox News Politics RSS: `https://moxie.foxnews.com/google-publisher/politics.xml`
    - BBC News RSS: `http://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml`
    - NHK RSS: `https://www3.nhk.or.jp/rss/news/cat6.xml`（国際ニュース）
- **パーサー:** `rss-parser` npm パッケージ
- **重複排除:** URLのSHA-256ハッシュをRedisに保存（`article:url:{hash}` キー、TTL 30日）
- **保存フロー:**
  1. RSS/APIから記事取得
  2. URL重複チェック（Redis）
  3. 重複していなければ `Article` として保存（`summary`, `sentiment`などはnull）
  4. `ai-analysis` キューにジョブ追加

**Social Media (Scraping):**

- **実装:** `TruthSocialScraper.ts`, `TwitterScraper.ts`
- **Truth Social:**
  - ターゲットURL: `https://truthsocial.com/@realDonaldTrump`
  - Playwrightで `article[role="article"]` 要素を取得
  - 各投稿の `data-testid="post-text"` からテキスト抽出
  - タイムスタンプ: `time` 要素の `datetime` 属性
  - 1分間隔で監視
- **X (Twitter):**
  - ターゲット: `@realDonaldTrump`（公式API v2使用不可の場合、nitterインスタンス経由）
  - 実装: `https://nitter.net/realDonaldTrump/rss` をパース
  - または Playwright で `https://twitter.com/realDonaldTrump` をスクレイピング
  - ハッシュタグ監視: `#Trump`, `#MAGA`, `#Trump2024`
- **保存形式:**
  - `source: "Truth Social"` または `"Twitter"`
  - `title`: 投稿の最初の50文字
  - `content`: 全文
  - `url`: 投稿への直リンク

**Market Data:**

- **実装:** `MarketDataCollector.service.ts`
- **データソース:** Alpha Vantage API（無料枠: 25 calls/day → 1時間ごとに取得）
  - エンドポイント: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=DJT&apiKey=xxx`
- **取得データ:**
  - 株価: `DJT`（Trump Media & Technology Group）
  - 価格変動率: 前日比 ±5% 以上なら `impactLevel: "A"` で通知
- **保存:** 独立した `StockPrice` テーブル（後述）
  ```prisma
  model StockPrice {
    id        String   @id @default(uuid())
    symbol    String   // "DJT"
    price     Float
    change    Float    // 変動率 (%)
    timestamp DateTime
    createdAt DateTime @default(now())
  }
  ```

### B. AI分析エンジン (Analyzer Service)

収集したテキストデータに対して、TypeScript経由でLLMを叩き、以下のメタデータを付与します。

**実装:** `AnalyzerModule` の `AIAnalyzer.service.ts`

**処理フロー:**

1. BullMQの `ai-analysis` キューからジョブ取得（Article ID）
2. OpenAI API に並列リクエスト（`Promise.all` で4つのプロンプト同時実行）
3. 結果をArticleレコードに更新
4. エラー時はリトライ（最大3回）、全失敗時はデフォルト値保存

**分析項目:**

**1. 3行要約 (`summary: string[]`)**

- プロンプト: 上記 `SUMMARIZE_PROMPT` 使用
- 制約: 各要点30文字以内、合計3つ
- バリデーション: Zodスキーマで配列長チェック
  ```typescript
  const SummarySchema = z.object({
    summary: z.array(z.string().max(30)).length(3),
  });
  ```

**2. Sentiment Score (`sentiment: Float`)**

- プロンプト: `SENTIMENT_PROMPT`
- 範囲: -1.0（極めてネガティブ）～ +1.0（極めてポジティブ）
- 例: 逮捕報道 → -0.8、選挙勝利 → +0.9、日常発言 → 0.0
- バリデーション: `-1 <= sentiment <= 1`

**3. Impact Level (`impactLevel: String`)**

- プロンプト: `IMPACT_PROMPT`
- 値: `"S" | "A" | "B" | "C"`
- 判定基準:
  - **S:** 選挙結果、逮捕、起訴、重大政策発表、暴力事件
  - **A:** 裁判進展、支持率大幅変動、主要人事、国際的影響
  - **B:** 演説、集会、メディア出演、支持率微増減
  - **C:** 日常発言、過去記事引用、個人的活動
- デフォルト値: "C"（AI失敗時）

**4. Bias Check (`bias: String`)**

- プロンプト: `BIAS_PROMPT`
- 値: `"Left" | "Center" | "Right"`
- ソースごとのデフォルト（AI分析前の仮値）:
  - CNN, MSNBC, NYT → "Left"
  - Fox News, Breitbart, Truth Social → "Right"
  - BBC, Reuters, AP → "Center"
- AI分析で上書き可能

**並列処理:**

```typescript
// AIAnalyzer.service.ts
async analyzeArticle(articleId: string) {
  const article = await prisma.article.findUnique({ where: { id: articleId } });

  const [summary, sentiment, impact, bias] = await Promise.all([
    this.openai.getSummary(article.title, article.content),
    this.openai.getSentiment(article.content),
    this.openai.getImpact(article.title),
    this.openai.getBias(article.content),
  ]);

  await prisma.article.update({
    where: { id: articleId },
    data: { summary, sentiment, impactLevel: impact, bias }
  });
}
```

**コスト最適化:**

- `gpt-4o-mini` 使用（1Mトークン = $0.15）
- 記事1本あたり約500トークン（入力） + 100トークン（出力） = $0.0001/記事
- 1日1000記事処理 = 約$0.10/日 = $3/月

### C. ユーザー向け機能 (Web UI)

**ページ構成:**

```
/                    # ダッシュボード（タイムライン + トランプ指数）
/article/[id]        # 記事詳細ページ
/alerts              # アラート設定ページ
/fact-check          # Fact Check Maker
/settings            # ユーザー設定（通知方法、言語など）
/auth/signin         # サインインページ
/auth/signup         # サインアップページ
```

#### 1. Live Dashboard (`/`)

**タイムライン形式のニュースフィード:**

- **レイアウト:** 2カラム（左: フィード、右: サイドバー）
- **実装:** `app/page.tsx`（Server Component）
- **データ取得:**
  ```typescript
  // app/page.tsx
  async function getDashboardData() {
    const articles = await prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50,
      include: { tags: true },
    });
    return articles;
  }
  ```
- **カード表示:** Shadcn `Card` コンポーネント
  - タイトル、ソース、公開時刻
  - 感情スコアバッジ（色分け: ネガティブ=赤、ポジティブ=緑）
  - Impact Level バッジ（S=赤、A=オレンジ、B=黄、C=グレー）
  - バイアスラベル（Left=青、Right=赤、Center=グレー）
  - 3行要約（折りたたみ可能）
- **無限スクロール:** `react-intersection-observer` + TanStack Query の `useInfiniteQuery`
- **フィルター機能:**
  - ソース別（CNN, Fox News, Truth Social など）
  - Impact Level（S/A/B/C）
  - バイアス（Left/Center/Right）
  - タグ（選択式チェックボックス）
- **リアルタイム更新:**
  - SSE接続: `/api/stream`
  - 新着記事を画面上部にトースト通知 → クリックでタイムラインに追加

**「今日のトランプ指数」グラフ:**

- **実装:** Recharts `LineChart`
- **データ:** 1時間ごとの感情平均値

  ```typescript
  // tRPC endpoint: stats.getTrumpIndex
  async getTrumpIndex({ date }: { date: string }) {
    const articles = await prisma.article.findMany({
      where: {
        publishedAt: { gte: new Date(date), lte: new Date(`${date}T23:59:59`) }
      },
      select: { sentiment: true, publishedAt: true }
    });

    // 1時間ごとにグループ化
    const hourlyData = groupByHour(articles);
    return hourlyData; // [{ hour: '00:00', avgSentiment: 0.3 }, ...]
  }
  ```

- **表示:** X軸=時刻、Y軸=感情平均値（-1.0 ~ +1.0）
- **色:** 正=緑グラデーション、負=赤グラデーション
- **位置:** ダッシュボード右サイドバー上部

#### 2. Custom Alerts (`/alerts`)

**アラート設定フォーム:**

- **UI:** Shadcn `Form` + React Hook Form
- **入力項目:**
  - キーワード（例: "裁判", "選挙", "イーロン・マスク"）
  - 最低Impact Level（S/A/B/C のいずれか）
  - 通知方法（複数選択可）:
    - ☑ ブラウザプッシュ通知
    - ☑ メール
    - ☑ Discord Webhook
- **保存:** tRPC `alert.create` で `Alert` テーブルに保存
- **アラート一覧:** 設定済みアラートをカード表示（編集・削除可能）

**通知実装:**

**ブラウザプッシュ通知 (Web Push API):**

- **登録フロー:**
  1. ユーザーがアラート設定時にブラウザ通知許可をリクエスト
  2. `navigator.serviceWorker.register('/sw.js')`
  3. Push subscription 取得 → `User` テーブルに保存
     ```prisma
     model User {
       id              String  @id @default(uuid())
       email           String  @unique
       pushSubscription Json? // Web Push subscription object
       alerts          Alert[]
     }
     ```
- **通知送信:** `web-push` npm パッケージ（VAPID認証）

  ```typescript
  // NotificationModule
  async sendPushNotification(userId: string, article: Article) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.pushSubscription) return;

    await webpush.sendNotification(
      user.pushSubscription,
      JSON.stringify({
        title: `[${article.impactLevel}] ${article.title}`,
        body: article.summary[0],
        icon: '/icon-192.png',
        url: `/article/${article.id}`
      })
    );
  }
  ```

**メール通知:**

- **送信:** Resend API（無料枠: 3000通/月）
- **テンプレート:**
  ```html
  <h2>[{impactLevel}] {title}</h2>
  <p><strong>ソース:</strong> {source}</p>
  <p><strong>感情スコア:</strong> {sentiment}</p>
  <ul>
    <li>{summary[0]}</li>
    <li>{summary[1]}</li>
    <li>{summary[2]}</li>
  </ul>
  <a href="https://trumpalert.app/article/{id}">続きを読む</a>
  ```

**Discord Webhook:**

- **実装:** `axios.post(webhookUrl, { embeds: [...] })`
- **埋め込み形式:**
  ```typescript
  {
    embeds: [
      {
        title: article.title,
        url: article.url,
        color: impactLevel === 'S' ? 0xff0000 : 0xffa500,
        fields: [
          { name: 'ソース', value: article.source, inline: true },
          { name: '感情', value: article.sentiment.toString(), inline: true },
          { name: 'バイアス', value: article.bias, inline: true },
        ],
        description: article.summary.join('\n'),
      },
    ];
  }
  ```

#### 3. Fact Check Maker (`/fact-check`)

**相反する報道の並列表示:**

- **実装:** 同一トピックの左派・右派記事を並べて表示
- **マッチングロジック:**
  1. 記事タイトルから主要キーワード抽出（TF-IDFまたはOpenAI embeddings）
  2. 公開時刻が±6時間以内
  3. バイアスが "Left" vs "Right"
  4. 感情スコアの差が0.5以上
- **UI:** 2カラムレイアウト（左: Left bias、右: Right bias）
  - 各カラムに記事カード
  - 差分をハイライト（感情スコア、キーワードの色分け）
- **データ取得:**

  ```typescript
  // tRPC: factCheck.getComparisons
  async getComparisons() {
    const leftArticles = await prisma.article.findMany({
      where: { bias: 'Left' },
      orderBy: { publishedAt: 'desc' },
      take: 100
    });
    const rightArticles = await prisma.article.findMany({
      where: { bias: 'Right' },
      orderBy: { publishedAt: 'desc' },
      take: 100
    });

    // マッチングアルゴリズム
    return matchArticles(leftArticles, rightArticles);
  }
  ```

## 4. 非機能要件 (Non-Functional Requirements)

### パフォーマンス

**目標:**

- Core Web Vitals 全項目で緑色スコア
  - LCP（Largest Contentful Paint）< 2.5秒
  - FID（First Input Delay）< 100ms
  - CLS（Cumulative Layout Shift）< 0.1
- APIレスポンス < 200ms（95パーセンタイル）

**実装策:**

- **フロントエンド:**
  - Next.js Server Components でHTML先行レンダリング
  - 画像最適化: `next/image` 使用（WebP自動変換、遅延ロード）
  - フォント最適化: `next/font` でフォント自動最適化
  - Code splitting: 動的import `next/dynamic`（チャートコンポーネントなど）
  - Suspense境界設定: 各セクションごとにSkeletonローディング
- **バックエンド:**
  - データベースインデックス（前述）
  - Redis キャッシュ（トランプ指数、記事一覧の1時間キャッシュ）
  - Prisma接続プーリング（最大10接続）
  - tRPC batching 有効化（複数クエリを1リクエストに統合）
- **CDN:** Vercel Edge Network（静的アセット配信）

### 可用性

**クローラーBAN対策:**

- **Proxy使用:** ScraperAPI（`PROXY_URL` 環境変数で設定）
  - IP自動ローテーション
  - レート制限: 各サイト5秒間隔
- **User-Agent ローテーション:**
  ```typescript
  const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36...',
    // 計5パターン
  ];
  const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  ```
- **リトライ戦略:** 429/503エラー時は指数バックオフ（1分、2分、4分）
- **エラーモニタリング:** Sentry統合（エラー発生時にSlack通知）

**サービス可用性:**

- アップタイム目標: 99.5%（月間3.6時間のダウンタイム許容）
- ヘルスチェックエンドポイント: `/api/health`
  ```typescript
  // NestJS
  @Get('health')
  async health() {
    const dbOk = await prisma.$queryRaw`SELECT 1`;
    const redisOk = await redis.ping();
    return { status: 'ok', db: !!dbOk, redis: redisOk === 'PONG' };
  }
  ```

### 拡張性

**マイクロサービス化への準備:**

- NestJS モジュールを疎結合に設計
- 将来的な分離候補:
  - `CollectorService` → 独立Workerコンテナ
  - `AnalyzerService` → Lambda関数（AI処理のみ）
  - `NotificationService` → 独立キューワーカー
- イベント駆動アーキテクチャ:
  - 記事保存時に `article.created` イベント発行（Redis Pub/Sub）
  - Analyzer/Notifier がイベントを購読

**水平スケーリング:**

- RailwayでBackendコンテナを複数起動可能（ステートレス設計）
- BullMQワーカーもコンテナ追加で並列処理増強

### 型安全性

**tRPC統合:**

- `packages/shared/trpc/` に全ルーター定義
- Frontend から完全型付きでAPI呼び出し

  ```typescript
  // apps/web/lib/trpc.ts
  import { createTRPCReact } from '@trpc/react-query';
  import type { AppRouter } from '@trump-alert/shared/trpc';

  export const trpc = createTRPCReact<AppRouter>();

  // 使用例
  const { data } = trpc.article.list.useQuery({ limit: 50 });
  //     ^? { id: string, title: string, ... }[] （完全型推論）
  ```

**Zod バリデーション:**

- 全API入力を Zod スキーマで検証
  ```typescript
  // apps/api/src/article/article.router.ts
  export const articleRouter = router({
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100),
          offset: z.number().min(0).optional(),
        })
      )
      .query(async ({ input }) => {
        return prisma.article.findMany({
          take: input.limit,
          skip: input.offset,
        });
      }),
  });
  ```

## 5. データベース設計 (Prisma Schema)

**ファイル:** `packages/database/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Article {
  id          String   @id @default(uuid())
  title       String
  url         String   @unique
  source      String   // e.g., "Fox News", "Truth Social"
  content     String   @db.Text // 長文対応
  publishedAt DateTime
  imageUrl    String?  // OGP画像URL

  // AI Analysis Data
  summary     String[] // 3つの要点（配列）
  sentiment   Float?   // -1.0 to 1.0
  bias        String?  // "Left", "Right", "Center"
  impactLevel String   @default("C") // S, A, B, C

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  tags        Tag[]    @relation("ArticleTags")

  @@index([publishedAt(sort: Desc)]) // タイムライン取得用
  @@index([source, publishedAt(sort: Desc)]) // ソース別取得用
  @@index([impactLevel]) // アラートフィルタ用
}

model Tag {
  id       String    @id @default(uuid())
  name     String    @unique // e.g., "Tariff", "Vance", "Election"
  articles Article[] @relation("ArticleTags")

  @@index([name]) // タグ検索用
}

model User {
  id               String   @id @default(uuid())
  email            String   @unique
  name             String?
  emailVerified    DateTime?
  image            String?
  pushSubscription Json?    // Web Push subscription object
  discordWebhook   String?  // Discord Webhook URL
  language         String   @default("ja") // "ja" | "en"

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  alerts           Alert[]
  accounts         Account[]
  sessions         Session[]

  @@index([email])
}

model Alert {
  id        String   @id @default(uuid())
  keyword   String   // 監視キーワード（部分一致）
  minImpact String   // 通知する最低ランク: S, A, B, C

  // 通知方法（複数選択可）
  notifyPush    Boolean @default(false)
  notifyEmail   Boolean @default(false)
  notifyDiscord Boolean @default(false)

  isActive  Boolean  @default(true) // 有効/無効切り替え
  createdAt DateTime @default(now())

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isActive]) // アクティブなアラートのみ取得
}

model StockPrice {
  id        String   @id @default(uuid())
  symbol    String   // "DJT"
  price     Float
  change    Float    // 変動率 (%)
  volume    BigInt   // 出来高
  timestamp DateTime
  createdAt DateTime @default(now())

  @@index([symbol, timestamp(sort: Desc)]) // チャート表示用
}

// NextAuth.js のテーブル
model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**マイグレーション手順:**

```bash
cd packages/database
pnpm prisma migrate dev --name init
pnpm prisma generate
```

**Seed データ (`prisma/seed.ts`):**

```typescript
import { PrismaClient } from '../generated';

const prisma = new PrismaClient();

async function main() {
  // 初期タグ投入
  const tags = [
    'Election',
    'Trial',
    'Tariff',
    'Immigration',
    'Vance',
    'Musk',
    'Biden',
    'DeSantis',
    'Policy',
  ];

  for (const name of tags) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('✅ Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**実行:**

```bash
pnpm prisma db seed
```

## 6. 実装ロードマップ

### Phase 1 (MVP) - 2週間

**目標:** 基本的なニュース収集・分析・表示機能を完成させる。

**タスク:**

1. **モノレポ環境構築**
   - Turborepo + pnpm workspace セットアップ
   - `apps/web`, `apps/api`, `packages/database`, `packages/shared` 作成
   - ESLint/Prettier 設定、Git hooks（Husky）
   - 所要時間: 1日

2. **データベース・バックエンド基盤**
   - Prisma schema 作成（Article, Tag モデルのみ）
   - NestJS プロジェクト初期化
   - PostgreSQL（Supabase）接続
   - Redis（Upstash）接続
   - 所要時間: 2日

3. **ニュース収集実装**
   - `NewsCollector.service.ts` 作成
   - News API + RSS パーサー実装
   - 重複チェック（Redis）
   - BullMQ キュー設定（`news-fetch`, `ai-analysis`）
   - Cron ジョブ（5分間隔）
   - 所要時間: 3日

4. **AI分析実装**
   - OpenAI API 統合（`gpt-4o-mini`）
   - 要約・感情分析プロンプト実装
   - `AIAnalyzer.service.ts` 作成
   - エラーハンドリング・リトライロジック
   - 所要時間: 2日

5. **フロントエンド（タイムライン）**
   - Next.js プロジェクト作成（App Router）
   - Tailwind CSS + Shadcn/UI セットアップ
   - tRPC 統合（`article.list` エンドポイント）
   - タイムライン表示（カード形式）
   - 無限スクロール（TanStack Query）
   - 所要時間: 3日

6. **デプロイ**
   - Vercel（Frontend）デプロイ
   - Railway（Backend）デプロイ
   - 環境変数設定
   - ヘルスチェック確認
   - 所要時間: 1日

**成果物:** 動作する最小限のニュースアグリゲーター

---

### Phase 2 (Analysis) - 1週間

**目標:** データ可視化・分析機能を追加。

**タスク:**

1. **トランプ指数グラフ**
   - `stats.getTrumpIndex` tRPC エンドポイント
   - Recharts 統合
   - 1時間ごとの感情平均値計算
   - Redis キャッシュ（1時間）
   - 所要時間: 2日

2. **Truth Social スクレイピング**
   - Playwright セットアップ
   - `TruthSocialScraper.ts` 実装
   - Proxy（ScraperAPI）統合
   - User-Agent ローテーション
   - 所要時間: 3日

3. **バイアス分析強化**
   - `BIAS_PROMPT` 実装
   - ソース別デフォルトバイアス設定
   - フィルター機能追加（UI）
   - 所要時間: 2日

**成果物:** データ分析ダッシュボードの完成

---

### Phase 3 (Alerting) - 1週間

**目標:** ユーザー機能・通知システムを実装。

**タスク:**

1. **認証システム**
   - NextAuth.js セットアップ
   - メール認証（Resend）
   - User/Account/Session モデル追加
   - サインイン/サインアップページ
   - 所要時間: 2日

2. **カスタムアラート**
   - Alert モデル・tRPCルーター
   - アラート設定ページ（`/alerts`）
   - キーワードマッチングロジック
   - Impact Level フィルタリング
   - 所要時間: 2日

3. **通知実装**
   - Web Push（`web-push` パッケージ）
   - メール通知（Resend）
   - Discord Webhook
   - 通知送信ワーカー（BullMQ）
   - 所要時間: 2日

4. **翻訳機能（オプション）**
   - OpenAI 翻訳プロンプト
   - 記事詳細ページに「日本語で読む」ボタン
   - 所要時間: 1日

**成果物:** フル機能のトランプアラートシステム

---

### Phase 4 (Polish & Advanced Features) - 1週間

**目標:** UX改善・高度な機能追加。

**タスク:**

1. **Fact Check Maker**
   - 記事マッチングアルゴリズム
   - `/fact-check` ページ実装
   - 2カラムレイアウト
   - 所要時間: 3日

2. **パフォーマンス最適化**
   - データベースインデックス最適化
   - Redis キャッシュ戦略見直し
   - 画像最適化（WebP）
   - Lighthouse スコア改善
   - 所要時間: 2日

3. **モニタリング・ロギング**
   - Sentry 統合
   - ログ集約（Axiom または Logflare）
   - Slack 通知（エラー検知時）
   - 所要時間: 1日

4. **ドキュメント整備**
   - README.md 更新
   - API ドキュメント（tRPC自動生成）
   - デプロイ手順書
   - 所要時間: 1日

**成果物:** 本番運用可能なプロダクト

---

## 7. 開発開始コマンド

**前提条件:**

- Node.js 20.x インストール済み
- pnpm インストール済み（`npm install -g pnpm`）
- PostgreSQL/Redis アクセス情報取得済み（Supabase, Upstash）

**初期セットアップ:**

```bash
# 1. Turborepo 初期化
npx create-turbo@latest
# プロジェクト名: trump-alert
# パッケージマネージャー: pnpm

# 2. 必要なワークスペース作成
mkdir -p apps/web apps/api packages/database packages/shared packages/ui

# 3. Next.js (Frontend)
cd apps/web
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
cd ../..

# 4. NestJS (Backend)
cd apps/api
npx @nestjs/cli new . --package-manager pnpm --skip-git
cd ../..

# 5. Prisma (Database)
cd packages/database
pnpm init
pnpm add -D prisma
pnpm add @prisma/client
npx prisma init
# schema.prisma を上記の内容に置き換え
cd ../..

# 6. 共通パッケージ
cd packages/shared
pnpm init
pnpm add zod @trpc/server @trpc/client
cd ../..

# 7. 依存関係インストール
pnpm install

# 8. 環境変数設定
cp .env.example .env
# .env を編集（DATABASE_URL, REDIS_URL など）

# 9. データベースマイグレーション
cd packages/database
pnpm prisma migrate dev --name init
pnpm prisma generate
pnpm prisma db seed

# 10. 開発サーバー起動
cd ../..
pnpm dev
# apps/web: http://localhost:3000
# apps/api: http://localhost:3001
```

**一発で全て完了:**

```bash
# セットアップスクリプト作成
# scripts/setup.sh
chmod +x scripts/setup.sh
./scripts/setup.sh
```

これで「開発しろ」の一言で全工程が自動実行されます。
