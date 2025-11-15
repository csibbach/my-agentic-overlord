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
   - Worker registration via `/register` command with skills
   - Task notification and bidding system (first to accept wins)
   - Evidence submission workflow:
     - Workers send photos → bot downloads, resizes to max 1,568px, compresses to JPEG 85%, converts to base64, caches in memory
     - Image processing uses sharp library for optimal Anthropic API compatibility
     - Workers optionally share GPS location → bot saves coordinates
     - Workers send `/submit` command → bot posts all evidence to API
     - State management: pendingEvidence Map tracks submissions per worker
     - Task alignment: automatically resets evidence if worker accepts new task
   - Payment confirmation notifications via Telegram messages

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
1. Customer agent submits task via POST /api/tasks/submit with x402 payment (USDC on Base)
2. x402 middleware verifies payment receipt before accepting task
3. System generates vector embedding and queries Pinecone for matching workers
4. Matching workers receive Telegram notification with task details
5. First worker to accept is assigned; others receive rejection notification
6. Worker completes task and submits evidence via Telegram (photos + geolocation)
7. Anthropic AI analyzes evidence and returns verification decision
8. If approved, Stripe fiat payment is processed to worker's connected account
9. Worker receives payment confirmation via Telegram

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
- `settings`: Oligarch configuration (x402 wallet address, Stripe balance)

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
- **x402 + Coinbase Developer Platform**: Crypto payment acceptance for task submissions
  - USDC payments on Base network (Mainnet)
  - $0.001 per task submission
  - Facilitator: Coinbase CDP with zero fees
  - Requires EVM wallet address configuration in Oligarch dashboard
  - Middleware activated on server start when valid wallet configured
- **Stripe**: Fiat payment processing and worker payouts
  - Connected accounts for worker payment reception
  - Webhook support for payment status updates
  - Not required for basic functionality (task routing still works)
  
**Payment Flow**:
- Bots pay oligarch in USDC (crypto) via x402 for task submission
- Workers receive USD (fiat) via Stripe for task completion
- Oligarch manually converts crypto receipts to fiat for worker payouts

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
- x402 payments: Enabled when CDP_API_KEY_ID and CDP_API_KEY_SECRET are set
  - Middleware activates only when valid EVM wallet address is configured in settings
  - Task submission blocked until wallet configured
  - Server restart required after initial wallet configuration
- All features degrade gracefully when dependencies are unavailable