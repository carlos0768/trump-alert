import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

interface AlphaVantageQuote {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}

interface YahooFinanceQuote {
  chart?: {
    result?: Array<{
      meta: {
        symbol: string;
        regularMarketPrice: number;
        previousClose: number;
        regularMarketVolume: number;
      };
      indicators?: {
        quote?: Array<{
          open: number[];
          close: number[];
          high: number[];
          low: number[];
          volume: number[];
        }>;
      };
    }>;
  };
}

@Injectable()
export class StockCollectorService {
  private readonly logger = new Logger(StockCollectorService.name);
  private readonly symbol = 'DJT';

  // Alpha Vantage API (requires free API key)
  private readonly alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;

  constructor(private prisma: PrismaService) {}

  // Run every 5 minutes during market hours (9:30 AM - 4:00 PM EST, Mon-Fri)
  @Cron('*/5 9-16 * * 1-5')
  async collectStockData() {
    if (process.env.ENABLE_STOCK_COLLECTION !== 'true') {
      return;
    }
    this.logger.log('Collecting DJT stock data...');
    await this.fetchAndSaveStockData();
  }

  async fetchAndSaveStockData(): Promise<void> {
    try {
      // Try Yahoo Finance first (no API key required)
      const quote = await this.fetchFromYahooFinance();

      if (quote) {
        await this.saveStockPrice(quote);
        this.logger.log(`Saved DJT stock price: $${quote.price.toFixed(2)}`);
        return;
      }

      // Fallback to Alpha Vantage if configured
      if (this.alphaVantageApiKey) {
        const alphaQuote = await this.fetchFromAlphaVantage();
        if (alphaQuote) {
          await this.saveStockPrice(alphaQuote);
          this.logger.log(
            `Saved DJT stock price (Alpha Vantage): $${alphaQuote.price.toFixed(2)}`
          );
          return;
        }
      }

      this.logger.warn('Failed to fetch stock data from all sources');
    } catch (error) {
      this.logger.error(`Error collecting stock data: ${error}`);
    }
  }

  private async fetchFromYahooFinance(): Promise<{
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    high: number;
    low: number;
    open: number;
  } | null> {
    try {
      // Yahoo Finance API (unofficial, might need rotation)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${this.symbol}?interval=1d&range=1d`;

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Yahoo Finance API returned ${response.status}`);
        return null;
      }

      const data = (await response.json()) as YahooFinanceQuote;
      const result = data.chart?.result?.[0];

      if (!result) {
        this.logger.warn('No data in Yahoo Finance response');
        return null;
      }

      const meta = result.meta;
      const price = meta.regularMarketPrice;
      const previousClose = meta.previousClose;
      const change = price - previousClose;
      const changePercent = (change / previousClose) * 100;

      // Get OHLV from indicators
      const quote = result.indicators?.quote?.[0];
      const lastIndex = (quote?.close?.length ?? 1) - 1;

      return {
        price,
        change,
        changePercent,
        volume: meta.regularMarketVolume || 0,
        high: quote?.high?.[lastIndex] ?? price,
        low: quote?.low?.[lastIndex] ?? price,
        open: quote?.open?.[lastIndex] ?? previousClose,
      };
    } catch (error) {
      this.logger.warn(`Yahoo Finance fetch error: ${error}`);
      return null;
    }
  }

  private async fetchFromAlphaVantage(): Promise<{
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    high: number;
    low: number;
    open: number;
  } | null> {
    if (!this.alphaVantageApiKey) {
      return null;
    }

    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${this.symbol}&apikey=${this.alphaVantageApiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.warn(`Alpha Vantage API returned ${response.status}`);
        return null;
      }

      const data = (await response.json()) as AlphaVantageQuote;
      const quote = data['Global Quote'];

      if (!quote || !quote['05. price']) {
        this.logger.warn('No data in Alpha Vantage response');
        return null;
      }

      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercentStr = quote['10. change percent'].replace('%', '');

      return {
        price,
        change,
        changePercent: parseFloat(changePercentStr),
        volume: parseInt(quote['06. volume'], 10),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open']),
      };
    } catch (error) {
      this.logger.warn(`Alpha Vantage fetch error: ${error}`);
      return null;
    }
  }

  private async saveStockPrice(data: {
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    high: number;
    low: number;
    open: number;
  }): Promise<void> {
    await this.prisma.stockPrice.create({
      data: {
        symbol: this.symbol,
        price: data.price,
        change: data.changePercent, // Store change percent in the change field
        volume: BigInt(data.volume),
        timestamp: new Date(),
      },
    });
  }

  // Manual trigger for testing
  async triggerCollection(): Promise<{
    success: boolean;
    price?: number;
    message: string;
  }> {
    this.logger.log('Manual stock collection triggered');
    try {
      await this.fetchAndSaveStockData();

      // Get the latest price
      const latest = await this.prisma.stockPrice.findFirst({
        where: { symbol: this.symbol },
        orderBy: { timestamp: 'desc' },
      });

      if (latest) {
        return {
          success: true,
          price: latest.price,
          message: `Successfully collected DJT stock data: $${latest.price.toFixed(2)}`,
        };
      }

      return {
        success: false,
        message: 'Failed to collect stock data',
      };
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error}`,
      };
    }
  }
}
