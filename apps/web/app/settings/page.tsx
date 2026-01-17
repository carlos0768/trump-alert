'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Globe,
  Palette,
  Shield,
  LogOut,
  ChevronRight,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from '@/lib/push-notifications';
import { useAuth } from '@/lib/hooks/use-auth';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [language, setLanguage] = useState('ja');
  const [theme, setTheme] = useState('light');

  // Push notification state
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<
    NotificationPermission | 'unsupported'
  >('default');
  const [pushSubscription, setPushSubscription] =
    useState<PushSubscription | null>(null);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  // Check push notification status on mount
  useEffect(() => {
    const checkPushStatus = async () => {
      const supported = isPushSupported();
      setPushSupported(supported);

      if (supported) {
        setPushPermission(getNotificationPermission());
        const subscription = await getCurrentSubscription();
        setPushSubscription(subscription);
      }
    };

    checkPushStatus();
  }, []);

  // Handle push notification toggle
  const handlePushToggle = async () => {
    setPushLoading(true);
    setPushError(null);

    try {
      if (pushSubscription) {
        // Unsubscribe
        await unsubscribeFromPush();
        setPushSubscription(null);
      } else {
        // Subscribe
        const subscription = await subscribeToPush();
        setPushSubscription(subscription);
        setPushPermission('granted');

        // TODO: Save to server when user is authenticated
        // await saveSubscriptionToServer(userId, subscription);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to toggle notifications';
      setPushError(message);
    } finally {
      setPushLoading(false);
    }
  };

  // Test push notification
  const handleTestPush = async () => {
    if (!pushSubscription) return;

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Trump Alert Test', {
        body: 'Push notifications are working correctly!',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'test-notification',
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage your account and preferences
      </p>

      {/* Profile Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="size-5 text-gray-400" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-4">
                <Avatar
                  fallback={user.name?.[0] || user.email[0].toUpperCase()}
                  size="xl"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {user.name || 'ユーザー'}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <Check className="size-3" /> 認証済み
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600">未認証</span>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">ログインしていません</p>
              <div className="flex gap-2 justify-center">
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">
                    ログイン
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">新規登録</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="size-5 text-gray-400" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive alerts and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-500">
                  {!pushSupported
                    ? 'Not supported in this browser'
                    : pushPermission === 'denied'
                      ? 'Blocked by browser settings'
                      : pushSubscription
                        ? 'Enabled - receiving notifications'
                        : 'Click to enable browser notifications'}
                </p>
                {pushError && (
                  <p className="mt-1 text-sm text-red-500">{pushError}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {pushLoading ? (
                  <Loader2 className="size-5 animate-spin text-gray-400" />
                ) : !pushSupported || pushPermission === 'denied' ? (
                  <X className="size-5 text-gray-400" />
                ) : (
                  <>
                    <button
                      onClick={handlePushToggle}
                      disabled={pushLoading}
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        pushSubscription ? 'bg-primary-600' : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                          pushSubscription ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Test Notification Button */}
            {pushSubscription && (
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Test Notifications
                  </p>
                  <p className="text-xs text-gray-500">
                    Send a test notification to verify setup
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleTestPush}>
                  Send Test
                </Button>
              </div>
            )}

            <SettingRow
              title="Email Digest"
              description="Daily summary of important news"
              action={
                <input
                  type="checkbox"
                  className="size-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              }
            />
            <SettingRow
              title="Breaking News"
              description="Immediate alerts for S-level events"
              action={
                <input
                  type="checkbox"
                  defaultChecked
                  className="size-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="size-5 text-gray-400" />
            Language & Region
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SettingRow
              title="Language"
              description="Choose your preferred language"
              action={
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              }
            />
            <SettingRow
              title="Auto-translate"
              description="Automatically translate articles to your language"
              action={
                <input
                  type="checkbox"
                  defaultChecked
                  className="size-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="size-5 text-gray-400" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SettingRow
              title="Theme"
              description="Choose light or dark mode"
              action={
                <div className="flex gap-2">
                  {['light', 'dark', 'system'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                        theme === t
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              }
            />
            <SettingRow
              title="Compact Mode"
              description="Show more content in less space"
              action={
                <input
                  type="checkbox"
                  className="size-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="size-5 text-gray-400" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SettingRow
              title="Two-Factor Authentication"
              description="Add an extra layer of security"
              action={
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              }
            />
            <SettingRow
              title="Active Sessions"
              description="Manage your logged in devices"
              action={<ChevronRight className="size-5 text-gray-400" />}
              clickable
            />
            <SettingRow
              title="Download Data"
              description="Export your data and settings"
              action={
                <Button variant="outline" size="sm">
                  Download
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="mt-4 border-red-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-gray-500">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      {isAuthenticated && (
        <Button
          variant="outline"
          className="mt-6 w-full gap-2"
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
        >
          <LogOut className="size-4" />
          ログアウト
        </Button>
      )}
    </div>
  );
}

function SettingRow({
  title,
  description,
  action,
  clickable,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
  clickable?: boolean;
}) {
  const Comp = clickable ? 'button' : 'div';
  return (
    <Comp
      className={cn(
        'flex w-full items-center justify-between',
        clickable && 'rounded-lg py-1 hover:bg-gray-50'
      )}
    >
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {action}
    </Comp>
  );
}
