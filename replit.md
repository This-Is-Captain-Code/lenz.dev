# Overview

This is a full-stack web application that integrates Snapchat's Camera Kit to create a lens-based photo experience. The app allows users to apply augmented reality (AR) lenses to their camera feed, browse available lenses, and capture photos with applied effects. It's built as a modern web application with Next.js App Router, featuring a mobile-first design with Snapchat-like interface including post-capture sharing functionality.

## Recent Changes (September 24, 2025)
- **NEW WEB3 INTEGRATION**: Added advanced Web3 functionality with instant microtransactions
  - Integrated Nitrolite SDK (@erc7824/nitrolite) for state channel technology
  - Added Viem for type-safe Ethereum interactions
  - Implemented MetaMask wallet connection with EIP-712 authentication
  - Created real-time WebSocket service for P2P communication
  - Built instant USDC transfer system (0.01 USDC tips for content creators)
  - Added session key management for secure state channel operations
  - Created dedicated Web3 content platform at `/web3` route
- **ENHANCED CONTENT PLATFORM**: Extended existing content features
  - Maintained original content feed at `/content` route  
  - Added Web3-enabled version with microtransaction support
  - Integrated wallet-based authentication and balance tracking
  - Real-time balance updates via WebSocket connections
- **CORE FUNCTIONALITY PRESERVED**: Maintained all essential AR camera features
  - Snapchat Camera Kit integration remains intact at root route `/`
  - Lens selection and application functionality preserved
  - Photo capture and download capabilities maintained
  - Social sharing through standard Web Share API and Twitter intents

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
- **@neondatabase/serverless**: PostgreSQL driver optimized for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations with PostgreSQL support

## UI & Styling
- **@radix-ui/***: Comprehensive set of accessible UI components (dialogs, buttons, forms, etc.)
- **tailwindcss**: Utility-first CSS framework with custom design tokens
- **class-variance-authority**: Type-safe variant handling for component styling
- **lucide-react**: Primary icon library for consistent iconography

## State & Data Management
- **@tanstack/react-query**: Server state management with caching and synchronization
- **react-hook-form**: Form handling with validation
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Runtime type validation for API requests and responses

## Development Tools
- **typescript**: Static type checking across the entire stack
- **framer-motion**: Animation library for smooth UI transitions (used in camera interface)

## Platform Integration
The application requires API credentials for Snap Camera Kit:

### Snap Camera Kit
- **SNAP_API_TOKEN**: Authentication token for Snap Camera Kit
- **SNAP_GROUP_ID**: Group identifier for lens organization
- Specific lens IDs for individual AR effects