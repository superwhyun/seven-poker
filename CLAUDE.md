# Seven Poker Game - Claude Documentation

## Project Overview
This is a Seven Stud Poker game built with Next.js 15.4.4, React 18, and TypeScript. The game features intelligent AI opponents, immersive audio-visual feedback, and complete Seven Stud poker mechanics.

## Tech Stack
- **Framework**: Next.js 15.4.4 with App Router
- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Animations**: Framer Motion
- **Audio**: Web Speech API, Web Audio API

## Project Structure
```
/Users/whyun/workspace/seven-poker-game/
├── app/
│   ├── page.tsx              # Home page with room browser
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles and theme
│   └── room/[id]/page.tsx    # Main game room component
├── components/ui/            # Reusable UI components (Radix)
├── package.json              # Dependencies and scripts
├── PRD.md                    # Product Requirements Document
├── CLAUDE.md                 # This documentation file
└── [other config files]
```

## Key Features Implemented

### 1. Seven Stud Poker Mechanics
- Complete 7-step game progression (ante → 3rd-7th street → showdown)
- Proper card distribution (2 hidden + 1 open initially, progressive dealing)
- Full betting system (ante, call, raise, check, fold)
- Hand evaluation with standard poker rankings

### 2. AI System
- **Three AI Personalities**: Conservative, Aggressive, Balanced
- **Strategic Decision Making**: Hand strength evaluation, pot odds calculation, step-based strategy
- **Realistic Behavior**: Personality-based modifiers, logical betting patterns

### 3. Audio-Visual Experience
- **Action Sounds**: Web Speech API for voice announcements
- **Victory Music**: Orchestral fanfare generated with Web Audio API
- **Visual Effects**: Framer Motion animations, confetti celebrations
- **UI Polish**: Smooth transitions, turn indicators, result overlays

### 4. Game State Management
- Complex player object management with open/hidden cards
- Turn-based gameplay with proper fold handling
- Real-time chip and betting tracking
- Robust game flow control

## Core Components

### Main Game Component (`app/room/[id]/page.tsx`)
- **File Size**: ~2000+ lines
- **Key Interfaces**:
  ```typescript
  interface Player {
    id: string
    name: string
    isAI: boolean
    cards: PlayingCard[]
    openCards: PlayingCard[]    // 공개 카드덱
    hiddenCards: PlayingCard[]  // 히든 카드덱
    chips: number
    position: number
    currentBet: number
    lastAction: "fold" | "check" | "call" | "raise" | "waiting" | null
    roundAction: "fold" | "check" | "call" | "raise" | null
    aiPersonality?: "conservative" | "aggressive" | "balanced"
  }
  ```

### Key Functions
- **`getAIAction()`**: Sophisticated AI decision-making with hand evaluation
- **`evaluateHand()`**: Complete poker hand ranking system
- **`playVictoryMusic()`**: Multi-layered audio synthesis
- **`processAITurn()`**: Turn management with proper timing
- **`checkAllPlayersReady()`**: Game flow control and round transitions

## Development History

### Phase 1: Core Gameplay
- Implemented basic Seven Stud poker rules
- Created player management system
- Added card dealing and betting mechanics

### Phase 2: AI Enhancement
- Upgraded from random to strategic AI decisions
- Added personality-based AI behavior
- Implemented hand evaluation algorithms

### Phase 3: Audio-Visual Polish
- Added Web Speech API for action announcements
- Created victory music with Web Audio API
- Implemented smooth animations and transitions

### Phase 4: Bug Fixes & Optimization
- Fixed game hanging when user folds early
- Optimized card selection responsiveness
- Balanced AI strategy to prevent mass early folding

## Known Issues & Solutions

### Issue: Card Selection Delay
- **Problem**: "카드 선택 반응이 느려" - Card selection taking several seconds
- **Solution**: Removed setTimeout delays, made selectCard() execute immediately

### Issue: AI Too Conservative
- **Problem**: "좆까고 있네. 여전히 안됨" - AI folding too much early game
- **Solution**: Adjusted aggression levels, added early-stage participation logic

### Issue: Game Hanging After Fold
- **Problem**: Game freezing when user folded and only 1 AI remained
- **Solution**: Modified checkAllPlayersReady() to handle activePlayers.length === 1

### Issue: Simple Victory Music
- **Problem**: "음악이 그렇게 밖에 안되나? 빵빠레를 울려줘야지"
- **Solution**: Enhanced to full orchestral fanfare with melody, harmony, drums

## Testing & Quality Assurance

### Manual Testing Scenarios
1. **Full Game Flow**: Complete 7-step poker game with 4 players
2. **AI Behavior**: Verify different AI personalities make logical decisions
3. **Edge Cases**: User folding early, all AI folding, single player remaining
4. **Audio**: Test all voice announcements and victory music
5. **Visual**: Verify animations, turn indicators, result displays

### Performance Considerations
- Efficient React re-renders during game state updates
- Smooth 60fps animations with Framer Motion
- Memory management for audio context creation

## Development Commands

### Standard Next.js Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint checking
```

### Development Workflow
1. Use `npm run dev` to start development server
2. Game runs at `http://localhost:3000`
3. Main game accessible at `/room/[any-id]`
4. Use browser dev tools for audio debugging

## Architecture Decisions

### Why Client-Side State Management?
- Single-player game with AI opponents
- No need for server synchronization
- Simplifies deployment and hosting

### Why Web Audio API for Victory Music?
- Dynamic audio generation without audio files
- Customizable orchestral arrangements
- Better performance than loading multiple audio assets

### Why Framer Motion?
- Smooth card animations
- Easy spring physics for natural movement
- Good React integration and performance

## Future Enhancements

### Immediate Opportunities
- Add more poker variants (Texas Hold'em, Omaha)
- Implement tournament modes
- Add player statistics tracking

### Technical Improvements
- Server-side multiplayer support
- Advanced AI using machine learning
- Mobile responsive optimizations
- Progressive Web App features

## Code Patterns & Conventions

### State Management Pattern
```typescript
const [gameState, setGameState] = useState<GameState>({
  currentStep: 1,
  players: initialPlayers,
  pot: 0,
  currentPlayerIndex: 0
})
```

### AI Decision Pattern
```typescript
const getAIAction = (player: Player, currentBet: number, pot: number) => {
  const handEvaluation = evaluateAIHandStrength(player)
  const strategy = getStepStrategy(gameStep)
  const personalityMod = getPersonalityModifier(player.aiPersonality)
  
  // Decision logic based on hand strength, pot odds, strategy
  return decision
}
```

### Animation Pattern
```typescript
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring" }}
>
  {content}
</motion.div>
```

## Deployment Notes

### Build Requirements
- Node.js 18+ required
- All dependencies are specified in package.json
- No external database required (client-side game)

### Environment Setup
- No environment variables needed
- Works entirely in browser
- No API keys or external services required

This documentation serves as a comprehensive guide for understanding, maintaining, and extending the Seven Poker Game codebase.