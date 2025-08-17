import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'LenZ Camera',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Create amazing AR photos with Snapchat Camera Kit lenses and mint them as NFTs',
    version: '1.0.0',
    start_url: '/',
    display: 'standalone',
    background_color: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#000000',
    theme_color: '#8B5CF6',
    icons: [
      {
        src: process.env.NEXT_PUBLIC_APP_ICON || '/LenZ-white-logo.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    minikit: {
      url: process.env.NEXT_PUBLIC_URL || 'https://your-app.replit.app',
      projectName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'LenZ Camera',
      category: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || 'social',
      tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'AR Camera with NFT Minting',
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Create stunning AR photos using Snapchat lenses and mint them as NFTs on Base'
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}