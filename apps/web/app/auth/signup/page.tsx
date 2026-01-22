'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function SignUpPage() {
  const router = useRouter();
  const { register, verifyCode, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [message, setMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setDevCode(null);

    if (!validateEmail(email)) {
      return;
    }

    try {
      const result = await register(email, name || undefined);

      // 開発環境用：メールが送れない場合はコードを表示
      if (result.code) {
        setDevCode(result.code);
      }

      setStep('code');
      setMessage(
        result.emailSent
          ? '確認コードをメールに送信しました。'
          : '確認コードを生成しました。'
      );
    } catch {
      // Error is handled by useAuth
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (code.length !== 6) {
      setValidationError('6桁のコードを入力してください');
      return;
    }

    try {
      await verifyCode(email, code);
      setMessage('アカウントを作成しました。ホームに移動します...');
      setTimeout(() => router.push('/'), 1500);
    } catch {
      setValidationError('コードが正しくないか、期限切れです');
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
    setDevCode(null);
    setMessage(null);
    setValidationError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-surface-elevated p-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Trump Alert
          </h1>
          <p className="text-muted-foreground">
            {step === 'email' ? '新規アカウント登録' : '認証コードを入力'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                お名前（任意）
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="山田太郎"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-foreground"
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
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>

            {validationError && (
              <div className="rounded-lg border border-amber-700 bg-amber-900/50 p-3 text-sm text-amber-300">
                {validationError}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-primary-600 py-3 font-medium text-white hover:bg-primary-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  送信中...
                </>
              ) : (
                '確認コードを送信'
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-6">
            <button
              type="button"
              onClick={handleBackToEmail}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              メールアドレスを変更
            </button>

            <div>
              <label
                htmlFor="code"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                認証コード
              </label>
              <p className="mb-3 text-sm text-muted-foreground">
                {email} に送信されたコードを入力してください
              </p>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                  setValidationError(null);
                }}
                className="w-full rounded-lg border border-border bg-background px-4 py-4 text-center font-mono text-2xl tracking-widest text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>

            {/* 開発環境用：コード表示 */}
            {devCode && (
              <div className="rounded-lg border border-blue-700 bg-blue-900/50 p-3 text-center">
                <p className="mb-1 text-xs text-blue-300">
                  開発環境：認証コード
                </p>
                <p className="font-mono text-2xl tracking-widest text-blue-200">
                  {devCode}
                </p>
              </div>
            )}

            {validationError && (
              <div className="rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-300">
                {validationError}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-green-700 bg-green-900/50 p-3 text-sm text-green-300">
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full rounded-lg bg-primary-600 py-3 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  確認中...
                </>
              ) : (
                'アカウントを作成'
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            すでにアカウントをお持ちの方は{' '}
            <Link
              href="/auth/signin"
              className="text-primary-400 hover:text-primary-300"
            >
              ログイン
            </Link>
          </p>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <Link
            href="/"
            className="block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← ホームに戻る
          </Link>
        </div>
      </Card>
    </div>
  );
}
