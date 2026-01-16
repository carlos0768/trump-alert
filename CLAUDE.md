# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Trump Alert (トランプアラート)** - A real-time monitoring and analysis system for Donald Trump-related news, social media activity, and market impact (DJT stock).

**Core Value:** Breaking news speed, AI-powered sentiment/summary analysis, and bias visualization.

## Tech Stack

**TypeScript Full-Stack Monorepo** with strict mode enabled.

- **Package Manager:** pnpm
- **Build System:** Turborepo (monorepo structure)
- **Frontend:** Next.js (App Router) + Tailwind CSS + Shadcn/UI (Radix-based)
- **State Management:** Zustand or TanStack Query
- **Charts:** Recharts
- **Backend:** NestJS + Playwright (scraping) + BullMQ (Redis job queue)
- **Database:** PostgreSQL with Prisma ORM
- **Cache/Queue:** Redis
- **AI:** OpenAI API (GPT-4o) or Anthropic API
- **Hosting:** Vercel (Frontend) + Railway/AWS ECS (Backend/Worker)

## Development Commands

```bash
# Format code
npx prettier --write .

# Lint code
npx eslint --fix .

# Note: Build/test commands will be added as the project structure is implemented
```

## Architecture

### Microservice Structure (Planned)

The system is designed with loose coupling between three main services:

1. **Collector Service** (NestJS Worker)
   - Periodic monitoring via Cron/Streaming
   - Sources: News APIs/RSS (CNN, Fox News, BBC, NHK), Social Media scraping (Truth Social, X/Twitter), Market Data (DJT stock)

2. **Analyzer Service** (AI Engine)
   - LLM integration via TypeScript
   - Generates: 3-line summaries, Sentiment scores (-1.0 to +1.0), Impact levels (S/A/B/C), Bias labels (Left/Right/Center)

3. **Web UI** (Next.js)
   - Live dashboard with timeline feed
   - "Trump Index" graph (aggregate sentiment visualization)
   - Custom alerts by keyword
   - Notification via Web Push API, email, Discord webhook
   - Fact-check maker (side-by-side comparison of opposing coverage)

### Database Schema (Prisma)

Core models:

- **Article**: News/posts with AI-generated metadata (summary, sentiment, bias, impactLevel)
- **Tag**: Keywords for categorization (e.g., "Tariff", "Vance")
- **User**: User accounts for personalized alerts
- **Alert**: User-defined notification rules (keyword + minimum impact level)

### Type Safety

Use tRPC or OpenAPI generation for end-to-end type safety between frontend and backend.

## UI Development Constraints

This project uses `/ui-skills` for opinionated UI standards:

- **Stack:** Tailwind CSS defaults, `motion/react` for animations, `cn` utility for class logic
- **Components:** Use accessible primitives (Base UI preferred, React Aria, Radix). Never mix primitive systems.
- **Interaction:** AlertDialog for destructive actions, `h-dvh` instead of `h-screen`, respect `safe-area-inset`
- **Animation:** Only when requested, compositor props only (`transform`, `opacity`), max 200ms for feedback, respect `prefers-reduced-motion`
- **Typography:** `text-balance` for headings, `text-pretty` for body, `tabular-nums` for data
- **Performance:** No `useEffect` for render logic, no `will-change` outside animations
- **Design:** No gradients/glows unless requested, one accent color per view, use existing Tailwind tokens

See `.claude/skills/ui-skills/SKILL.md` for complete constraints.

## Automated Hooks

After file edits, the system automatically:

1. Runs Prettier formatting
2. Runs ESLint with auto-fix
3. Commits changes with message: `chore: auto-format and lint (TypeScript)`
4. Pushes to current branch

Hook configuration: `.claude/hooks.json`

## Implementation Phases

**Phase 1 (MVP):** NestJS + Playwright news collection, OpenAI basic summarization, Next.js timeline display

**Phase 2 (Analysis):** Sentiment analysis graphs, Truth Social scraping enhancement

**Phase 3 (Alerting):** User registration, Web push notifications, automatic English-to-Japanese translation

## Non-Functional Requirements

- **Performance:** Green Core Web Vitals scores, API responses <200ms
- **Availability:** IP rotation (proxy) and User-Agent management to avoid scraper bans
- **Scalability:** Microservice-ready architecture with service separation

あ
