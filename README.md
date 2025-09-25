# Lenz Camera App

A full-stack web application that integrates Snapchat's Camera Kit to create a lens-based photo experience with advanced Web3 functionality. The app allows users to apply augmented reality (AR) lenses to their camera feed, browse available lenses, capture photos with applied effects, and perform instant microtransactions using state channel technology.

## 🚀 Tech Stack

### **Frontend Framework & Core Technologies**
- **[Next.js 15.4+](https://nextjs.org/)** - React framework with App Router for modern full-stack development
- **[React 18.3+](https://react.dev/)** - Frontend library for building user interfaces
- **[TypeScript 5](https://www.typescriptlang.org/)** - Static type checking across the entire stack
- **[Tailwind CSS 3.4+](https://tailwindcss.com/)** - Utility-first CSS framework with custom design tokens

### **UI Components & Design System**
- **[Radix UI](https://www.radix-ui.com/)** - Comprehensive set of accessible UI components including:
  - `@radix-ui/react-dialog` - Modal dialogs
  - `@radix-ui/react-dropdown-menu` - Dropdown menus
  - `@radix-ui/react-toast` - Notifications
  - `@radix-ui/react-select` - Select components
  - `@radix-ui/react-tabs` - Tab components
  - `@radix-ui/react-progress` - Progress indicators
  - `@radix-ui/react-avatar` - User avatars
  - `@radix-ui/react-checkbox` - Checkboxes
  - `@radix-ui/react-switch` - Toggle switches
  - And many more accessible components
- **[shadcn/ui](https://ui.shadcn.com/)** - Design system built on top of Radix UI
- **[class-variance-authority](https://cva.style/)** - Type-safe variant handling for component styling
- **[clsx](https://github.com/lukeed/clsx)** - Utility for constructing className strings
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Merge Tailwind CSS classes without style conflicts

### **Icons & Graphics**
- **[Lucide React](https://lucide.dev/)** - Primary icon library for consistent iconography
- **[React Icons](https://react-icons.github.io/react-icons/)** - Additional icon sets including company logos
- **[Phosphor Icons](https://phosphoricons.com/)** - Alternative icon library

### **State Management & Data Fetching**
- **[TanStack Query (React Query) 5.6+](https://tanstack.com/query)** - Server state management with caching and synchronization
- **[Axios 1.11+](https://axios-http.com/)** - HTTP client for API requests
- **[Zod 3.24+](https://zod.dev/)** - Runtime type validation for API requests and responses
- **[zod-validation-error](https://github.com/causaly/zod-validation-error)** - Better error messages for Zod validation

### **Forms & Validation**
- **[React Hook Form 7.55+](https://react-hook-form.com/)** - Form handling with validation
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Form validation resolvers for Zod integration
- **[input-otp](https://input-otp.rodz.dev/)** - OTP input component

### **Animation & UI Interactions**
- **[Framer Motion 11.13+](https://www.framer.com/motion/)** - Animation library for smooth UI transitions
- **[tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate)** - Tailwind CSS animation utilities
- **[tw-animate-css](https://github.com/ben-rogerson/twin.macro)** - Additional CSS animations
- **[embla-carousel-react](https://www.embla-carousel.com/)** - Carousel component for lens selection

### **AR & Camera Integration**
- **[@snap/camera-kit 1.8+](https://docs.snap.com/camera-kit)** - Snapchat's official SDK for AR lens integration and camera functionality
- **Canvas API** - For camera feed rendering and lens effects

### **Web3 & Blockchain**
- **[@erc7824/nitrolite 0.3+](https://nitrolite.org/)** - State channel technology for instant microtransactions
- **[Viem 2.32+](https://viem.sh/)** - Type-safe Ethereum interactions
- **WebSocket (ws 8.18+)** - Real-time P2P communication for Web3 features
- **EIP-712** - Ethereum typed data signing standard for secure authentication

### **Backend & Database**
- **[Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)** - Serverless backend functionality
- **[PostgreSQL](https://www.postgresql.org/)** - Primary database
- **[Drizzle ORM 0.39+](https://orm.drizzle.team/)** - Type-safe ORM for database operations
- **[drizzle-zod 0.7+](https://github.com/drizzle-team/drizzle-orm/tree/main/drizzle-zod)** - Zod schema generation from Drizzle models
- **[@neondatabase/serverless 0.10+](https://neon.tech/)** - PostgreSQL driver optimized for serverless environments

### **Utility Libraries**
- **[date-fns 3.6+](https://date-fns.org/)** - Date utility library
- **[react-day-picker 8.10+](https://react-day-picker.js.org/)** - Date picker component
- **[cmdk 1.1+](https://cmdk.paco.me/)** - Command menu component
- **[vaul 1.1+](https://vaul.emilkowal.ski/)** - Drawer component
- **[react-resizable-panels 2.1+](https://github.com/bvaughn/react-resizable-panels)** - Resizable panel layouts

### **Theming & Styling**
- **[next-themes 0.4+](https://github.com/pacocoursey/next-themes)** - Theme switching (light/dark mode)
- **[@tailwindcss/typography 0.5+](https://tailwindcss.com/docs/typography-plugin)** - Typography plugin for Tailwind CSS
- **PostCSS 8.4+** - CSS processing
- **Autoprefixer 10.4+** - CSS vendor prefixing

### **Data Visualization**
- **[Recharts 2.15+](https://recharts.org/)** - Chart library for data visualization

### **Development Tools**
- **[ESLint 8](https://eslint.org/)** - Code linting
- **[eslint-config-next](https://nextjs.org/docs/basic-features/eslint)** - Next.js ESLint configuration
- **[Drizzle Kit 0.30+](https://orm.drizzle.team/kit-docs/overview)** - Database migration and management tool
- **[@types/node](https://www.npmjs.com/package/@types/node)** - Node.js TypeScript definitions
- **[@types/react](https://www.npmjs.com/package/@types/react)** - React TypeScript definitions
- **[@types/react-dom](https://www.npmjs.com/package/@types/react-dom)** - React DOM TypeScript definitions
- **[@types/ws](https://www.npmjs.com/package/@types/ws)** - WebSocket TypeScript definitions

### **Logging & Monitoring**
- **[pino-pretty 13.1+](https://github.com/pinojs/pino-pretty)** - Pretty printing for Pino logs
- **[@jridgewell/trace-mapping 0.3+](https://github.com/jridgewell/trace-mapping)** - Source map utilities

## 🏗️ Architecture

### **Frontend Architecture**
- **Framework**: Next.js 14+ with App Router and TypeScript
- **Routing**: Single-page application loading directly at root route `/`
- **UI Components**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management

### **Backend Architecture**
- **Runtime**: Next.js API Routes for serverless functionality
- **Language**: TypeScript for full-stack type safety
- **Database**: PostgreSQL with Drizzle ORM
- **Data Storage**: In-memory storage for development
- **Session Management**: Next.js session handling

### **Database Schema**
- **Users**: Authentication with username/password
- **Lenses**: AR lens metadata including Snap lens IDs and categories
- **UserLenses**: Junction table for user lens access

### **Web3 Integration**
- **State Channels**: Nitrolite SDK for instant microtransactions
- **Wallet Integration**: MetaMask with EIP-712 authentication
- **Real-time Communication**: WebSocket for P2P interactions
- **Payment System**: USDC transfers (0.01 USDC tips for creators)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Snap Camera Kit API credentials

### Environment Variables
```env
DATABASE_URL=your_postgresql_connection_string
SNAP_API_TOKEN=your_snap_camera_kit_token
SNAP_GROUP_ID=your_snap_group_id
```

### Installation & Development
```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run check
```

## 📱 Features

### **Core AR Camera Features**
- Real-time AR lens application using Snap Camera Kit
- Front/back camera switching
- Photo capture and download
- Lens browsing and selection
- Mobile-first Snapchat-like interface

### **Web3 Features**
- Instant microtransactions via state channels
- MetaMask wallet integration
- EIP-712 secure authentication
- Real-time balance tracking
- Content creator tipping system

### **Social Features**
- Content sharing via Web Share API
- Twitter integration for social posts
- User authentication and profiles
- Lens access management

## 📄 License

This project is private and proprietary.