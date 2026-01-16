import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaClient } from '@trump-alert/database';

const prisma = new PrismaClient();

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  // Run every hour during market hours (9:30 AM - 4:00 PM EST, Mon-Fri)
  @Cron('0 30 9-16 * * 1-5', {
    timeZone: 'America/New_York',
  })
  async fetchMarketData() {
    this.logger.log('Fetching DJT stock data...');
    await this.fetchDJTStock();
  }

  async fetchDJTStock(): Promise<StockQuote | null> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
      this.logger.warn('Alpha Vantage API key not configured');
      // Return mock data for development
      return this.saveMockStockData();
    }

    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=DJT&apikey=${apiKey}`
      );

      const data = await response.json();

      if (data['Global Quote']) {
        const quote = data['Global Quote'];
        const stockData: StockQuote = {
          symbol: 'DJT',
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(
            quote['10. change percent'].replace('%', '')
          ),
          volume: parseInt(quote['06. volume']),
        };

        await this.saveStockPrice(stockData);
        return stockData;
      }
    } catch (error) {
      this.logger.error(`Error fetching DJT stock: ${error}`);
    }

    return null;
  }

  private async saveStockPrice(data: StockQuote) {
    try {
      await prisma.stockPrice.create({
        data: {
          symbol: data.symbol,
          price: data.price,
          change: data.changePercent,
          volume: BigInt(data.volume),
          timestamp: new Date(),
        },
      });
      this.logger.log(
        `Saved DJT price: $${data.price} (${data.changePercent > 0 ? '+' : ''}${data.changePercent}%)`
      );
    } catch (error) {
      this.logger.error(`Failed to save stock price: ${error}`);
    }
  }

  private async saveMockStockData(): Promise<StockQuote> {
    // Generate realistic mock data based on recent DJT prices
    const basePrice = 34.5;
    const volatility = 0.05; // 5% daily volatility
    const randomChange = (Math.random() - 0.5) * 2 * volatility * basePrice;
    const price = basePrice + randomChange;
    const changePercent = (randomChange / basePrice) * 100;

    const mockData: StockQuote = {
      symbol: 'DJT',
      price: Math.round(price * 100) / 100,
      change: Math.round(randomChange * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(Math.random() * 10000000) + 5000000,
    };

    await this.saveStockPrice(mockData);
    return mockData;
  }

  async getLatestPrice(): Promise<StockQuote | null> {
    const latest = await prisma.stockPrice.findFirst({
      where: { symbol: 'DJT' },
      orderBy: { timestamp: 'desc' },
    });

    if (latest) {
      return {
        symbol: latest.symbol,
        price: latest.price,
        change: latest.change,
        changePercent: latest.change,
        volume: Number(latest.volume),
      };
    }

    return null;
  }

  async getPriceHistory(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return prisma.stockPrice.findMany({
      where: {
        symbol: 'DJT',
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });
  }
}
