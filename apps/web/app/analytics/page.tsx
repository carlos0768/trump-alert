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
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

const weeklyData = [
  { day: 'Mon', articles: 145, sentiment: 0.12 },
  { day: 'Tue', articles: 182, sentiment: -0.08 },
  { day: 'Wed', articles: 156, sentiment: 0.25 },
  { day: 'Thu', articles: 203, sentiment: 0.18 },
  { day: 'Fri', articles: 178, sentiment: -0.15 },
  { day: 'Sat', articles: 92, sentiment: 0.32 },
  { day: 'Sun', articles: 78, sentiment: 0.05 },
];

const sourceDistribution = [
  { name: 'Fox News', value: 28, color: '#dc2626' },
  { name: 'CNN', value: 24, color: '#3b82f6' },
  { name: 'Truth Social', value: 18, color: '#8b5cf6' },
  { name: 'BBC', value: 12, color: '#6b7280' },
  { name: 'Reuters', value: 10, color: '#f97316' },
  { name: 'Others', value: 8, color: '#d1d5db' },
];

const topicBreakdown = [
  { topic: 'Election', count: 342, change: 15 },
  { topic: 'Tariff', count: 256, change: 28 },
  { topic: 'Trial', count: 198, change: -12 },
  { topic: 'Immigration', count: 167, change: 8 },
  { topic: 'Economy', count: 145, change: -5 },
];

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      <p className="mt-1 text-sm text-gray-500">
        Insights and trends from Trump-related news coverage
      </p>

      {/* Stats Overview */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Articles"
          value="1,234"
          change={12}
          icon={Newspaper}
        />
        <StatCard
          title="Avg Sentiment"
          value="+0.15"
          change={8}
          icon={Activity}
          valueColor="text-green-600"
        />
        <StatCard
          title="Sources Tracked"
          value="24"
          change={2}
          icon={BarChart3}
        />
        <StatCard
          title="Active Alerts"
          value="8"
          change={-1}
          icon={TrendingUp}
        />
      </div>

      {/* Charts Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Article Volume</CardTitle>
            <CardDescription>Number of articles per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
                  />
                  <Bar
                    dataKey="articles"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sentiment Trend</CardTitle>
            <CardDescription>Average daily sentiment score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Source Distribution</CardTitle>
            <CardDescription>Coverage by news source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {sourceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {sourceDistribution.map((source) => (
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
                    <span className="text-sm font-medium tabular-nums text-gray-900">
                      {source.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Topic Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Topics</CardTitle>
            <CardDescription>Most discussed topics this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topicBreakdown.map((topic, index) => (
                <div key={topic.topic} className="flex items-center gap-4">
                  <span className="w-6 text-center text-sm font-medium text-gray-400">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        #{topic.topic}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm tabular-nums text-gray-600">
                          {topic.count} articles
                        </span>
                        <span
                          className={`flex items-center text-xs font-medium ${
                            topic.change > 0
                              ? 'text-green-600'
                              : topic.change < 0
                                ? 'text-red-600'
                                : 'text-gray-500'
                          }`}
                        >
                          {topic.change > 0 ? (
                            <TrendingUp className="mr-0.5 size-3" />
                          ) : topic.change < 0 ? (
                            <TrendingDown className="mr-0.5 size-3" />
                          ) : null}
                          {Math.abs(topic.change)}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-primary-500"
                        style={{
                          width: `${(topic.count / topicBreakdown[0].count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  valueColor = 'text-gray-900',
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  valueColor?: string;
}) {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary-100">
            <Icon className="size-5 text-primary-600" />
          </div>
          <span
            className={`flex items-center text-sm font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="mr-0.5 size-3" />
            ) : (
              <TrendingDown className="mr-0.5 size-3" />
            )}
            {Math.abs(change)}%
          </span>
        </div>
        <p className={`mt-3 text-2xl font-bold tabular-nums ${valueColor}`}>
          {value}
        </p>
        <p className="text-sm text-gray-500">{title}</p>
      </CardContent>
    </Card>
  );
}
