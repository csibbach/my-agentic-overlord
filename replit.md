# TaskRoute - AI-Powered Task Management System

## Overview

TaskRoute is an intelligent task routing and management platform that connects customer agents with human workers ("meat robots") through AI-powered matching and automated verification. The system receives tasks via API, uses vector similarity to match workers based on skills and location, facilitates task assignment through Telegram, and employs Anthropic AI to verify task completion before processing payments through Stripe.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript and Vite
- Single-page application (SPA) using React Router (wouter)
- Component library: shadcn/ui built on Radix UI primitives
- Styling: Tailwind CSS with Material Design 3 principles
- State management: TanStack Query (React Query) for server state
- Type safety: Shared TypeScript schemas between frontend and backend

**Design System**:
- Material Design 3 approach for information-dense interfaces
- Custom theme with light/dark mode support
- Roboto font family via Google Fonts CDN
- Consistent spacing units (2, 4, 6, 8, 12, 16) using Tailwind
- Color system using HSL with CSS variables for theming

**Key Pages**:
- Dashboard: Real-time stats, task tables, worker management, verifications
- API Documentation: Integration guide for customer agents
- Task detail modal: Shows evidence, geolocation, AI verification results

### Backend Architecture

**Runtime**: Node.js with Express
- TypeScript throughout the stack
- RESTful API endpoints for task submission, worker management, and stats
- Shared schema definitions between client and server
- Middleware for JSON parsing with raw body preservation (for webhooks)

**Core Services**:

1. **Storage Service** (`server/storage.ts`):
   - Abstraction layer over database operations
   - CRUD operations for workers, tasks, assignments, evidence, verifications, payments
   - Handles complex queries like task details with joins

2. **Telegram Bot Service** (`server/telegramBot.ts`):
   - Worker registration via `/register` command
   - Task notification and bidding system (first to accept wins)
   - Evidence submission (photos + geolocation)
   - Payment confirmation notifications

3. **Vector Matching Service** (`server/vectorService.ts`):
   - Semantic similarity search for task-to-worker matching
   - Uses OpenAI embeddings (text-embedding-3-small)
   - Pinecone vector database for storage and retrieval
   - Falls back to returning all available workers if vector DB unavailable

4. **AI Verification Service** (`server/anthropicService.ts`):
   - Analyzes task evidence using Anthropic Claude
   - Evaluates photos, geolocation, and task requirements
   - Returns decision (approved/rejected/needs_review), reasoning, and confidence score
   - Uses Replit's AI Integrations service for Anthropic API access

**Workflow**:
1. Customer agent submits task via POST /api/tasks (description, payment, location, requirements)
2. System generates vector embedding and queries Pinecone for matching workers
3. Matching workers receive Telegram notification with task details
4. First worker to accept is assigned; others receive rejection notification
5. Worker completes task and submits evidence via Telegram (photos + geolocation)
6. Anthropic AI analyzes evidence and returns verification decision
7. If approved, Stripe payment is processed to worker's connected account
8. Worker receives payment confirmation via Telegram

### Data Storage

**Database**: PostgreSQL via Neon serverless
- ORM: Drizzle with type-safe query building
- Connection pooling with WebSocket support for serverless environments
- Schema defined in `shared/schema.ts`

**Core Tables**:
- `workers`: Telegram handles, skills, availability, Stripe accounts, ratings
- `tasks`: Descriptions, payment amounts, locations, requirements, status
- `task_assignments`: Bidding history, acceptance tracking
- `task_evidence`: Photos (base64), geolocation data
- `verifications`: AI decisions, reasoning, confidence scores
- `payments`: Stripe transaction records, amounts, statuses

**Relationships**:
- Tasks → Workers (many-to-one assignment)
- Tasks → TaskAssignments (one-to-many for bidding)
- Tasks → TaskEvidence (one-to-one)
- Tasks → Verifications (one-to-one)
- Tasks → Payments (one-to-one)

### External Dependencies

**AI & Machine Learning**:
- **Anthropic Claude**: Task verification via vision analysis (photos + context)
  - Accessed through Replit AI Integrations service
  - No separate API key required when deployed on Replit
- **OpenAI**: Text embeddings for semantic search (text-embedding-3-small)
  - Required for vector matching functionality
- **Pinecone**: Vector database for skill/task matching
  - Stores worker capabilities and task requirements as embeddings
  - Falls back gracefully if unavailable

**Payment Processing**:
- **Stripe**: Payment processing and worker payouts
  - Connected accounts for worker payment reception
  - Webhook support for payment status updates
  - Not required for basic functionality (task routing still works)

**Communication**:
- **Telegram Bot API**: Worker interface via node-telegram-bot-api
  - Registration, task notifications, evidence submission
  - Uses polling mode for message receiving
  - Disabled gracefully if TELEGRAM_BOT_TOKEN not provided

**Infrastructure**:
- **Neon**: Serverless PostgreSQL database
  - WebSocket connections for serverless compatibility
  - Connection pooling via @neondatabase/serverless
- **Vite**: Development server and production build tool
  - HMR support in development
  - React plugin with runtime error overlay

**Feature Flags**:
- Vector matching: Enabled when PINECONE_API_KEY and OPENAI_API_KEY are set
- Telegram bot: Enabled when TELEGRAM_BOT_TOKEN is set
- Stripe payments: Enabled when STRIPE_SECRET_KEY is set
- All features degrade gracefully when dependencies are unavailable