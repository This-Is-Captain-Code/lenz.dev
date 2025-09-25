# Lenz Camera App

A full-stack web application that integrates Snapchat's Camera Kit to create a lens-based photo experience with advanced Web3 functionality. The app allows users to apply augmented reality (AR) lenses to their camera feed, browse available lenses, capture photos with applied effects, and perform instant microtransactions using state channel technology.

## 🚀 Core Tech Stack

### **Full-Stack Framework**
- **[Next.js 15.4+](https://nextjs.org/)** - React framework with App Router and API routes
- **[React 18.3+](https://react.dev/)** - Frontend library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type safety across the stack

### **AR Camera Experience**
- **[@snap/camera-kit](https://docs.snap.com/camera-kit)** - Snapchat's AR lens SDK for real-time camera effects

### **Web3 Microtransactions**
- **[@erc7824/nitrolite](https://nitrolite.org/)** - State channels for instant USDC payments
- **[Viem](https://viem.sh/)** - Ethereum wallet interactions
- **WebSocket** - Real-time P2P communication

### **Database & Backend**
- **[PostgreSQL](https://www.postgresql.org/)** - Primary database
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database operations

### **UI & Styling**
- **[Radix UI](https://www.radix-ui.com/)** + **[shadcn/ui](https://ui.shadcn.com/)** - Accessible component library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Framer Motion](https://www.framer.com/motion/)** - Smooth animations

### **State Management**
- **[TanStack Query](https://tanstack.com/query)** - Server state and caching
- **[React Hook Form](https://react-hook-form.com/)** + **[Zod](https://zod.dev/)** - Form handling and validation

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