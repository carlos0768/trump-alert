import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { QueryProvider } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'トランプトラッカー - トランプ関連ニュース速報',
  description:
    'トランプ関連のニュース、SNS、市場動向をリアルタイムで監視・分析。大統領令や法案も追跡。',
  keywords: ['トランプ', 'ニュース', '速報', '大統領令', 'DJT', 'Truth Social'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={inter.variable}>
      <body className="min-h-dvh bg-gray-50 font-sans">
        <QueryProvider>
          <div className="flex h-dvh overflow-hidden">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
