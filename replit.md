# Overview

This is a full-stack web application that integrates Snapchat's Camera Kit to create a lens-based photo experience. The app allows users to apply augmented reality (AR) lenses to their camera feed, browse available lenses, and capture photos with applied effects. It's built as a modern web application with Next.js App Router, featuring a mobile-first design with Snapchat-like interface including post-capture sharing functionality.

## Recent Changes (August 17, 2025)
- **DEPLOYMENT FIX**: Successfully converted hybrid Express+Next.js setup to pure Next.js application
- Fixed TypeScript build issues by adding missing Express type declarations
- Removed experimental esmExternals configuration that was causing deployment warnings
- Migrated all Express API routes to Next.js API routes:
  - `/api/lenses` - GET/POST for lens management
  - `/api/lenses/[id]` - GET specific lens details
  - `/api/my-lenses` - GET/POST user lens collection
  - `/api/user` - GET current user data
  - `/api/logout` - POST logout functionality
- Moved storage layer from server/ to app/lib/ for Next.js compatibility
- Removed legacy Express server files and client/ directory
- Fixed Next.js 15 async params warning in dynamic routes
- Application now ready for deployment with pure Next.js architecture

## Previous Changes (January 17, 2025)
- Successfully migrated from Express+Vite to Next.js App Router while maintaining full camera functionality
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
- **Runtime**: Pure Next.js API Routes for serverless backend functionality
- **Language**: TypeScript for full-stack type safety
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations (ready for production)
- **Data Storage**: In-memory storage for development (MemStorage class in app/lib/storage.ts)
- **Session Management**: Ready for Next.js session handling implementation
- **API Structure**: RESTful endpoints following Next.js App Router conventions

## Database Design
The schema includes three main entities:
- **Users**: Basic authentication with username/password
- **Lenses**: AR lens metadata including Snap lens IDs, categories, and creator information
- **UserLenses**: Junction table tracking user purchases/access to specific lenses

## Authentication & Authorization
- Simple username/password authentication without external providers
- Session-based authentication using Express sessions
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
- Hot reloading in development with Vite middleware
- TypeScript compilation with path mapping for clean imports
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

## Snap Platform Integration
The application requires valid Snap Camera Kit API credentials:
- **SNAP_API_TOKEN**: Authentication token for Snap Camera Kit
- **SNAP_GROUP_ID**: Group identifier for lens organization
- Specific lens IDs for individual AR effects