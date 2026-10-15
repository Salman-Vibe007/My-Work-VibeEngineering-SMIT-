# Chronos Watch Store: Project Idea & Documentation

## Project Idea: Chronos Watch Store

### Overview
A full-stack e-commerce application dedicated to selling premium wristwatches. The platform allows users to browse a curated catalog, view detailed product specifications, manage a shopping cart, and complete secure purchases. The design emphasizes luxury, precision, and readability, utilizing a sophisticated color palette of Black, Green, Brown, Blue, and Cream.

### Business Requirements
- Single Vendor Store: Focused exclusively on wristwatches (mechanical, quartz, smart).
- Product Catalog: Display watches with high-resolution images, price, brand, movement type, and case material.
- User Accounts: Users can register, login, view order history, and manage shipping addresses.
- Shopping Cart: Persistent cart for logged-in users; session-based for guests.
- Checkout Process: Multi-step checkout including shipping details, payment method selection, and order confirmation.
- Admin Dashboard: Basic interface for administrators to add/edit/delete products and view orders.
- Search and Filter: Filter by brand, price range, and style. Search by model name or brand.
- Responsive Design: Fully functional on mobile, tablet, and desktop devices.

### Technical Details
- Frontend: Next.js 14+ (App Router), React, TypeScript.
- Backend: Node.js with Express or Next.js API Routes.
- Database: PostgreSQL for relational data (users, orders, products).
- ORM: Prisma for type-safe database access.
- State Management: Zustand or Context API for cart and user state.
- Styling: Tailwind CSS for utility-first styling.
- Authentication: NextAuth.js or JWT-based custom authentication.
- Payment Integration: Stripe API for secure payment processing.
- Image Storage: Cloudinary or AWS S3 for product images.

### Color Scheme
- Black (#121212): Backgrounds, primary text, footer.
- Green (#2E8B57): Success states, "In Stock" indicators, accent buttons.
- Brown (#8B4513): Leather strap accents, secondary borders, warm highlights.
- Blue (#4682B4): Links, primary action buttons, trust badges.
- Cream (#FFFDD0): Card backgrounds, main content areas, readable text on dark sections.

### Strategy
1. Phase 1: Setup & Schema: Initialize Next.js project, configure PostgreSQL, define Prisma schema.
2. Phase 2: Core Backend: Implement API routes for product retrieval, user authentication, and cart management.
3. Phase 3: Frontend Foundation: Build layout components, navigation, and home page.
4. Phase 4: Product & Search: Develop product listing page with filters and individual product detail pages.
5. Phase 5: Cart & Checkout: Implement shopping cart logic and integrate Stripe.
6. Phase 6: User Dashboard: Create profile page, order history, and address management.
7. Phase 7: Admin Panel: Build basic admin interface for product CRUD operations.
8. Phase 8: Testing & Polish: Unit testing with Jest, integration testing with Playwright, UI refinement.

### Coding Standards
- Use TypeScript for all frontend and backend code.
- Follow ESLint and Prettier configurations for consistent code style.
- Keep components small and reusable.
- Avoid unnecessary abstractions; prioritize clarity and performance.
- No emojis in code comments or UI text.
- Minimal README with essential setup instructions.

### Project Structure
root/
├── frontend/          # Next.js application
│   ├── app/           # App router pages
│   ├── components/    # Reusable UI components
│   ├── lib/           # Utility functions, API clients
│   └── public/        # Static assets
├── backend/           # Optional separate backend if not using Next.js API routes
├── prisma/            # Database schema and migrations
├── tests/             # Playwright and Jest tests
├── .gitignore
├── CLAUDE.md
└── AGENTS.md

---

## README.md

### Chronos Watch Store

A full-stack e-commerce application dedicated to selling premium wristwatches. The platform features a curated catalog, user accounts, a persistent shopping cart, secure Stripe checkout, and an admin dashboard. 

### Tech Stack
- Frontend: Next.js 14+ (App Router), React, TypeScript
- Styling: Tailwind CSS
- Backend: Next.js API Routes (or Express)
- Database: PostgreSQL
- ORM: Prisma
- State Management: Zustand
- Authentication: NextAuth.js
- Payments: Stripe API
- Testing: Jest (Unit), Playwright (E2E)

### Prerequisites
- Node.js v18 or higher
- PostgreSQL v14 or higher
- npm, yarn, or pnpm

### Environment Variables
Create a `.env` file in the root directory with the following variables:

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chronos_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Image Storage (Optional/If using Cloudinary)
CLOUDINARY_URL="cloudinary://..."

### Installation and Setup

1. Clone the repository and navigate into the project directory:
   git clone <repository-url>
   cd chronos-watch-store

2. Install dependencies for the frontend:
   cd frontend
   npm install
   cd ..

3. Set up the PostgreSQL database. Ensure your DATABASE_URL in the .env file is correct.

4. Run Prisma migrations to create the database schema and generate the Prisma Client:
   npx prisma migrate dev --name init

5. Seed the database with dummy watch data for development:
   npx prisma db seed

### Running the Application
Start the development server:
   cd frontend
   npm run dev

The application will be available at http://localhost:3000.

### Testing
Run unit and integration tests using Jest:
   cd frontend
   npm run test

Run end-to-end tests using Playwright:
   npm run test:e2e

### Color Scheme Reference
- Black (#121212): Backgrounds, primary text, footer.
- Green (#2E8B57): Success states, "In Stock" indicators, accent buttons.
- Brown (#8B4513): Leather strap accents, secondary borders, warm highlights.
- Blue (#4682B4): Links, primary action buttons, trust badges.
- Cream (#FFFDD0): Card backgrounds, main content areas, readable text on dark sections.