// News Sources Configuration
export const NEWS_SOURCES = {
  // Left-leaning
  CNN: { name: 'CNN', bias: 'Left', url: 'https://cnn.com' },
  MSNBC: { name: 'MSNBC', bias: 'Left', url: 'https://msnbc.com' },
  NYT: { name: 'New York Times', bias: 'Left', url: 'https://nytimes.com' },
  WAPO: {
    name: 'Washington Post',
    bias: 'Left',
    url: 'https://washingtonpost.com',
  },

  // Center
  BBC: { name: 'BBC', bias: 'Center', url: 'https://bbc.com' },
  REUTERS: { name: 'Reuters', bias: 'Center', url: 'https://reuters.com' },
  AP: { name: 'Associated Press', bias: 'Center', url: 'https://apnews.com' },
  NHK: { name: 'NHK', bias: 'Center', url: 'https://www3.nhk.or.jp' },

  // Right-leaning
  FOX: { name: 'Fox News', bias: 'Right', url: 'https://foxnews.com' },
  NEWSMAX: { name: 'Newsmax', bias: 'Right', url: 'https://newsmax.com' },
  BREITBART: { name: 'Breitbart', bias: 'Right', url: 'https://breitbart.com' },
  DAILYWIRE: {
    name: 'The Daily Wire',
    bias: 'Right',
    url: 'https://dailywire.com',
  },

  // Social Media
  TRUTHSOCIAL: {
    name: 'Truth Social',
    bias: 'Right',
    url: 'https://truthsocial.com',
  },
  TWITTER: { name: 'X (Twitter)', bias: 'Center', url: 'https://twitter.com' },
} as const;

export type NewsSourceKey = keyof typeof NEWS_SOURCES;

// RSS Feed URLs
export const RSS_FEEDS = {
  CNN_POLITICS: 'http://rss.cnn.com/rss/cnn_allpolitics.rss',
  FOX_POLITICS: 'https://moxie.foxnews.com/google-publisher/politics.xml',
  BBC_US: 'http://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml',
  NHK_WORLD: 'https://www3.nhk.or.jp/rss/news/cat6.xml',
  REUTERS_US:
    'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
} as const;

// API Rate Limits (requests per minute)
export const RATE_LIMITS = {
  NEWS_API: 100,
  OPENAI: 60,
  TRUTH_SOCIAL: 20,
  TWITTER: 15,
  ALPHA_VANTAGE: 5,
} as const;

// Impact Level Colors (for UI)
export const IMPACT_COLORS = {
  S: { bg: '#dc2626', text: '#ffffff' },
  A: { bg: '#f97316', text: '#ffffff' },
  B: { bg: '#eab308', text: '#000000' },
  C: { bg: '#6b7280', text: '#ffffff' },
} as const;

// Bias Colors (for UI)
export const BIAS_COLORS = {
  Left: { bg: '#3b82f6', text: '#ffffff' },
  Center: { bg: '#6b7280', text: '#ffffff' },
  Right: { bg: '#ef4444', text: '#ffffff' },
} as const;

// Sentiment Thresholds
export const SENTIMENT_THRESHOLDS = {
  VERY_NEGATIVE: -0.6,
  NEGATIVE: -0.2,
  NEUTRAL: 0.2,
  POSITIVE: 0.6,
  VERY_POSITIVE: 1.0,
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  ARTICLE_LIST: 60,
  TRUMP_INDEX: 300,
  STOCK_PRICE: 60,
  USER_SESSION: 86400,
} as const;

// Job Queue Names
export const QUEUE_NAMES = {
  NEWS_FETCH: 'news-fetch',
  SOCIAL_SCRAPE: 'social-scrape',
  AI_ANALYSIS: 'ai-analysis',
  NOTIFICATION: 'notification-send',
} as const;

// User-Agent strings for scraping
export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
] as const;

export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}
