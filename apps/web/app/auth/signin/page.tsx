'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function SignInPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setValidationError('メールアドレスを入力してください');
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setValidationError(
        '有効なメールアドレスを入力してください（例: user@example.com）'
      );
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateEmail(email)) {
      return;
    }

    try {
      const result = await login(email);
      if (result.emailSent) {
        // Email was sent - show confirmation message
        setMessage(
          'ログインリンクをメールに送信しました。メール内のリンクをクリックしてログインしてください。'
        );
      } else if (result.loginToken) {
        // Email not configured - fallback to auto-verify (development mode)
        setMessage('ログイン成功！リダイレクト中...');
        setTimeout(() => router.push('/'), 500);
      } else {
        setMessage('ログインリンクを生成しました。');
      }
    } catch {
      // Error is handled by useAuth
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md p-8 bg-slate-800 border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Trump Alert</h1>
          <p className="text-slate-400">アカウントにサインイン</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              メールアドレス
            </label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationError) validateEmail(e.target.value);
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          {validationError && (
            <div className="p-3 bg-amber-900/50 border border-amber-700 rounded-lg text-amber-300 text-sm">
              {validationError}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-300 text-sm">
              {message}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            {isLoading ? 'ログイン中...' : 'ログインリンクを送信'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            アカウントをお持ちでない方は{' '}
            <Link
              href="/auth/signup"
              className="text-blue-400 hover:text-blue-300"
            >
              新規登録
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700">
          <Link
            href="/"
            className="block text-center text-slate-400 hover:text-slate-300 text-sm"
          >
            ← ホームに戻る
          </Link>
        </div>
      </Card>
    </div>
  );
}
