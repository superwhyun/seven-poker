# Seven Poker Game 🃏

A sophisticated Seven Stud Poker game built with Next.js, featuring intelligent AI opponents and immersive audio-visual feedback.

![Seven Poker Game](https://img.shields.io/badge/Status-Complete-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.4.4-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🎯 Features

### 🎮 Complete Seven Stud Poker
- **7-Step Game Progression**: Ante → 3rd Street → 4th-6th Street → 7th Street → Showdown
- **Authentic Card Dealing**: 2 hidden + 1 open cards initially, progressive revelation
- **Full Betting System**: Ante, Call, Check, Raise, Fold with proper pot management
- **Standard Hand Rankings**: Complete poker hand evaluation system

### 🤖 Intelligent AI Opponents
- **Three AI Personalities**:
  - **Conservative**: Defensive play, lower risk tolerance
  - **Aggressive**: Higher betting frequency, strategic bluffs
  - **Balanced**: Mixed strategy approach
- **Strategic Decision Making**: Hand evaluation, pot odds calculation, step-based strategy
- **Realistic Behavior**: Personality-based modifiers for authentic poker experience

### 🎵 Immersive Audio Experience
- **Action Sound Effects**: Voice announcements for all player actions
- **Victory Music**: Orchestral fanfare generated with Web Audio API
- **Game Flow Audio**: Countdown sounds and transition effects
- **Multi-layered Composition**: Melody, harmony, and drum tracks

### ✨ Polished Visual Experience
- **Smooth Animations**: Framer Motion for card dealing and UI transitions
- **Professional UI**: Clean, responsive design with dark theme
- **Turn Indicators**: Clear visual feedback for game flow
- **Victory Celebrations**: Confetti effects and animated overlays

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd seven-poker-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server  
npm run lint     # Run ESLint
```

## 🎲 How to Play

### Getting Started
1. **Join a Game**: Click "빠른 시작" (Quick Start) or create a new room
2. **Game Opens**: New window opens with the poker table
3. **Start Playing**: Game begins automatically with 1 human + 3 AI players

### Game Flow
1. **Ante Phase**: All players contribute ante to start the pot
2. **3rd Street**: Receive 2 hidden cards + 1 open card, betting round begins
3. **4th-6th Street**: Progressive open card dealing with betting after each
4. **7th Street**: Final hidden card dealt, final betting round
5. **Showdown**: Best 5-card hand wins the pot

### Controls
- **Call**: Match the current bet
- **Check**: Pass if no bet to call
- **Raise**: Increase the current bet
- **Fold**: Forfeit hand and exit round

## 🏗️ Technical Architecture

### Tech Stack
- **Framework**: Next.js 15.4.4 with App Router
- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Animations**: Framer Motion
- **Audio**: Web Speech API, Web Audio API

### Project Structure
```
seven-poker-game/
├── app/
│   ├── page.tsx              # Home page with room browser
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── room/[id]/page.tsx    # Main game component
├── components/ui/            # Reusable UI components
├── package.json              # Dependencies
├── PRD.md                    # Product Requirements
├── CLAUDE.md                 # Technical documentation
├── planning.md               # Development planning
├── tasks.md                  # Task tracking
└── README.md                 # This file
```

### Key Components

#### Main Game Component (`app/room/[id]/page.tsx`)
- **~2000+ lines**: Complete poker game implementation  
- **Player Management**: Complex state management for 4 players
- **AI Decision Engine**: Sophisticated strategy algorithms
- **Audio System**: Web Audio API for dynamic music generation
- **Animation Control**: Framer Motion integration

#### Home Page (`app/page.tsx`)
- **Room Browser**: Mock game rooms with join functionality
- **Room Creation**: Dialog for creating new games
- **Responsive Design**: Mobile-friendly interface

## 🎯 Game Features Deep Dive

### AI Strategy System
The AI opponents use sophisticated decision-making algorithms:

```typescript
interface Player {
  id: string
  name: string
  isAI: boolean
  cards: PlayingCard[]
  openCards: PlayingCard[]    // Visible cards
  hiddenCards: PlayingCard[]  // Hidden cards
  chips: number
  currentBet: number
  aiPersonality?: "conservative" | "aggressive" | "balanced"
}
```

#### AI Decision Process:
1. **Hand Evaluation**: Calculate current hand strength (0-1 scale)
2. **Pot Odds Analysis**: Determine mathematical profitability
3. **Step Strategy**: Adjust aggression based on game progression
4. **Personality Modifier**: Apply personality-based adjustments
5. **Final Decision**: Choose optimal action (fold/check/call/raise)

### Audio System Architecture
- **Web Speech API**: Immediate voice feedback for actions
- **Web Audio API**: Dynamic orchestral music generation
- **Multi-layer Composition**: 
  - 16-note fanfare melody (sawtooth waves)
  - 6-note harmony progression (triangle waves)  
  - 7-beat drum pattern (square waves)

### Animation System
- **Spring Physics**: Natural card movement with Framer Motion
- **Staggered Animations**: Progressive card dealing effects
- **State Transitions**: Smooth UI changes between game phases
- **Performance Optimized**: 60fps target with efficient re-renders

## 🐛 Known Issues & Solutions

All major issues have been resolved:

✅ **Card Selection Delay** - Fixed slow response times  
✅ **AI Over-Conservative** - Balanced AI strategy for engaging gameplay  
✅ **Game Hanging** - Resolved freeze scenarios  
✅ **Turn Display Timing** - Proper sequence of turn indicators and actions  
✅ **Victory Music Quality** - Enhanced to full orchestral fanfare  

## 📱 Browser Compatibility

- ✅ **Chrome 90+**: Full support
- ✅ **Firefox 88+**: Full support  
- ✅ **Safari 14.1+**: Full support
- ✅ **Edge 90+**: Full support

**Requirements**:
- Modern browser with Web Audio API support
- JavaScript enabled
- Audio playback capability

## 🚀 Deployment

### Build Process
```bash
npm run build    # Creates optimized production build
npm run start    # Serves production build
```

### Deployment Options
- **Vercel**: Recommended for Next.js apps
- **Netlify**: Static site deployment
- **Self-hosted**: Node.js server required

### Environment Requirements
- No environment variables needed
- No external API dependencies
- Client-side only (no database required)

## 🔮 Future Enhancements

### Immediate Opportunities
- **Mobile Optimization**: Touch-friendly controls
- **Additional Variants**: Texas Hold'em, Omaha
- **Tournament Mode**: Bracket-style competitions
- **Statistics Tracking**: Win/loss history

### Advanced Features  
- **Multiplayer Networking**: Real-time online play
- **Advanced AI**: Machine learning integration
- **Social Features**: Friend lists, leaderboards
- **PWA Support**: Offline capabilities

## 📄 Documentation

- **[PRD.md](PRD.md)**: Product Requirements Document
- **[CLAUDE.md](CLAUDE.md)**: Technical documentation for Claude
- **[planning.md](planning.md)**: Development planning and phases
- **[tasks.md](tasks.md)**: Detailed task tracking and history

## 🤝 Contributing

This project is complete but open to enhancements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📜 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Next.js Team**: For the excellent React framework
- **Radix UI**: For accessible UI components  
- **Framer Motion**: For smooth animations
- **Web Audio API**: For dynamic music generation
- **User Feedback**: Critical input that shaped the final product

---

**Seven Poker Game** - A premium poker experience with intelligent AI opponents and immersive audio-visual feedback. Built with modern web technologies for optimal performance and user experience.

🎯 **Ready to Play?** Run `npm run dev` and visit `http://localhost:3000`