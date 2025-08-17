# Overview

This is a full-stack web application that integrates Snapchat's Camera Kit to create a lens-based photo experience. The app allows users to apply augmented reality (AR) lenses to their camera feed, browse available lenses, and capture photos with applied effects. It's built as a modern web application with Next.js App Router, featuring a mobile-first design with Snapchat-like interface including post-capture sharing functionality.

## Recent Changes (August 17, 2025)
- **REWARD DISTRIBUTION SYSTEM**: Implemented comprehensive CDP-based weekly reward system
  - Added lens interaction tracking (apply, capture, share, download) with weighted scoring
  - Created PostgreSQL schema for interactions, distributions, and creator rewards
  - Built reward calculation engine with weighted distribution based on creator engagement
  - Integrated CDP (Coinbase Developer Platform) for automated USDC reward payments
  - Added interaction tracking to camera component for all lens activities
  - Created admin dashboard for viewing and managing reward distributions
  - Implemented APIs for interaction tracking, reward distribution, and status monitoring
  - Weekly reward pool of $1000 USDC distributed based on weighted creator interactions
- **SQUIDROUTER BRIDGE INTEGRATION**: Added cross-chain token bridging from Saga to Base
  - Integrated @0xsquid/sdk for seamless cross-chain token bridging functionality
  - Created SquidBridge service for bridging LENZ tokens from Saga chainlet to Base USDC
  - Built comprehensive BridgeModal component with fee estimation and progress tracking
  - Added bridge transaction status monitoring with real-time progress updates
  - Implemented bridge APIs for route calculation, fee estimation, and status checking
  - Enhanced dashboard with bridge functionality replacing swap button
  - Enables users to move LENZ tokens to Base chain for CDP reward distributions
- **WEB3 INTEGRATION**: Added MiniKit (OnchainKit) for Web3 functionality
  - Installed @coinbase/onchainkit package for Farcaster and blockchain integration
  - Created MiniKitProvider wrapper for Web3 wallet connectivity
  - Integrated useMiniKit hook for frame initialization
  - Added NFT minting button that opens Zora.co with clipboard image copy
  - Added Farcaster share button using useComposeCast hook
  - Both features copy captured photos to clipboard for easy sharing
  - Configured Base chain integration for optimal Web3 performance
- **MINIKIT ENVIRONMENT SETUP**: Configured required environment variables and manifest
  - Added comprehensive .env.local with all MiniKit required variables
  - Created dynamic manifest.json API route (/manifest) for Farcaster app registration
  - Updated metadata with Open Graph and Twitter card support
  - Configured proper environment variable fallbacks in MiniKitProvider
  - Set up placeholder values for Farcaster credentials (HEADER, PAYLOAD, SIGNATURE)
- **LENZ CHAINLET WALLET INTEGRATION**: Added dedicated LenZ chainlet wallet system
  - Created LenzWalletProvider with ethers.js integration for custom Saga chainlet
  - Built LenzWalletModal and LenzWalletButton components for wallet management
  - Integrated wallet creation, import, and balance checking on LenZ chainlet
  - Added LenzNftMinter component for direct NFT minting on LenZ chain
  - Configured chainlet details: ID, RPC endpoints, native LENZ token support
  - Positioned as secondary wallet option alongside Base app's primary wallet
- **DASHBOARD PAGE CREATION**: Built comprehensive wallet and lens management dashboard
  - Implemented gradient background design (990022 to 220099) as requested
  - Added Phosphor Icons for consistent iconography throughout interface
  - Created dual-tab layout for Tokens and My Lenses management
  - Integrated with LenZ wallet balance display and transaction functionality
  - Connected profile button navigation from camera to dashboard page
  - **WALLET-GATED DASHBOARD**: Moved LenZ wallet creation to dashboard entry point
  - Users must create LenZ wallet before accessing dashboard features
  - Dashboard displays actual LENZ token balance from user's chainlet wallet
  - Removed wallet button from camera interface to centralize wallet management
- **MAJOR MIGRATION**: Successfully converted from Express+Vite hybrid architecture to pure Next.js App Router
  - Removed all Express server dependencies and files (server/ directory)
  - Migrated all Express API routes to Next.js API routes (app/api/)
  - Updated storage layer to work with Next.js serverless functions
  - Fixed deployment issues by eliminating Express import errors
  - Preserved all camera functionality and UI design during migration
- **DEPLOYMENT FIXES**: Resolved Next.js 15 compatibility issues for production deployment
  - Fixed TypeScript compilation error in API routes by updating params type to Promise
  - Removed legacy vite.config.ts file that was causing build conflicts
  - Successfully completed production build with all optimizations
