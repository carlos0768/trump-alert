'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card } from '@/components/ui/card';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('認証を確認中...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('無効なリンクです。');
      return;
    }

    verifyToken(token)
      .then(() => {
        setStatus('success');
        setMessage('メール認証が完了しました。ホームページに移動します...');
        setTimeout(() => router.push('/'), 2000);
      })
      .catch(() => {
        setStatus('error');
        setMessage('認証に失敗しました。リンクが期限切れの可能性があります。');
      });
  }, [searchParams, verifyToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md p-8 bg-slate-800 border-slate-700 text-center">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Trump Alert</h1>
          <p className="text-slate-400">メール認証</p>
        </div>

        <div className="py-8">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-300">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-green-300">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-red-300">{message}</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700">
          <Link
            href="/auth/signin"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            ログインページに戻る
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
