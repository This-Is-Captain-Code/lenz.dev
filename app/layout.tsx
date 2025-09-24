import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '../components/query-provider';
import { Toaster } from '../components/ui/toaster';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'LenZ Camera - AR Camera App',
  description: 'Create stunning AR photos using Snapchat lenses',
  manifest: '/manifest',
  openGraph: {
    title: 'LenZ Camera - AR Camera App',
    description: 'Create stunning AR photos using Snapchat lenses',
    url: process.env.NEXT_PUBLIC_URL || 'https://your-app.replit.app',
    siteName: 'LenZ Camera',
    images: [
      {
        url: process.env.NEXT_PUBLIC_APP_OG_IMAGE || '/LenZ-white-logo.png',
        width: 1200,
        height: 630,
        alt: 'LenZ Camera - AR Photos',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LenZ Camera - AR Camera App',
    description: 'Create stunning AR photos using Snapchat lenses',
    images: [process.env.NEXT_PUBLIC_APP_OG_IMAGE || '/LenZ-white-logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}