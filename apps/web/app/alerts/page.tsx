'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Plus,
  Trash2,
  Mail,
  Smartphone,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  LogIn,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge, ImpactBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAlerts, type CreateAlertInput } from '@/lib/hooks/use-alerts';

export default function AlertsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    alerts,
    isLoading: alertsLoading,
    createAlert,
    updateAlert,
    deleteAlert,
    isCreating,
  } = useAlerts();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newMinImpact, setNewMinImpact] = useState<'S' | 'A' | 'B' | 'C'>('A');
  const [newNotifyPush, setNewNotifyPush] = useState(true);
  const [newNotifyEmail, setNewNotifyEmail] = useState(false);
  const [newNotifyDiscord, setNewNotifyDiscord] = useState(false);

  const toggleAlertActive = (id: string, currentActive: boolean) => {
    updateAlert(id, { isActive: !currentActive });
  };

  const handleDeleteAlert = (id: string) => {
    if (confirm('このアラートを削除しますか？')) {
      deleteAlert(id);
    }
  };

  const handleCreateAlert = () => {
    if (!newKeyword.trim()) return;

    const alertData: CreateAlertInput = {
      keyword: newKeyword.trim(),
      minImpact: newMinImpact,
      notifyPush: newNotifyPush,
      notifyEmail: newNotifyEmail,
      notifyDiscord: newNotifyDiscord,
    };

    createAlert(alertData, {
      onSuccess: () => {
        setNewKeyword('');
        setShowCreateForm(false);
      },
    });
  };

  // Show login prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Hero Section - トランプアラートを設定する */}
        <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-urgent via-red-600 to-orange-500 p-6 text-white shadow-2xl">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -left-4 -top-4 size-32 rounded-full bg-white blur-3xl" />
            <div className="absolute -bottom-4 -right-4 size-32 rounded-full bg-yellow-300 blur-3xl" />
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center size-12 rounded-full bg-white/20 backdrop-blur-sm animate-pulse">
                <AlertTriangle className="size-6 text-yellow-300" />
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  <span className="size-2 rounded-full bg-yellow-300 animate-ping" />
                  LIVE
                </span>
              </div>
            </div>
            
            <h1 className="font-headline text-3xl font-black uppercase tracking-tight mb-2">
              🚨 トランプアラートを設定する
            </h1>
            <p className="text-white/80 text-sm max-w-lg">
              トランプに関する重要ニュースが発生したら、即座にあなたに通知。
              <span className="font-bold text-yellow-300">見逃しは許されない。</span>
            </p>
          </div>
          
          {/* Trump silhouette decoration */}
          <div className="absolute -right-8 -bottom-8 opacity-20">
            <img 
              src="/trump-face.png" 
              alt="" 
              className="size-40 rotate-12"
            />
          </div>
        </div>

        {/* Login Card */}
        <Card className="py-12 text-center border-border bg-surface-elevated">
          <LogIn className="mx-auto size-16 text-muted-foreground/30" />
          <h2 className="mt-4 text-xl font-headline font-bold text-foreground uppercase">
            ログインが必要です
          </h2>
          <p className="mt-2 text-muted-foreground">
            アラート機能を使用するにはログインしてください
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/auth/signin">
              <Button>ログイン</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline">新規登録</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isLoading = authLoading || alertsLoading;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Hero Section - トランプアラートを設定する */}
      <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-urgent via-red-600 to-orange-500 p-6 text-white shadow-2xl">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-4 -top-4 size-32 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-4 -right-4 size-32 rounded-full bg-yellow-300 blur-3xl" />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-12 rounded-full bg-white/20 backdrop-blur-sm animate-pulse">
              <AlertTriangle className="size-6 text-yellow-300" />
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                <span className="size-2 rounded-full bg-yellow-300 animate-ping" />
                LIVE
              </span>
            </div>
          </div>
          
          <h1 className="font-headline text-3xl font-black uppercase tracking-tight mb-2">
            🚨 トランプアラートを設定する
          </h1>
          <p className="text-white/80 text-sm max-w-lg">
            トランプに関する重要ニュースが発生したら、即座にあなたに通知。
            <span className="font-bold text-yellow-300">見逃しは許されない。</span>
          </p>
          
          <div className="flex items-center gap-4 mt-4">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="gap-2 bg-white text-urgent hover:bg-yellow-100 font-bold shadow-lg"
              disabled={isLoading}
            >
              <Zap className="size-4" />
              今すぐ設定
            </Button>
            <div className="text-xs text-white/60">
              <span className="font-bold text-yellow-300">{alerts.length}</span> 件のアラート設定中
            </div>
          </div>
        </div>
        
        {/* Trump silhouette decoration */}
        <div className="absolute -right-8 -bottom-8 opacity-20">
          <img 
            src="/trump-face.png" 
            alt="" 
            className="size-40 rotate-12"
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-xl font-bold text-foreground uppercase tracking-wide">MY ALERTS</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            キーワードにマッチするニュースが届いたら通知を受け取る
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="gap-2"
          disabled={isLoading}
        >
          <Plus className="size-4" />
          新規アラート
        </Button>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">新規アラートを作成</CardTitle>
            <CardDescription>
              監視するキーワードと通知方法を設定
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  キーワード
                </label>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="例: Tariff, Election, Trial"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  最低インパクトレベル
                </label>
                <div className="flex gap-2">
                  {(['S', 'A', 'B', 'C'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setNewMinImpact(level)}
                      className={cn(
                        'flex size-10 items-center justify-center rounded-lg text-sm font-bold transition-all',
                        newMinImpact === level
                          ? level === 'S'
                            ? 'bg-red-600 text-white'
                            : level === 'A'
                              ? 'bg-orange-500 text-white'
                              : level === 'B'
                                ? 'bg-yellow-500 text-black'
                                : 'bg-gray-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  {newMinImpact}レベル以上の記事で通知を受け取ります
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  通知方法
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setNewNotifyPush(!newNotifyPush)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                      newNotifyPush
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Smartphone className="size-4" />
                    プッシュ通知
                  </button>
                  <button
                    onClick={() => setNewNotifyEmail(!newNotifyEmail)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                      newNotifyEmail
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Mail className="size-4" />
                    メール
                  </button>
                  <button
                    onClick={() => setNewNotifyDiscord(!newNotifyDiscord)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                      newNotifyDiscord
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <MessageSquare className="size-4" />
                    Discord
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  キャンセル
                </Button>
                <Button onClick={handleCreateAlert} disabled={isCreating}>
                  {isCreating ? '作成中...' : 'アラートを作成'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <div className="mt-6 space-y-3">
        {isLoading ? (
          <Card className="py-12 text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            <p className="mt-4 text-gray-500">読み込み中...</p>
          </Card>
        ) : alerts.length === 0 ? (
          <Card className="py-12 text-center">
            <Bell className="mx-auto size-12 text-gray-300" />
            <p className="mt-4 text-gray-500">アラートが設定されていません</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowCreateForm(true)}
            >
              最初のアラートを作成
            </Button>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card
              key={alert.id}
              className={cn(
                'transition-opacity',
                !alert.isActive && 'opacity-60'
              )}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        toggleAlertActive(alert.id, alert.isActive)
                      }
                      className={cn(
                        'transition-colors',
                        alert.isActive ? 'text-primary-600' : 'text-gray-400'
                      )}
                    >
                      {alert.isActive ? (
                        <ToggleRight className="size-8" />
                      ) : (
                        <ToggleLeft className="size-8" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          #{alert.keyword}
                        </span>
                        <ImpactBadge level={alert.minImpact} />
                        <Badge variant="secondary">
                          {alert.isActive ? '有効' : '無効'}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                        {alert.notifyPush && (
                          <span className="flex items-center gap-1">
                            <Smartphone className="size-3.5" />
                            プッシュ
                          </span>
                        )}
                        {alert.notifyEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3.5" />
                            メール
                          </span>
                        )}
                        {alert.notifyDiscord && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="size-3.5" />
                            Discord
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Notification Settings */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">通知設定</CardTitle>
          <CardDescription>アラートの受信方法を設定</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary-100">
                  <Smartphone className="size-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">プッシュ通知</p>
                  <p className="text-sm text-gray-500">
                    ブラウザのプッシュ通知を受け取る
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                有効化
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                  <Mail className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">メール通知</p>
                  <p className="text-sm text-gray-500">
                    {user?.email || 'メールアドレス未設定'}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {user?.emailVerified ? '認証済み' : '未認証'}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-100">
                  <MessageSquare className="size-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Discord Webhook</p>
                  <p className="text-sm text-gray-500">
                    {user?.discordWebhook
                      ? '設定済み'
                      : 'Discordチャンネルに通知を送信'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                {user?.discordWebhook ? '変更' : '接続'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
