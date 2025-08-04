# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Seven Poker is a Next.js-based online poker game application with Korean UI/UX. It features a lobby system for creating and joining game rooms, plus a real-time poker game interface with AI players and human players.

## Architecture
- **Framework**: Next.js 14.2.16 with App Router (`app/` directory structure)
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Language**: TypeScript with strict mode enabled
- **Package Manager**: pnpm (uses `pnpm-lock.yaml`)
- **Animation**: Framer Motion for game animations and card dealing effects

## Key Components Structure
- `app/page.tsx` - Main lobby page with room listing and creation
- `app/room/[id]/page.tsx` - Individual poker game room with full game interface
- `components/ui/` - shadcn/ui component library (buttons, cards, dialogs, etc.)
- `components/theme-provider.tsx` - Theme management for dark/light modes
- `lib/utils.ts` - Utility functions (likely contains cn() for class merging)

## Development Commands
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run Next.js linting
```

## Game Logic Architecture
The poker game uses a complex state management system:
- **Players**: Array of player objects with cards, chips, bets, and AI status
- **Game Phases**: "betting", "dealing", "waiting" states
- **Card System**: 7-card stud poker variant with progressive card revealing
- **Position System**: Dynamic player positioning around a virtual table (supports 2-8 players)
- **Animation System**: Framer Motion for card dealing, betting actions, and UI transitions

## Key Features
- Multi-player poker rooms with AI opponents
- Progressive card dealing with animations
- Dynamic table layouts for different player counts
- Real-time betting system with fold/check/call/raise actions
- Korean localization throughout the interface
- Popup window system for game rooms (opens in new windows)

## UI Component Pattern
Uses shadcn/ui extensively with Tailwind CSS. Components follow the shadcn pattern with:
- Variant-based styling using class-variance-authority
- Consistent use of `cn()` utility for conditional classes
- Dark theme support via CSS variables
- Consistent spacing and color schemes

## Configuration Notes
- TypeScript errors and ESLint errors are ignored during builds (`ignoreBuildErrors: true`, `ignoreDuringBuilds: true`)
- Images are unoptimized (`unoptimized: true`)
- Uses `@/*` path mapping for imports
- Tailwind configured with custom color variables and animations