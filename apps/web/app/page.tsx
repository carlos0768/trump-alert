'use client';

import { useState } from 'react';
import { Zap, RefreshCw } from 'lucide-react';
import { ArticleCard } from '@/components/article';
import { TrumpIndexChart } from '@/components/charts';
import {
  TrendingTopics,
  mockTrendingTopics,
  StockWidget,
  mockStockData,
  FilterBar,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockArticles, mockTrumpIndexData } from '@/lib/mock-data';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('all');

  // Calculate current Trump Index
  const currentIndex =
    mockTrumpIndexData[mockTrumpIndexData.length - 1]?.sentiment ?? 0;
  const previousIndex =
    mockTrumpIndexData[mockTrumpIndexData.length - 2]?.sentiment ?? 0;
  const indexChange = currentIndex - previousIndex;

  return (
    <div className="flex h-full">
      {/* Main Feed */}
      <div className="flex-1 overflow-y-auto border-r border-gray-200">
        {/* Feed Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Live Feed</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm">
                <RefreshCw className="size-4" />
              </Button>
              <Button size="sm" className="gap-1.5">
                <Zap className="size-3.5" />
                <span>Live</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="breaking">Breaking</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="market">Market</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filter Bar */}
          <div className="mt-3">
            <FilterBar />
          </div>
        </div>

        {/* Articles Feed */}
        <div className="divide-y divide-gray-100">
          {mockArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        {/* Load More */}
        <div className="p-4">
          <Button variant="outline" className="w-full">
            Load More
          </Button>
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden w-80 flex-shrink-0 overflow-y-auto p-4 xl:block">
        <div className="space-y-4">
          {/* Trump Index Chart */}
          <TrumpIndexChart
            data={mockTrumpIndexData}
            currentIndex={currentIndex}
            change={indexChange}
          />

          {/* DJT Stock Widget */}
          <StockWidget stock={mockStockData} />

          {/* Trending Topics */}
          <TrendingTopics topics={mockTrendingTopics} />

          {/* Footer Links */}
          <div className="text-center text-xs text-gray-400">
            <p>Trump Alert &copy; 2024</p>
            <div className="mt-1 flex justify-center gap-3">
              <a href="#" className="hover:text-gray-600">
                Terms
              </a>
              <a href="#" className="hover:text-gray-600">
                Privacy
              </a>
              <a href="#" className="hover:text-gray-600">
                About
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
