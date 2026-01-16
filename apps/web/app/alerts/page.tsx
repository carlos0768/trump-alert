'use client';

import { useState } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  Mail,
  Smartphone,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
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

interface Alert {
  id: string;
  keyword: string;
  minImpact: 'S' | 'A' | 'B' | 'C';
  notifyPush: boolean;
  notifyEmail: boolean;
  notifyDiscord: boolean;
  isActive: boolean;
  matchCount: number;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    keyword: 'Tariff',
    minImpact: 'A',
    notifyPush: true,
    notifyEmail: true,
    notifyDiscord: false,
    isActive: true,
    matchCount: 45,
  },
  {
    id: '2',
    keyword: 'Indictment',
    minImpact: 'S',
    notifyPush: true,
    notifyEmail: true,
    notifyDiscord: true,
    isActive: true,
    matchCount: 23,
  },
  {
    id: '3',
    keyword: 'Election',
    minImpact: 'B',
    notifyPush: true,
    notifyEmail: false,
    notifyDiscord: false,
    isActive: false,
    matchCount: 156,
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newMinImpact, setNewMinImpact] = useState<'S' | 'A' | 'B' | 'C'>('A');

  const toggleAlert = (id: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
      )
    );
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id));
  };

  const createAlert = () => {
    if (!newKeyword.trim()) return;
    const newAlert: Alert = {
      id: Date.now().toString(),
      keyword: newKeyword,
      minImpact: newMinImpact,
      notifyPush: true,
      notifyEmail: false,
      notifyDiscord: false,
      isActive: true,
      matchCount: 0,
    };
    setAlerts([newAlert, ...alerts]);
    setNewKeyword('');
    setShowCreateForm(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Alerts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Get notified when news matches your keywords
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="size-4" />
          New Alert
        </Button>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Create New Alert</CardTitle>
            <CardDescription>
              Set up a keyword to monitor and choose your notification
              preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Keyword
                </label>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g., Tariff, Election, Trial"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Minimum Impact Level
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
                  You will receive alerts for {newMinImpact} level and above
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createAlert}>Create Alert</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <div className="mt-6 space-y-3">
        {alerts.length === 0 ? (
          <Card className="py-12 text-center">
            <Bell className="mx-auto size-12 text-gray-300" />
            <p className="mt-4 text-gray-500">No alerts configured</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowCreateForm(true)}
            >
              Create your first alert
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
                      onClick={() => toggleAlert(alert.id)}
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
                          {alert.matchCount} matches
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                        {alert.notifyPush && (
                          <span className="flex items-center gap-1">
                            <Smartphone className="size-3.5" />
                            Push
                          </span>
                        )}
                        {alert.notifyEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3.5" />
                            Email
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
                    onClick={() => deleteAlert(alert.id)}
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
          <CardTitle className="text-lg">Notification Settings</CardTitle>
          <CardDescription>
            Configure how you want to receive alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary-100">
                  <Smartphone className="size-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Push Notifications
                  </p>
                  <p className="text-sm text-gray-500">
                    Receive browser push notifications
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                  <Mail className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Email Notifications
                  </p>
                  <p className="text-sm text-gray-500">
                    Receive alerts via email
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-100">
                  <MessageSquare className="size-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Discord Webhook</p>
                  <p className="text-sm text-gray-500">
                    Send alerts to a Discord channel
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Connect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
