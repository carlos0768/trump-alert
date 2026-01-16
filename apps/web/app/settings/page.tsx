'use client';

import { useState } from 'react';
import {
  User,
  Bell,
  Globe,
  Palette,
  Shield,
  LogOut,
  ChevronRight,
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

export default function SettingsPage() {
  const [language, setLanguage] = useState('ja');
  const [theme, setTheme] = useState('light');

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
          <div className="flex items-center gap-4">
            <Avatar fallback="U" size="xl" />
            <div>
              <p className="font-semibold text-gray-900">Guest User</p>
              <p className="text-sm text-gray-500">guest@example.com</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>
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
            <SettingRow
              title="Push Notifications"
              description="Receive browser push notifications"
              action={
                <input
                  type="checkbox"
                  defaultChecked
                  className="size-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              }
            />
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
      <Button variant="outline" className="mt-6 w-full gap-2">
        <LogOut className="size-4" />
        Sign Out
      </Button>
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
