'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  RefreshCw,
  DollarSign,
  Zap,
  BarChart3,
  Clock,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiUsageStats {
  today: {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  month: {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  byOperation: {
    operation: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }[];
  recentUsage: {
    id: string;
    provider: string;
    model: string;
    operation: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    createdAt: string;
  }[];
}

interface TrumpIndexData {
  hour: string;
  avgSentiment: number;
  articleCount: number;
}

interface DailyStats {
  totalArticles: number;
  avgSentiment: number;
  byImpact: Record<string, number>;
  byBias: Record<string, number>;
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('ja-JP');
}

export default function DebugPage() {
  const [apiUsage, setApiUsage] = useState<ApiUsageStats | null>(null);
  const [trumpIndex, setTrumpIndex] = useState<TrumpIndexData[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [collecting, setCollecting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usageRes, indexRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/stats/api-usage`),
        fetch(`${API_URL}/api/stats/trump-index`),
        fetch(`${API_URL}/api/stats/daily`),
      ]);

      if (usageRes.ok) setApiUsage(await usageRes.json());
      if (indexRes.ok) setTrumpIndex(await indexRes.json());
      if (statsRes.ok) setDailyStats(await statsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/analyze-all?limit=5`, {
        method: 'POST',
      });
      const result = await res.json();
      alert(`分析完了: ${result.analyzed}件成功, ${result.failed}件失敗`);
      fetchData();
    } catch {
      alert('分析に失敗しました');
    }
    setAnalyzing(false);
  };

  const triggerCollection = async () => {
    setCollecting(true);
    try {
      const res = await fetch(`${API_URL}/api/collect`, { method: 'POST' });
      const result = await res.json();
      alert(`収集完了: ${result.collected}件の新規記事`);
      fetchData();
    } catch {
      alert('収集に失敗しました');
    }
    setCollecting(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            開発者ダッシュボード
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className="mr-2 size-4" />
              更新
            </Button>
            <Button
              variant="outline"
              onClick={triggerCollection}
              disabled={collecting}
            >
              {collecting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Zap className="mr-2 size-4" />
              )}
              記事収集
            </Button>
            <Button onClick={triggerAnalysis} disabled={analyzing}>
              {analyzing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <BarChart3 className="mr-2 size-4" />
              )}
              AI分析 (5件)
            </Button>
          </div>
        </div>

        {/* API Usage Summary */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">今日の費用</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCost(apiUsage?.today.cost || 0)}
                  </p>
                </div>
                <DollarSign className="size-8 text-green-500" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {formatNumber(apiUsage?.today.calls || 0)} API calls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">今月の費用</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCost(apiUsage?.month.cost || 0)}
                  </p>
                </div>
                <DollarSign className="size-8 text-blue-500" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {formatNumber(apiUsage?.month.calls || 0)} API calls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">今日の記事</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dailyStats?.totalArticles || 0}
                  </p>
                </div>
                <BarChart3 className="size-8 text-purple-500" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                平均センチメント: {(dailyStats?.avgSentiment || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">入力トークン (今月)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(apiUsage?.month.inputTokens || 0)}
                  </p>
                </div>
                <Zap className="size-8 text-orange-500" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                出力: {formatNumber(apiUsage?.month.outputTokens || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Operation Breakdown */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>オペレーション別費用</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiUsage?.byOperation.map((op) => (
                  <div
                    key={op.operation}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div>
                      <p className="font-medium capitalize">{op.operation}</p>
                      <p className="text-sm text-gray-500">
                        {formatNumber(op.calls)} calls
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        {formatCost(op.cost)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatNumber(op.inputTokens + op.outputTokens)} tokens
                      </p>
                    </div>
                  </div>
                ))}
                {(!apiUsage?.byOperation ||
                  apiUsage.byOperation.length === 0) && (
                  <p className="text-center text-gray-500">データなし</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trump Index (今日)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trumpIndex.map((data) => (
                  <div key={data.hour} className="flex items-center gap-3">
                    <span className="w-14 text-sm text-gray-500">
                      {data.hour}
                    </span>
                    <div className="flex-1">
                      <div
                        className="h-6 rounded"
                        style={{
                          width: `${Math.abs(data.avgSentiment) * 100}%`,
                          backgroundColor:
                            data.avgSentiment >= 0 ? '#22c55e' : '#ef4444',
                          minWidth: data.articleCount > 0 ? '4px' : '0',
                        }}
                      />
                    </div>
                    <span className="w-20 text-right text-sm">
                      {data.avgSentiment.toFixed(2)} ({data.articleCount})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent API Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              最近のAPI使用履歴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">日時</th>
                    <th className="pb-2 font-medium">オペレーション</th>
                    <th className="pb-2 font-medium">モデル</th>
                    <th className="pb-2 text-right font-medium">入力</th>
                    <th className="pb-2 text-right font-medium">出力</th>
                    <th className="pb-2 text-right font-medium">費用</th>
                  </tr>
                </thead>
                <tbody>
                  {apiUsage?.recentUsage.map((usage) => (
                    <tr key={usage.id} className="border-b border-gray-100">
                      <td className="py-2 text-gray-500">
                        {formatDate(usage.createdAt)}
                      </td>
                      <td className="py-2 capitalize">{usage.operation}</td>
                      <td className="py-2 text-gray-500">{usage.model}</td>
                      <td className="py-2 text-right tabular-nums">
                        {formatNumber(usage.inputTokens)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {formatNumber(usage.outputTokens)}
                      </td>
                      <td className="py-2 text-right font-medium text-green-600 tabular-nums">
                        {formatCost(usage.cost)}
                      </td>
                    </tr>
                  ))}
                  {(!apiUsage?.recentUsage ||
                    apiUsage.recentUsage.length === 0) && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-4 text-center text-gray-500"
                      >
                        API使用履歴がありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Impact & Bias Breakdown */}
        {dailyStats && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Impact Level (今日)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {['S', 'A', 'B', 'C'].map((level) => (
                    <div
                      key={level}
                      className="flex-1 rounded-lg bg-gray-50 p-3 text-center"
                    >
                      <p className="text-2xl font-bold">
                        {dailyStats.byImpact[level] || 0}
                      </p>
                      <p className="text-sm text-gray-500">{level}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bias (今日)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {['Left', 'Center', 'Right'].map((bias) => (
                    <div
                      key={bias}
                      className="flex-1 rounded-lg bg-gray-50 p-3 text-center"
                    >
                      <p className="text-2xl font-bold">
                        {dailyStats.byBias[bias] || 0}
                      </p>
                      <p className="text-sm text-gray-500">{bias}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
