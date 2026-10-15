# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Chronos Watch Store** is a full-stack e-commerce application for selling premium wristwatches online. The project evolved from the original Next.js/Express/Prisma plan to use **Supabase directly** as the backend, combining PostgreSQL database, authentication, and real-time capabilities.

## Architecture

### Frontend (Next.js 15)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Authentication**: NextAuth.js (planned), currently using Supabase auth

### Backend (Supabase)
- **Database**: PostgreSQL via Supabase
- **Features**: Auth, Database, Storage, Edge Functions
- **Schema**: Defined in `backend/supabase/schema.sql`
- **Access**: Via Supabase client libraries from frontend

### Data Flow
1. Frontend makes API calls directly to Supabase tables
2. Client-side authentication and session management
3. Cart state persisted with `localStorage` via Zustand middleware
4. Server-side middleware handles session management

### Key Components

#### Core Application Files
- `src/app/` - 16 pages using App Router (home, products, product detail, cart, checkout, auth, profile, admin dashboard)
- `src/components/` - 17 reusable UI components (Navbar, ProductCard, CartSummary, etc.)
- `src/lib/supabase/` - Supabase client configuration and middleware
- `src/store/` - Zustand state management (auth, cart)

#### Database Schema
- `src/types/database.ts` - TypeScript interfaces matching Supabase tables
- Tables: products, categories, profiles, orders, order_items, cart_items
- Row Level Security (RLS) policies implemented

### Project Structure
```
frontend/
├── src/
│   ├── app/                    # Next.js pages (16 total)
│   ├── components/            # Reusable UI components
│   ├── lib/supabase/          # Supabase integration
│   ├── store/                 # Zustand state stores
│   └── types/                 # TypeScript interfaces
├── public/                     # Static assets
└── package.json               # Dependencies and scripts
backend/
└── supabase/                  # Database schema and SQL
package.json                  # Root project (minimal)
```

## Development Setup

### Prerequisites
- Node.js v18+
- PostgreSQL v14+ (via Supabase)
- Supabase account and CLI (optional)

### Installation and Setup

#### For Frontend
```bash
cd frontend
npm install
```

#### Environment Variables
Create a `.env.local` file in the `frontend/` directory with:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running the Application

#### Development
```bash
# Start development server
cd frontend
npm run dev

# Application will be available at http://localhost:3000
```

#### Build for Production
```bash
# Build the application
cd frontend
npm run build

# Start production server
npm run start
```

#### Linting
```bash
cd frontend
npm run lint
```

## Testing

**Current State**: Vitest + React Testing Library suite in `frontend/`
- `vitest.config.ts` - jsdom environment, `@` alias, setup file, v8 coverage
- `src/test/setup.ts` - jest-dom matchers + cleanup
- Supabase and `next/navigation` are mocked in tests; no network access needed

### Commands
```bash
cd frontend
npm run test            # run the suite once
npm run test:watch      # watch mode
npm run test:coverage   # run with v8 coverage (text/html/lcov)
```

### Test Files Pattern
- `src/__tests__/` - unit (utils, cart totals, user merging, cart store),
  component (ProductCard, CartSummary, SearchBar, AdminSidebar,
  AdminUsersClient), and integration tests (full checkout flow, including
  order persistence, order items, stock decrement, redirect, and error path)
- Shared fixtures live in `src/__tests__/fixtures.ts`

## Key Implementation Patterns

### 1. Component Architecture
- **Small, focused components** with single responsibilities
- **TypeScript-first** with explicit interfaces
- **Reusability** across the application

### 2. State Management
- **Zustand** for global state (auth, cart)
- **localStorage** persistence for cart
- **Server components** where appropriate for data fetching

### 3. Data Fetching
- **Server-side rendering** for critical data
- **Client-side fetches** for interactive data
- **Supabase real-time** subscriptions

### 4. Authentication Flow
- **Supabase Auth** for user authentication
- **Zustand store** for auth state
- **Middleware** for session management

## Common Commands

### Development
```bash
# Start dev server
cd frontend
npm run dev

# Build for production
cd frontend
npm run build

# Lint code
cd frontend
npm run lint

# Run tests (when implemented)
cd frontend
npm run test
npm run test:e2e
```

### Database
```bash
# View database schema
sqlclient -f backend/supabase/schema.sql

# Run migrations (via Supabase CLI)
supabase db push

# Seed database (via Supabase CLI)
supabase db seed
```

## Code Quality Guidelines

### TypeScript
- Use explicit interfaces over type aliases where appropriate
- Leverage discriminated unions for complex types
- Use `strict` mode fully (already configured)

### Component Design
- Keep components small and focused
- Use server components for data fetching when possible
- Follow DRY principles with utility functions

### Styling
- Tailwind CSS with utility classes
- Consistent color scheme: Black (#121212), Green (#2E8B57), Brown (#8B4513), Blue (#4682B4), Cream (#FFFDD0)
- No emojis in code or UI

## Project Phases (Original Plan)

1. **Phase 1**: Setup & Schema - Database configuration and environment
2. **Phase 2**: Core Backend - API routes and database setup
3. **Phase 3**: Frontend Foundation - Layout and home page
4. **Phase 4**: Product & Search - Catalog with filters
5. **Phase 5**: Cart & Checkout - Shopping flow and Stripe integration
6. **Phase 6**: User Dashboard - Profile and order history
7. **Phase 7**: Admin Panel - Product and order management
8. **Phase 8**: Testing & Polish - Quality assurance

## Current Status
- **Completed**: Core frontend structure, auth, cart, product pages, admin dashboard (products, orders, settings), admin user management (`/admin/users`), Vitest test suite
- **In Progress**: Shopping flow, Stripe integration (based on project documentation)
- **Pending**: Deployment configuration, Stripe integration

## Documentation

### Key Files
- `readme.md` - Project overview and tech stack
- `project.md` - Detailed requirements and functional specs
- `src/types/database.ts` - Database schema and types
- `backend/supabase/schema.sql` - Database SQL schema

### Development Notes
- Project uses a simplified architecture compared to the original plan
- Direct Supabase integration reduces backend complexity
- Frontend handles all application logic
- Zustand provides simple state management
- Tailwind CSS provides utility-first styling

## Next Steps

1. Add Stripe payment integration
3. Complete admin functionality
4. Configure deployment
5. Add error boundaries and loading states
6. Implement responsive improvements