import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  chromium,
  Browser,
  Page,
  Response,
  BrowserContext,
  Locator,
} from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

// Truth Social API base URL (Mastodon compatible)
const TRUTH_API_BASE = 'https://truthsocial.com/api/v1';
const TRUMP_ACCOUNT_ID = '107780257626128497'; // Trump's account ID on Truth Social

interface TruthPost {
  id: string;
  text: string;
  url: string;
  timestamp: Date;
  imageUrl?: string;
  repostCount?: number;
  likeCount?: number;
}

interface TruthApiStatus {
  id: string;
  content: string;
  created_at: string;
  url: string;
  reblogs_count?: number;
  favourites_count?: number;
  replies_count?: number;
  in_reply_to_id?: string | null;
  reblog?: TruthApiStatus | null;
  media_attachments?: Array<{
    type: string;
    url: string;
    preview_url?: string;
  }>;
  account?: {
    id: string;
    username: string;
    display_name: string;
  };
}

@Injectable()
export class TruthSocialScraperService {
  private readonly logger = new Logger(TruthSocialScraperService.name);
  private browser: Browser | null = null;
  private capturedStatuses: TruthApiStatus[] = [];
  private readonly cookiePath = path.join(
    process.cwd(),
    '.truth-social-cookies.json'
  );
  private accessToken: string | null = null;

  constructor(private prisma: PrismaService) {}

  // Run every 5 minutes
  @Cron('*/5 * * * *')
  async scrapeTruthSocial() {
    if (process.env.ENABLE_SCRAPING !== 'true') {
      return;
    }
    this.logger.log('Starting Truth Social scrape...');
    await this.scrape();
  }

  async scrape(): Promise<number> {
    let newPostsCount = 0;

    // Try direct API first (faster, more reliable)
    try {
      const posts = await this.fetchFromApi();
      if (posts.length > 0) {
        this.logger.log(`Fetched ${posts.length} posts from API`);
        for (const post of posts) {
          const saved = await this.savePost(post);
          if (saved) {
            newPostsCount++;
          }
        }
        this.logger.log(`Saved ${newPostsCount} new Truth Social posts`);
        return newPostsCount;
      }
    } catch (error) {
      this.logger.warn(`API fetch failed: ${error}, falling back to browser`);
    }

    // Fallback to browser scraping
    return this.scrapeWithBrowser();
  }

  /**
   * Fetch posts directly from Truth Social API (Mastodon compatible)
   */
  private async fetchFromApi(): Promise<TruthPost[]> {
    const posts: TruthPost[] = [];

    try {
      // Truth Social public API endpoints
      const urls = [
        // Public statuses endpoint
        `${TRUTH_API_BASE}/accounts/${TRUMP_ACCOUNT_ID}/statuses?limit=40&exclude_replies=true`,
        // Alternative: timelines endpoint
        `${TRUTH_API_BASE}/timelines/public?limit=40&only_media=false`,
      ];

      for (const url of urls) {
        try {
          const headers: Record<string, string> = {
            Accept: 'application/json',
            'User-Agent': this.getRandomUserAgent(),
            Origin: 'https://truthsocial.com',
            Referer: 'https://truthsocial.com/@realDonaldTrump',
          };

          // Add auth token if available
          if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
          }

          const response = await fetch(url, { headers });

          if (response.ok) {
            const data = (await response.json()) as TruthApiStatus[];
            if (Array.isArray(data) && data.length > 0) {
              const parsed = this.parseApiStatuses(data);
              posts.push(...parsed);
              this.logger.log(`Got ${parsed.length} posts from ${url}`);
              break; // Success, no need to try other URLs
            }
          } else {
            this.logger.warn(`API returned ${response.status} for ${url}`);
          }
        } catch (e) {
          this.logger.warn(`Failed to fetch from ${url}: ${e}`);
        }
      }
    } catch (error) {
      this.logger.error(`API fetch error: ${error}`);
    }