- Fixed lens application issues by using correct Camera Kit API (`loadLens` instead of `getLens`)
- Restored original Snapchat-like UI design with:
  - Profile icon (top left), lens name (top center), help icon (top right)
  - Swipeable lens carousel at bottom with center lens as capture button
  - Post-capture polaroid-style photo frame with social sharing
  - Twitter sharing with "Captured using @lenzdotdev" text
  - Download functionality with proper 9:16 aspect ratio

# User Preferences

Preferred communication style: Simple, everyday language.

## UI Design Preferences
- **Font**: Inter Display for modern, clean typography
- **Camera Interface**: Snapchat-like layout with:
  - Profile icon at top left
  - Filter name at top center in rounded background
  - Help icon (question mark) at top right
  - Centered lens carousel at bottom (5 lenses visible, selected always in center)
  - Selected lens acts as capture button with camera icon
  - Carousel shifts horizontally when swiping to keep selected lens centered
  - Touch/swipe gestures for lens navigation with smooth transitions

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 14+ with App Router and TypeScript for modern full-stack development
- **Routing**: Single-page application loading directly at root route `/` - no separate camera page needed
- **UI Components**: Radix UI components with shadcn/ui design system for accessibility and consistency
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Camera Integration**: Snap Camera Kit SDK for AR lens functionality and camera access
- **Build Tool**: Next.js with built-in optimizations and server-side rendering

## Backend Architecture
- **Runtime**: Pure Next.js API Routes for serverless backend functionality (no Express)
- **Language**: TypeScript for full-stack type safety
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Data Storage**: In-memory storage located in `lib/storage.ts` for development
- **Session Management**: Next.js session handling for user authentication state

## Database Design
The schema includes three main entities:
- **Users**: Basic authentication with username/password
- **Lenses**: AR lens metadata including Snap lens IDs, categories, and creator information
- **UserLenses**: Junction table tracking user purchases/access to specific lenses

## Authentication & Authorization
- Simple username/password authentication without external providers
- Session-based authentication using Next.js built-in session handling
- Basic user state management for lens access control

## Camera Kit Integration
- Direct integration with Snap Camera Kit SDK for AR functionality
- Canvas-based rendering for camera feed and lens effects
- Support for front/back camera switching and photo capture
- Lens application through Snap's provided APIs with group and lens ID management

## API Structure
RESTful endpoints following standard conventions:
- `GET /api/lenses` - Retrieve all available lenses
- `GET /api/lenses/:id` - Get specific lens details
- `POST /api/lenses` - Create new lens (admin functionality)
- `GET /api/my-lenses` - User's purchased/accessible lenses
- User authentication endpoints for login/logout

## Development Setup
- Hot reloading in development with Next.js built-in dev server
- TypeScript compilation with path mapping for clean imports
- Pure Next.js architecture without Express dependencies
- Environment-based configuration for API tokens and database connections
- Replit-specific optimizations for cloud development environment

# External Dependencies

## Core Dependencies
- **@snap/camera-kit**: Snapchat's official SDK for AR lens integration and camera functionality
- **@coinbase/onchainkit**: MiniKit framework for Web3 integration, Farcaster connectivity, and blockchain features
- **@neondatabase/serverless**: PostgreSQL driver optimized for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations with PostgreSQL support

## UI & Styling
- **@radix-ui/***: Comprehensive set of accessible UI components (dialogs, buttons, forms, etc.)
- **tailwindcss**: Utility-first CSS framework with custom design tokens
- **class-variance-authority**: Type-safe variant handling for component styling
- **@phosphor-icons/react**: Primary icon library for consistent iconography (required throughout the interface)

## State & Data Management
- **@tanstack/react-query**: Server state management with caching and synchronization
- **react-hook-form**: Form handling with validation
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Runtime type validation for API requests and responses

## Development Tools
- **vite**: Fast build tool with hot module replacement
- **typescript**: Static type checking across the entire stack
- **wouter**: Lightweight routing library for React
- **framer-motion**: Animation library for smooth UI transitions (used in camera interface)

## Platform Integration
The application requires API credentials for both Snap and Coinbase platforms:

### Snap Camera Kit
- **SNAP_API_TOKEN**: Authentication token for Snap Camera Kit
- **SNAP_GROUP_ID**: Group identifier for lens organization
- Specific lens IDs for individual AR effects

### Coinbase MiniKit (Web3)
- **NEXT_PUBLIC_CDP_CLIENT_API_KEY**: Coinbase Developer Platform API key for Web3 functionality
- Enables Farcaster connectivity, NFT minting, and blockchain transactions
- Configured for Base chain integration