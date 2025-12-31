# TaskFlow - To-Do List Application

## Overview

TaskFlow is a production-ready task management web application built with a modern full-stack architecture. The application allows users to create, edit, delete, and organize tasks with features like priority levels, due dates, subtasks, and filtering capabilities. It follows a monorepo structure with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using functional components and hooks
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management with automatic caching and synchronization
- **Styling**: Tailwind CSS with a custom design system using CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives with custom styling)
- **Animations**: Framer Motion for smooth transitions and list animations
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with typed route definitions shared between client and server
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas for input validation (integrated with Drizzle via drizzle-zod)
- **Development**: Hot module replacement via Vite middleware in development mode

### Data Storage
- **Database**: PostgreSQL
- **Schema Management**: Drizzle Kit for migrations (`npm run db:push`)
- **Tables**: 
  - `tasks` - Main task records with title, description, priority, due date, completion status
  - `subtasks` - Child tasks linked to parent tasks via foreign key

### Shared Code
- **Location**: `/shared` directory contains code used by both frontend and backend
- **Schema**: Database schema definitions and Zod validation schemas
- **Routes**: API route definitions with type-safe input/output schemas

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/   # UI components (custom + shadcn/ui)
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Page components
│       └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared types and schemas
│   ├── schema.ts     # Drizzle schema definitions
│   └── routes.ts     # API contract definitions
└── migrations/       # Database migrations
```

### Build Process
- Development: `npm run dev` - Runs Express with Vite middleware for HMR
- Production: `npm run build` - Vite builds frontend, esbuild bundles server
- Output: `dist/` directory with `index.cjs` (server) and `public/` (static assets)

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **pg**: Node.js PostgreSQL client library
- **Drizzle ORM**: Type-safe query builder and schema management

### UI Component Library
- **Radix UI**: Headless, accessible UI primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-styled component collection built on Radix UI
- **Lucide React**: Icon library

### Frontend Libraries
- **TanStack React Query**: Async state management and data fetching
- **Framer Motion**: Animation library
- **date-fns**: Date formatting and manipulation
- **class-variance-authority**: Variant-based component styling
- **tailwind-merge**: Tailwind class deduplication

### Build Tools
- **Vite**: Frontend bundler with React plugin
- **esbuild**: Fast server bundler for production
- **TypeScript**: Type checking across the entire codebase

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit development tooling