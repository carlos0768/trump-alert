const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface GlossaryItem {
  term: string;
  termJa: string;
  type: 'person' | 'law' | 'treaty' | 'organization' | 'term';
  description: string;
}

export interface Article {
  id: string;
  title: string;
  titleJa?: string;
  url: string;
  source: string;
  content: string;
  contentJa?: string;
  publishedAt: string;
  imageUrl?: string;
  summary: string[];
  sentiment: number | null;
  bias: 'Left' | 'Center' | 'Right' | null;
  impactLevel: 'S' | 'A' | 'B' | 'C';
  tags: { id: string; name: string }[];
  glossary?: GlossaryItem[];
}

export interface ArticleFilters {
  sources?: string[];
  impactLevels?: string[];
  biases?: string[];
  timeRange?: string;
  search?: string;
}

export interface ArticlesResponse {
  articles: Article[];
  total: number;
  hasMore: boolean;
}

export interface TrumpIndexData {
  hour?: string;
  time?: string;
  avgSentiment?: number;
  sentiment?: number;
  articleCount: number;
}

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface TrendingTopic {
  rank: number;
  name: string;
  count: number;
}

export interface WeeklyData {
  day: string;
  date: string;
  articles: number;
  sentiment: number;
}

export interface SourceDistribution {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface AnalyticsOverview {
  totalArticles: number;
  weeklyArticles: number;
  avgSentiment: number;
  sourcesTracked: number;
  sourceDistribution: SourceDistribution[];
}

// Fetch articles with optional filters
export async function fetchArticles(
  limit = 50,
  offset = 0,
  filters?: ArticleFilters
): Promise<ArticlesResponse> {
  const params = new URLSearchParams();
  params.set('limit', limit.toString());
  params.set('offset', offset.toString());

  if (filters?.sources?.length) {
    params.set('sources', filters.sources.join(','));
  }
  if (filters?.impactLevels?.length) {
    params.set('impactLevels', filters.impactLevels.join(','));
  }
  if (filters?.biases?.length) {
    params.set('biases', filters.biases.join(','));
  }
  if (filters?.timeRange) {
    params.set('timeRange', filters.timeRange);
  }
  if (filters?.search) {
    params.set('search', filters.search);
  }

  const res = await fetch(`${API_URL}/api/articles?${params.toString()}`, {
    next: { revalidate: 30 }, // Cache for 30 seconds
  });

  if (!res.ok) {
    throw new Error('Failed to fetch articles');
  }

  return res.json();
}

// Fetch single article by ID
export async function fetchArticle(id: string): Promise<Article | null> {
  const res = await fetch(`${API_URL}/api/articles/${id}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

// Fetch related articles
export async function fetchRelatedArticles(
  id: string,
  limit = 5
): Promise<Article[]> {
  const res = await fetch(
    `${API_URL}/api/articles/${id}/related?limit=${limit}`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    return [];
  }

  return res.json();
}

// Fetch Trump Index data
export async function fetchTrumpIndex(
  date?: string
): Promise<TrumpIndexData[]> {
  const params = date ? `?date=${date}` : '';
  const res = await fetch(`${API_URL}/api/stats/trump-index${params}`, {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

// Fetch stock data
export async function fetchStockData(): Promise<StockData> {
  const res = await fetch(`${API_URL}/api/stats/stock`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return {
      symbol: 'DJT',
      price: 34.56,
      change: 2.34,
      changePercent: 7.26,
      volume: 12500000,
    };
  }

  return res.json();
}

// Fetch trending topics
export async function fetchTrendingTopics(
  limit = 10
): Promise<TrendingTopic[]> {
  const res = await fetch(`${API_URL}/api/stats/trending?limit=${limit}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

// Fetch daily stats
export async function fetchDailyStats() {
  const res = await fetch(`${API_URL}/api/stats/daily`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

// Fetch available sources
export async function fetchSources(): Promise<
  { name: string; count: number }[]
> {
  const res = await fetch(`${API_URL}/api/sources`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

// Fetch weekly stats
export async function fetchWeeklyStats(): Promise<WeeklyData[]> {
  const res = await fetch(`${API_URL}/api/stats/weekly`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

// Fetch analytics overview
export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview | null> {
  const res = await fetch(`${API_URL}/api/stats/analytics-overview`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

// Fact Check types and API
export interface ComparisonArticle {
  id: string;
  source: string;
  title: string;
  titleJa?: string;
  summary: string;
  sentiment: number;
  url: string;
  publishedAt: string;
}

export interface ComparisonPair {
  id: string;
  topic: string;
  topicJa?: string;
  left: ComparisonArticle | null;
  center: ComparisonArticle | null;
  right: ComparisonArticle | null;
  sentimentGap: number;
}

// Fetch fact check comparisons
export async function fetchFactCheckComparisons(
  limit = 10
): Promise<ComparisonPair[]> {
  const res = await fetch(`${API_URL}/api/fact-check?limit=${limit}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

// Fetch comparison by topic
export async function fetchComparisonByTopic(
  topic: string
): Promise<ComparisonPair | null> {
  const res = await fetch(
    `${API_URL}/api/fact-check/${encodeURIComponent(topic)}`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  if (data.error) {
    return null;
  }

  return data;
}

// Storyline types
export interface StorylineArticle {
  id: string;
  title: string;
  titleJa?: string;
  source: string;
  publishedAt: string;
  impactLevel: string;
  summary: string[];
}

export interface StorylineEvent {
  date: string;
  isKeyEvent: boolean;
  article: StorylineArticle;
}

export interface Storyline {
  id: string;
  title: string;
  titleJa?: string;
  description: string;
  descriptionJa?: string;
  status: 'ongoing' | 'resolved' | 'developing';
  category?: string;
  summary?: string;
  summaryJa?: string;
  firstEventAt: string;
  lastEventAt: string;
  eventCount: number;
  articles?: Array<{
    articleId: string;
    addedAt: string;
    isKeyEvent: boolean;
    article: StorylineArticle;
  }>;
}

export interface StorylineUpdate {
  id: string;
  title: string;
  titleJa?: string;
  status: string;
  lastEventAt: string;
  articles: Array<{
    article: {
      id: string;
      title: string;
      titleJa?: string;
      source: string;
      publishedAt: string;
    };
  }>;
}

// Fetch all storylines
export async function fetchStorylines(status?: string): Promise<Storyline[]> {
  const params = status ? `?status=${status}` : '';
  const res = await fetch(`${API_URL}/api/storylines${params}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.storylines || [];
}

// Fetch single storyline with timeline
export async function fetchStorylineTimeline(
  id: string
): Promise<{ storyline: Storyline; timeline: StorylineEvent[] } | null> {
  const res = await fetch(`${API_URL}/api/storylines/${id}/timeline`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

// Fetch recent storyline updates (for home feed)
export async function fetchRecentStorylineUpdates(
  limit = 5
): Promise<StorylineUpdate[]> {
  const res = await fetch(
    `${API_URL}/api/storylines/recent-updates?limit=${limit}`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.updates || [];
}

// Executive Order types
export interface ExecutiveOrder {
  id: string;
  documentNumber: string;
  executiveOrderNumber: number | null;
  type: 'executive_order' | 'proclamation' | 'memorandum' | 'other';
  title: string;
  titleJa: string | null;
  abstract: string | null;
  summaryJa: string | null;
  signingDate: string;
  publicationDate: string;
  htmlUrl: string;
  pdfUrl: string | null;
  president: string;
}

export interface ExecutiveOrdersResponse {
  orders: ExecutiveOrder[];
  total: number;
  hasMore: boolean;
}

// Fetch executive orders
export async function fetchExecutiveOrders(
  type?: string,
  limit = 20,
  offset = 0
): Promise<ExecutiveOrdersResponse> {
  const params = new URLSearchParams();
  params.set('limit', limit.toString());
  params.set('offset', offset.toString());
  if (type) {
    params.set('type', type);
  }

  const res = await fetch(
    `${API_URL}/api/executive-orders?${params.toString()}`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    return { orders: [], total: 0, hasMore: false };
  }

  return res.json();
}

// Fetch recent executive orders (for sidebar widget)
export async function fetchRecentExecutiveOrders(
  limit = 5
): Promise<ExecutiveOrder[]> {
  const res = await fetch(
    `${API_URL}/api/executive-orders/recent?limit=${limit}`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.orders || [];
}

// Fetch single executive order
export async function fetchExecutiveOrder(
  id: string
): Promise<ExecutiveOrder | null> {
  const res = await fetch(`${API_URL}/api/executive-orders/${id}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.order || null;
}