    return posts;
  }

  /**
   * Browser-based scraping with session persistence
   */
  private async scrapeWithBrowser(): Promise<number> {
    let newPostsCount = 0;
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        this.capturedStatuses = [];

        this.browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
          ],
        });

        // Create context with persisted cookies
        const context = await this.createContextWithCookies();
        const page = await context.newPage();

        // Capture API responses
        page.on('response', async (response: Response) => {
          try {
            const url = response.url();
            // Capture various API endpoints
            if (
              url.includes('/api/v1/accounts/') &&
              url.includes('/statuses')
            ) {
              const data = await response.json();
              if (Array.isArray(data)) {
                this.capturedStatuses.push(...data);
              }
            }
            // Also capture timeline data
            if (url.includes('/api/v1/timelines/')) {
              const data = await response.json();
              if (Array.isArray(data)) {
                this.capturedStatuses.push(...data);
              }
            }
            // Capture OAuth token if available
            if (url.includes('/oauth/token')) {
              const data = await response.json();
              if (data.access_token) {
                this.accessToken = data.access_token;
                this.logger.log('Captured access token');
              }
            }
          } catch {
            // Ignore parse errors
          }
        });

        // Navigate to Trump's profile
        this.logger.log('Navigating to Truth Social...');
        await page.goto('https://truthsocial.com/@realDonaldTrump', {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });

        // Wait for content
        await this.waitForContent(page);

        // Scroll to load more content
        await this.scrollToLoadMore(page);

        // Save cookies for next time
        await this.saveCookies(context);

        // Process captured statuses
        let posts: TruthPost[] = [];

        if (this.capturedStatuses.length > 0) {
          this.logger.log(
            `Captured ${this.capturedStatuses.length} statuses from API`
          );
          posts = this.parseApiStatuses(this.capturedStatuses);
        }

        // Fallback to DOM scraping
        if (posts.length === 0) {
          this.logger.log('No API data, falling back to DOM scraping...');
          posts = await this.extractPostsFromDOM(page);
        }

        this.logger.log(`Found ${posts.length} posts total`);

        for (const post of posts) {
          const saved = await this.savePost(post);
          if (saved) {
            newPostsCount++;
          }
        }

        await this.browser.close();
        this.browser = null;
        break;
      } catch (error) {
        retryCount++;
        this.logger.error(
          `Scraping attempt ${retryCount}/${maxRetries} failed: ${error}`
        );

        if (this.browser) {
          await this.browser.close();
          this.browser = null;
        }

        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000;
          this.logger.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.log(`Saved ${newPostsCount} new Truth Social posts`);
    return newPostsCount;
  }

  /**
   * Create browser context with persisted cookies
   */
  private async createContextWithCookies(): Promise<BrowserContext> {
    const contextOptions = {
      userAgent: this.getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
    };

    // Try to load saved cookies
    try {
      if (fs.existsSync(this.cookiePath)) {
        const cookieData = fs.readFileSync(this.cookiePath, 'utf-8');
        const { cookies, localStorage } = JSON.parse(cookieData);

        const context = await this.browser!.newContext({
          ...contextOptions,
          storageState: {
            cookies: cookies || [],
            origins: localStorage || [],
          },
        });

        this.logger.log('Loaded saved cookies');
        return context;
      }
    } catch (e) {
      this.logger.warn(`Failed to load cookies: ${e}`);
    }

    return this.browser!.newContext(contextOptions);
  }

  /**
   * Save cookies for session persistence
   */
  private async saveCookies(context: BrowserContext): Promise<void> {
    try {
      const storageState = await context.storageState();
      fs.writeFileSync(
        this.cookiePath,
        JSON.stringify({
          cookies: storageState.cookies,
          localStorage: storageState.origins,
        })
      );
      this.logger.log('Saved cookies for next session');
    } catch (e) {
      this.logger.warn(`Failed to save cookies: ${e}`);
    }
  }

  /**
   * Scroll page to trigger lazy loading
   */
  private async scrollToLoadMore(page: Page): Promise<void> {
    try {
      // Scroll down multiple times to load more content
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
        await page.waitForTimeout(1500);
      }
      // Scroll back up
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
    } catch (e) {
      this.logger.warn(`Scroll failed: ${e}`);
    }
  }

  private async waitForContent(page: Page): Promise<void> {
    const selectors = [
      'article',
      '[data-testid="status"]',
      '.status',
      '.status-card',
      '[role="article"]',
      '.timeline-item',
      '[class*="status"]',
    ];

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        this.logger.log(`Found content with selector: ${selector}`);
        await page.waitForTimeout(2000);
        return;
      } catch {
        continue;
      }
    }

    this.logger.warn('No specific content selector found, waiting...');
    await page.waitForTimeout(5000);
  }

  private parseApiStatuses(statuses: TruthApiStatus[]): TruthPost[] {
    return statuses
      .filter((status) => {
        // Filter for Trump's posts only (not reblogs from others)
        if (status.reblog) {
          return false;
        }
        // Must have content
        if (!status.content || status.content.length === 0) {
          return false;
        }
        // Skip replies unless they're from Trump
        if (
          status.in_reply_to_id &&
          status.account?.username !== 'realDonaldTrump'
        ) {
          return false;
        }
        return true;
      })
      .map((status) => {
        // Strip HTML tags from content
        const textContent = status.content
          .replace(/<[^>]*>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const imageUrl =
          status.media_attachments?.find((m) => m.type === 'image')?.url ||
          status.media_attachments?.find((m) => m.type === 'image')
            ?.preview_url;

        return {
          id: status.id,
          text: textContent,
          url:
            status.url ||
            `https://truthsocial.com/@realDonaldTrump/posts/${status.id}`,
          timestamp: new Date(status.created_at),
          imageUrl,
          repostCount: status.reblogs_count,
          likeCount: status.favourites_count,
        };
      });
  }

  private async extractPostsFromDOM(page: Page): Promise<TruthPost[]> {
    const posts: TruthPost[] = [];

    try {
      const articleSelectors = [
        'article',
        '[data-testid="status"]',
        '.status',
        '[role="article"]',
        '.timeline-item',
        '[class*="status-card"]',
      ];

      let articles: Locator[] = [];

      for (const selector of articleSelectors) {
        articles = await page.locator(selector).all();
        if (articles.length > 0) {
          this.logger.log(
            `Found ${articles.length} articles with selector: ${selector}`
          );
          break;
        }
      }

      for (const article of articles.slice(0, 20)) {
        try {
          const textSelectors = [
            '[data-testid="post-text"]',
            '[data-testid="status-content"]',
            '.status-content',
            '.status-content__text',
            '.post-content',
            '.e-content',
            'p',
          ];

          let text = '';
          for (const selector of textSelectors) {
            const textElement = article.locator(selector).first();
            if ((await textElement.count()) > 0) {
              text = await textElement.innerText();
              if (text && text.length > 10) break;
            }
          }

          if (!text || text.length < 10) {
            text = await article.innerText();
          }

          const timeElement = article.locator('time').first();
          const datetime =
            (await timeElement.count()) > 0
              ? await timeElement.getAttribute('datetime')
              : null;

          const linkSelectors = [
            'a[href*="/posts/"]',
            'a[href*="/statuses/"]',
            'a[href*="/@"]',
            '.status__relative-time',
          ];

          let href = null;
          for (const selector of linkSelectors) {
            const linkElement = article.locator(selector).first();
            if ((await linkElement.count()) > 0) {
              href = await linkElement.getAttribute('href');
              if (
                href &&
                (href.includes('/posts/') || href.includes('/statuses/'))
              ) {
                break;
              }
            }
          }

          const imgElement = article
            .locator('img.status-card__image, img[src*="media"]')
            .first();
          const imageUrl =
            (await imgElement.count()) > 0
              ? await imgElement.getAttribute('src')
              : null;

          if (text && text.length > 10) {
            const id = this.hashString(text.substring(0, 100));

            posts.push({
              id,
              text: text.trim().substring(0, 2000),
              url: href
                ? href.startsWith('http')
                  ? href
                  : `https://truthsocial.com${href}`
                : `https://truthsocial.com/@realDonaldTrump`,
              timestamp: datetime ? new Date(datetime) : new Date(),
              imageUrl: imageUrl || undefined,
            });
          }
        } catch (e) {
          this.logger.debug(`Error extracting article: ${e}`);
          continue;
        }
      }
    } catch (error) {
      this.logger.error(`Error extracting posts from DOM: ${error}`);
    }

    return posts;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private async savePost(post: TruthPost) {
    const existing = await this.prisma.article.findFirst({
      where: {
        OR: [
          { url: post.url },
          {
            source: 'Truth Social',
            content: { contains: post.text.substring(0, 50) },
          },
        ],
      },
    });

    if (existing) {
      return null;
    }

    try {
      const article = await this.prisma.article.create({
        data: {
          title:
            post.text.substring(0, 100) + (post.text.length > 100 ? '...' : ''),
          url: post.url,
          source: 'Truth Social',
          content: post.text,
          publishedAt: post.timestamp,
          imageUrl: post.imageUrl,
          bias: 'Right',
          impactLevel: this.determineImpactLevel(post),
          summary: [],
        },
      });

      this.logger.log(`Saved new Truth Social post: ${article.id}`);
      return article;
    } catch (error) {
      this.logger.error(`Failed to save Truth Social post: ${error}`);
      return null;
    }
  }

  private determineImpactLevel(post: TruthPost): 'S' | 'A' | 'B' | 'C' {
    const engagement = (post.repostCount || 0) + (post.likeCount || 0);

    if (engagement > 50000) return 'S';
    if (engagement > 10000) return 'A';
    if (engagement > 1000) return 'B';

    const importantKeywords = [
      'announcement',
      'breaking',
      'election',
      'indictment',
      'court',
      'trial',
      'tariff',
      'china',
      'border',
      'emergency',
      'executive order',
      'i will',
      'we will',
    ];

    const textLower = post.text.toLowerCase();
    if (importantKeywords.some((keyword) => textLower.includes(keyword))) {
      return 'A';
    }

    return 'B';
  }

  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  // Manual trigger for testing
  async triggerScrape(): Promise<{ scraped: number; message: string }> {
    this.logger.log('Manual scrape triggered');
    const count = await this.scrape();
    return {
      scraped: count,
      message:
        count > 0
          ? `Successfully scraped ${count} new posts from Truth Social`
          : 'No new posts found or scraping failed',
    };
  }

  // Login to Truth Social (requires credentials in env)
  async login(): Promise<boolean> {
    const email = process.env.TRUTH_SOCIAL_EMAIL;
    const password = process.env.TRUTH_SOCIAL_PASSWORD;

    if (!email || !password) {
      this.logger.warn('Truth Social credentials not configured');
      return false;
    }

    try {
      this.browser = await chromium.launch({ headless: true });
      const context = await this.browser.newContext({
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
      });

      const page = await context.newPage();

      // Navigate to login page
      await page.goto('https://truthsocial.com/login', {
        waitUntil: 'networkidle',
      });

      // Fill login form
      await page.fill('input[name="email"], input[type="email"]', email);
      await page.fill(
        'input[name="password"], input[type="password"]',
        password
      );

      // Click login button
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForNavigation({ timeout: 30000 });

      // Check if login was successful
      const currentUrl = page.url();
      if (!currentUrl.includes('/login')) {
        // Save cookies
        await this.saveCookies(context);
        this.logger.log('Successfully logged in to Truth Social');
        await this.browser.close();
        return true;
      }

      this.logger.error('Login failed - still on login page');
      await this.browser.close();
      return false;
    } catch (error) {
      this.logger.error(`Login error: ${error}`);
      if (this.browser) {
        await this.browser.close();
      }
      return false;
    }
  }
}
