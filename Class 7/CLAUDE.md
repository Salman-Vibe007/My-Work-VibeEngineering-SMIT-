# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This directory houses Class 7 work — the **Claude Code Fundamentals** phase of the Vibe Engineering course (Week 5). The focus is on professional CLI workflows, slash commands, checkpoints, and session management with Claude Code.

## Architecture

This class follows the course structure where each class directory contains a standalone project:

```
Class N/
├── project-name/          # Main project directory
│   ├── src/               # Source code
│   ├── components/        # Reusable UI components
│   ├── lib/               # Utility functions, API clients
│   ├── public/            # Static assets
│   ├── tests/             # Unit and E2E tests
│   ├── .env.example       # Environment variable template
│   ├── .gitignore         # Git ignore rules
│   ├── package.json       # Dependencies and scripts
│   └── README.md          # Project documentation
└── CLAUDE.md              # This file
```

## Development Setup

### Prerequisites
- Node.js v18+
- PostgreSQL (if using direct DB) or Supabase account
- npm, yarn, or pnpm

### Installation
```bash
# Navigate to project directory
cd project-name

# Install dependencies
npm install
```

### Environment Variables
Copy `.env.example` to `.env` and fill in values:
```bash
cp .env.example .env
```

## Common Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Linting
```bash
# Run ESLint
npm run lint

# Run Prettier
npm run format
```

### Testing
```bash
# Run unit tests (Jest)
npm run test

# Run E2E tests (Playwright)
npm run test:e2e
```

## Code Quality Guidelines

- Use TypeScript for all frontend and backend code
- Follow ESLint and Prettier configurations for consistent code style
- Keep components small and reusable
- Avoid unnecessary abstractions; prioritize clarity and performance
- No emojis in code comments or UI text

## Key Patterns

See `Class 6/Watch Project/CLAUDE.md` for a complete reference of established patterns used across projects:
- Component architecture (small, focused components)
- State management (Zustand for global state)
- Data fetching (server components where appropriate)
- Authentication flow patterns
- Styling with Tailwind CSS
