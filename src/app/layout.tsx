import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PMBA Hub | 課程・行事曆・倒數・私密雲端記事',
  description:
    '專為 PMBA 學員打造的跨裝置學習管理平台：支援班級公版課程/作業/考試/討論時程共享，以及個人獨立進度與私密記事本。',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
