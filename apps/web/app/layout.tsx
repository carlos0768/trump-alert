import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Trump Alert - Real-time Trump News Tracker',
  description:
    'Real-time monitoring and analysis of Trump-related news, social media, and market impact.',
  keywords: ['Trump', 'News', 'Alert', 'Politics', 'DJT', 'Truth Social'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={inter.variable}>
      <body className="min-h-dvh bg-gray-50 font-sans">
        <div className="flex h-dvh overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
