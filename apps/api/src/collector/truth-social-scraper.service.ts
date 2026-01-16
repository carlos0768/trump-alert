import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { chromium, Browser, Page } from 'playwright';
import { PrismaClient } from '@prisma/client';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

const prisma = new PrismaClient();

interface TruthPost {
  text: string;
  url: string;
  timestamp: Date;
}

@Injectable()
export class TruthSocialScraperService {
  private readonly logger = new Logger(TruthSocialScraperService.name);
  private browser: Browser | null = null;

  // Run every minute (disabled by default)
  @Cron('*/1 * * * *')
  async scrapeTruthSocial() {
    if (process.env.ENABLE_SCRAPING !== 'true') {
      return;
    }
    this.logger.log('Starting Truth Social scrape...');
    await this.scrape();
  }

  async scrape(): Promise<number> {
    let newPostsCount = 0;

    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await this.browser.newContext({
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
      });

      const page = await context.newPage();

      // Navigate to Trump's Truth Social page
      await page.goto('https://truthsocial.com/@realDonaldTrump', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Wait for posts to load
      await page.waitForSelector('article', { timeout: 10000 });

      // Extract posts
      const posts = await this.extractPosts(page);
      this.logger.log(`Found ${posts.length} posts`);

      for (const post of posts) {
        const saved = await this.savePost(post);
        if (saved) {
          newPostsCount++;
        }
      }

      await this.browser.close();
      this.browser = null;
    } catch (error) {
      this.logger.error(`Scraping error: ${error}`);
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }

    this.logger.log(`Saved ${newPostsCount} new Truth Social posts`);
    return newPostsCount;
  }

  private async extractPosts(page: Page): Promise<TruthPost[]> {
    const posts: TruthPost[] = [];

    try {
      const articles = await page.$$('article');

      for (const article of articles.slice(0, 10)) {
        // Get first 10 posts
        try {
          // Extract text content
          const textElement = await article.$(
            '[data-testid="post-text"], .status-content, .post-content'
          );
          const text = textElement
            ? await textElement.innerText()
            : await article.innerText();

          // Extract timestamp
          const timeElement = await article.$('time');
          const datetime = timeElement
            ? await timeElement.getAttribute('datetime')
            : null;

          // Extract URL
          const linkElement = await article.$(
            'a[href*="/posts/"], a[href*="/statuses/"]'
          );
          const href = linkElement
            ? await linkElement.getAttribute('href')
            : null;

          if (text && text.length > 10) {
            posts.push({
              text: text.trim(),
              url: href
                ? `https://truthsocial.com${href}`
                : `https://truthsocial.com/@realDonaldTrump`,
              timestamp: datetime ? new Date(datetime) : new Date(),
            });
          }
        } catch (e) {
          // Skip problematic articles
          continue;
        }
      }
    } catch (error) {
      this.logger.error(`Error extracting posts: ${error}`);
    }

    return posts;
  }

  private async savePost(post: TruthPost) {
    // Check if already exists
    const existing = await prisma.article.findFirst({
      where: {
        source: 'Truth Social',
        content: { contains: post.text.substring(0, 100) },
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
          bias: 'Right',
          impactLevel: 'B', // Truth Social posts default to B
          summary: [],
        },
      });
      return article;
    } catch (error) {
      this.logger.error(`Failed to save Truth Social post: ${error}`);
      return null;
    }
  }

  private getRandomUserAgent(): string {
    const agents = USER_AGENTS || [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  // Manual trigger for testing
  async triggerScrape(): Promise<{ scraped: number }> {
    const count = await this.scrape();
    return { scraped: count };
  }
}
