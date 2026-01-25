import type { Metadata } from 'next';
import { Bebas_Neue, DM_Sans } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { QueryProvider } from '@/components/providers';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bebas',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'TRUMP TRACKER - Breaking News & Live Updates',
  description:
    'Real-time Trump news monitoring, sentiment analysis, and market impact tracking. Breaking alerts delivered instantly.',
  keywords: [
    'Trump',
    'Breaking News',
    'Live Updates',
    'DJT',
    'Truth Social',
    'Politics',
  ],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TRUMP TRACKER',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${bebasNeue.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <div className="flex h-dvh overflow-hidden">
              {/* Left Sidebar */}
              <Sidebar />

              {/* Main Content */}
              <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
                  {children}
                </main>
              </div>

              {/* Bottom Navigation (Mobile) */}
              <BottomNav />
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
