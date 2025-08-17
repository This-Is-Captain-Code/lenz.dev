import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '../components/query-provider';
import { Toaster } from '../components/ui/toaster';
import { MiniKitContextProvider } from '../providers/MiniKitProvider';
import { LenzWalletProvider } from '../providers/LenzWalletProvider';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'LenZ Camera - AR Camera with Web3',
  description: 'Create stunning AR photos using Snapchat lenses and mint them as NFTs on Base',
  manifest: '/manifest',
  openGraph: {
    title: 'LenZ Camera - AR Camera with Web3',
    description: 'Create stunning AR photos using Snapchat lenses and mint them as NFTs on Base',
    url: process.env.NEXT_PUBLIC_URL || 'https://your-app.replit.app',
    siteName: 'LenZ Camera',
    images: [
      {
        url: process.env.NEXT_PUBLIC_APP_OG_IMAGE || '/LenZ-white-logo.png',
        width: 1200,
        height: 630,
        alt: 'LenZ Camera - AR Photos with NFT Minting',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LenZ Camera - AR Camera with Web3',
    description: 'Create stunning AR photos using Snapchat lenses and mint them as NFTs on Base',
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
        <MiniKitContextProvider>
          <LenzWalletProvider>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </LenzWalletProvider>
        </MiniKitContextProvider>
      </body>
    </html>
  );
}