# Agent Guidelines for Polling App

## Build & Development Commands
- **Development server**: `npm run dev`
- **Build production**: `npm run build`
- **Lint code**: `npm run lint`
- **Type check**: `npm run tsc`
- **No test framework configured yet**

## Code Style Guidelines

### Architecture
- **Framework**: Next.js App Router with TypeScript
- **Database/Auth**: Supabase
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: Server Components for data, Client Components for interactivity
- **API**: API Routes for mutations, direct Supabase queries in Server Components

### File Structure
- `/app` - Routes and pages
- `/components/ui` - shadcn/ui components
- `/components` - Custom reusable components
- `/lib` - Supabase client, utilities

### Naming Conventions
- **Components**: PascalCase (PollCreateForm.tsx)
- **Functions/Actions**: camelCase (createPoll, submitVote)
- **Files**: kebab-case for pages, PascalCase for components

### Imports & Paths
- Use path aliases: `@/*` for project root
- Group imports: React, then external libs, then internal modules
- Prefer absolute imports over relative

### Security & Validation
- CSRF protection on all forms
- Input sanitization with DOMPurify
- Server-side validation in API Routes
- Never hardcode secrets - use environment variables

### Error Handling
- Try/catch blocks in API Routes
- Return error objects: `{ error: string | null }`
- Client-side error display in components

### Component Patterns
- Prefer Server Components for data fetching
- Use `'use client'` only for interactivity/hooks
- Form actions call API Routes directly
- State management: useState/useReducer for local state

## Cursor/Trae Rules
Follow the project rules in `.cursor/rules/project-spec.mdc` and `.trae/rules/project_rules.md`:
- Use Next.js App Router and Server Components
- API Routes for data mutations
- Supabase client for all database interactions
- shadcn/ui components for UI consistency
- Environment variables for secrets (SUPABASE_URL, SUPABASE_SECRET_KEY)