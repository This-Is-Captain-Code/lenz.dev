# Farcaster MiniKit Setup Guide

Your LenZ Camera app is now configured for MiniKit integration! To complete the setup and get real Farcaster credentials, follow these steps:

## Current Status ✅
- ✅ Environment variables configured in `.env.local`
- ✅ Manifest API endpoint created at `/manifest`
- ✅ MiniKitProvider updated with proper configuration
- ✅ Open Graph and Twitter card metadata added
- ✅ Placeholder Farcaster credentials in place

## Next Steps to Complete Farcaster Integration

### 1. Deploy Your App
Your app must be deployed on HTTPS for Farcaster to work. Deploy to Replit first:
- Click the "Deploy" button in Replit
- Get your deployment URL (e.g., `https://your-app-name.replit.app`)

### 2. Update Environment Variables
Replace these placeholder values in your deployed environment:
```bash
NEXT_PUBLIC_URL=https://your-actual-deployment-url.replit.app
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_actual_onchainkit_api_key
```

### 3. Generate Real Farcaster Credentials
Once deployed, you can generate real Farcaster credentials:

**Option A: Use create-onchain CLI (if available)**
```bash
npx create-onchain@latest --manifest
```

**Option B: Manual Farcaster Registration**
1. Visit the Farcaster Developer Console
2. Register your app with your deployment URL
3. Generate the required credentials:
   - `FARCASTER_HEADER`
   - `FARCASTER_PAYLOAD` 
   - `FARCASTER_SIGNATURE`

### 4. Test MiniKit Features
After setting real credentials:
- NFT minting via Zora.co should work
- Farcaster sharing should work properly
- Web3 wallet connectivity should be functional

## Environment Variables Reference

### Required
- `NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME`: "LenZ Camera"
- `NEXT_PUBLIC_URL`: Your HTTPS deployment URL
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`: Your Coinbase Developer Platform API key
- `FARCASTER_HEADER`: Base64 header from Farcaster registration
- `FARCASTER_PAYLOAD`: Base64 payload from Farcaster registration
- `FARCASTER_SIGNATURE`: Hex signature from Farcaster registration

### Optional (for enhanced appearance)
- `NEXT_PUBLIC_APP_ICON`: URL to your app icon
- `NEXT_PUBLIC_APP_SUBTITLE`: "AR Camera with Web3"
- `NEXT_PUBLIC_APP_DESCRIPTION`: App description
- `NEXT_PUBLIC_APP_PRIMARY_CATEGORY`: "social"
- `NEXT_PUBLIC_APP_TAGLINE`: "AR Camera with NFT Minting"
- `NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR`: "#000000"

## Troubleshooting
- Ensure all URLs use HTTPS
- Verify API keys are valid
- Check that the manifest is accessible at `/manifest`
- Confirm environment variables are loaded in production

Your camera app is ready for Web3! 🚀