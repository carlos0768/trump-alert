'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Newspaper,
  BarChart3,
  Activity,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  useWeeklyStats,
  useAnalyticsOverview,
  useTrendingTopics,
} from '@/lib/hooks';

export default function AnalyticsPage() {
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyStats();
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview();
  const { data: trendingTopics, isLoading: topicsLoading } =
    useTrendingTopics();

  const isLoading = weeklyLoading || overviewLoading;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      <p className="mt-1 text-sm text-gray-500">
        トランプ関連ニュースの分析とトレンド
      </p>

      {/* Stats Overview */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="総記事数"
          value={overview?.totalArticles.toLocaleString() || '0'}
          subtext={`今週: ${overview?.weeklyArticles || 0}件`}
          icon={Newspaper}
        />
        <StatCard
          title="平均センチメント"
          value={
            (overview?.avgSentiment || 0) >= 0
              ? `+${(overview?.avgSentiment || 0).toFixed(2)}`
              : (overview?.avgSentiment || 0).toFixed(2)
          }
          subtext={
            overview?.avgSentiment && overview.avgSentiment >= 0
              ? 'ポジティブ傾向'
              : 'ネガティブ傾向'
          }
          icon={Activity}
          valueColor={
            overview?.avgSentiment && overview.avgSentiment >= 0
              ? 'text-green-600'
              : 'text-red-600'
          }
        />
        <StatCard
          title="追跡ソース"
          value={overview?.sourcesTracked.toString() || '0'}
          subtext="ニュースソース"
          icon={BarChart3}
        />
        <StatCard
          title="今週の記事"
          value={overview?.weeklyArticles.toLocaleString() || '0'}
          subtext="過去7日間"
          icon={TrendingUp}
        />
      </div>

      {/* Charts Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">週間記事数</CardTitle>
            <CardDescription>1日あたりの記事数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {weeklyData && weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                      formatter={(value: number) => [`${value}件`, '記事数']}
                    />
                    <Bar
                      dataKey="articles"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  データがありません
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">センチメント推移</CardTitle>
            <CardDescription>日別平均センチメントスコア</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {weeklyData && weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis
                      domain={[-1, 1]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                      formatter={(value: number) => [
                        value.toFixed(2),
                        'センチメント',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="sentiment"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  データがありません
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ソース別分布</CardTitle>
            <CardDescription>ニュースソース別のカバレッジ</CardDescription>
          </CardHeader>
          <CardContent>
            {overview?.sourceDistribution &&
            overview.sourceDistribution.length > 0 ? (
              <div className="flex items-center gap-8">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.sourceDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {overview.sourceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, '割合']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {overview.sourceDistribution.map((source) => (
                    <div
                      key={source.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="size-3 rounded-full"
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="text-sm text-gray-700">
                          {source.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {source.count}件
                        </span>
                        <span className="text-sm font-medium tabular-nums text-gray-900">
                          {source.value}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-gray-400">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">トップトピック</CardTitle>
            <CardDescription>今週最も議論されたトピック</CardDescription>
          </CardHeader>
          <CardContent>
            {trendingTopics && trendingTopics.length > 0 ? (
              <div className="space-y-4">
                {trendingTopics.slice(0, 5).map((topic, index) => (
                  <div key={topic.name} className="flex items-center gap-4">
                    <span className="w-6 text-center text-sm font-medium text-gray-400">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          #{topic.name}
                        </span>
                        <span className="text-sm tabular-nums text-gray-600">
                          {topic.count} 記事
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{
                            width: `${(topic.count / (trendingTopics[0]?.count || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-gray-400">
                <div className="text-center">
                  <p>トピックデータがありません</p>
                  <p className="mt-1 text-xs">タグ機能の実装が必要です</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  valueColor = 'text-gray-900',
}: {
  title: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  valueColor?: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary-100">
            <Icon className="size-5 text-primary-600" />
          </div>
        </div>
        <p className={`mt-3 text-2xl font-bold tabular-nums ${valueColor}`}>
          {value}
        </p>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="mt-1 text-xs text-gray-400">{subtext}</p>
      </CardContent>
    </Card>
  );
}
