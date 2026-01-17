import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { chromium, Browser, Page, Response } from 'playwright';
import { PrismaClient } from '@prisma/client';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

const prisma = new PrismaClient();

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
  media_attachments?: Array<{
    type: string;
    url: string;
    preview_url?: string;
  }>;
}

@Injectable()
export class TruthSocialScraperService {
  private readonly logger = new Logger(TruthSocialScraperService.name);
  private browser: Browser | null = null;
  private capturedStatuses: TruthApiStatus[] = [];

  // Run every 5 minutes (more reasonable rate)
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

        const context = await this.browser.newContext({
          userAgent: this.getRandomUserAgent(),
          viewport: { width: 1920, height: 1080 },
          locale: 'en-US',
          timezoneId: 'America/New_York',
        });

        const page = await context.newPage();

        // Capture API responses for status data
        page.on('response', async (response: Response) => {
          try {
            const url = response.url();
            if (
              url.includes('/api/v1/accounts/') &&
              url.includes('/statuses')
            ) {
              const data = await response.json();
              if (Array.isArray(data)) {
                this.capturedStatuses.push(...data);
              }
            }
          } catch {
            // Ignore JSON parse errors
          }
        });

        // Navigate to Trump's Truth Social page
        this.logger.log('Navigating to Truth Social...');
        await page.goto('https://truthsocial.com/@realDonaldTrump', {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });

        // Wait for content to load
        await this.waitForContent(page);

        // Try to extract posts from API responses first
        let posts: TruthPost[] = [];

        if (this.capturedStatuses.length > 0) {
          this.logger.log(
            `Captured ${this.capturedStatuses.length} statuses from API`
          );
          posts = this.parseApiStatuses(this.capturedStatuses);
        }

        // Fallback to DOM scraping if no API data
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
        break; // Success, exit retry loop
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
          // Exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          this.logger.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.log(`Saved ${newPostsCount} new Truth Social posts`);
    return newPostsCount;
  }

  private async waitForContent(page: Page): Promise<void> {
    const selectors = [
      'article',
      '[data-testid="status"]',
      '.status',
      '.status-card',
      '[role="article"]',
      '.timeline-item',
    ];

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        this.logger.log(`Found content with selector: ${selector}`);
        // Wait a bit more for dynamic content
        await page.waitForTimeout(2000);
        return;
      } catch {
        continue;
      }
    }

    // If no specific selector found, just wait
    this.logger.warn('No specific content selector found, waiting...');
    await page.waitForTimeout(5000);
  }

  private parseApiStatuses(statuses: TruthApiStatus[]): TruthPost[] {
    return statuses
      .filter((status) => status.content && status.content.length > 0)
      .map((status) => {
        // Strip HTML tags from content
        const textContent = status.content
          .replace(/<[^>]*>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();

        // Get image URL if available
        const imageUrl =
          status.media_attachments?.find((m) => m.type === 'image')?.url ||
          status.media_attachments?.find((m) => m.type === 'image')
            ?.preview_url;

        return {
          id: status.id,
          text: textContent,
          url:
            status.url ||
            `https://truthsocial.com/@realDonaldTrump/${status.id}`,
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
      // Multiple selector strategies
      const articleSelectors = [
        'article',
        '[data-testid="status"]',
        '.status',
        '[role="article"]',
        '.timeline-item',
      ];

      let articles: any[] = [];

      for (const selector of articleSelectors) {
        articles = await page.$$(selector);
        if (articles.length > 0) {
          this.logger.log(
            `Found ${articles.length} articles with selector: ${selector}`
          );
          break;
        }
      }

      for (const article of articles.slice(0, 15)) {
        try {
          // Multiple text selectors
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
            const textElement = await article.$(selector);
            if (textElement) {
              text = await textElement.innerText();
              if (text && text.length > 10) break;
            }
          }

          // If no specific text element, try the whole article
          if (!text || text.length < 10) {
            text = await article.innerText();
          }

          // Extract timestamp
          const timeElement = await article.$('time');
          const datetime = timeElement
            ? await timeElement.getAttribute('datetime')
            : null;

          // Extract URL
          const linkSelectors = [
            'a[href*="/posts/"]',
            'a[href*="/statuses/"]',
            'a[href*="/@"]',
            '.status__relative-time',
          ];

          let href = null;
          for (const selector of linkSelectors) {
            const linkElement = await article.$(selector);
            if (linkElement) {
              href = await linkElement.getAttribute('href');
              if (
                href &&
                (href.includes('/posts/') || href.includes('/statuses/'))
              ) {
                break;
              }
            }
          }

          // Extract image URL
          const imgElement = await article.$(
            'img.status-card__image, img[src*="media"]'
          );
          const imageUrl = imgElement
            ? await imgElement.getAttribute('src')
            : null;

          if (text && text.length > 10) {
            // Generate a unique ID from the text hash
            const id = this.hashString(text.substring(0, 100));

            posts.push({
              id,
              text: text.trim().substring(0, 2000), // Limit text length
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
          // Skip problematic articles
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
    // Check if already exists by URL or similar content
    const existing = await prisma.article.findFirst({
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
      const article = await prisma.article.create({
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
    // Determine impact based on engagement and content
    const engagement = (post.repostCount || 0) + (post.likeCount || 0);

    if (engagement > 50000) return 'S';
    if (engagement > 10000) return 'A';
    if (engagement > 1000) return 'B';

    // Also check for important keywords
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
}
