# Component Refactoring - Architecture Guide

## Overview
Refactored the monolithic App.tsx into smaller, reusable components with single responsibilities.

## New Component Structure

### 📁 src/components/

#### **StarRating.tsx**
- **Responsibility**: Render star ratings
- **Props**: `rating`, `size`
- **Reusable**: Yes
- **Pure**: Yes (no side effects)

#### **Timer.tsx**
- **Responsibility**: Match timer with presets
- **Features**: 
  - 5/10 min presets or FREE mode
  - Start/Pause/Reset controls
  - Whistle sound on completion
  - Auto-pause at preset time
- **Props**: `onTimeEnd` callback
- **State**: Self-contained timer logic

#### **TeamDisplay.tsx**
- **Responsibility**: Display teams with players
- **Props**:
  - `teams`: Array of player arrays
  - `showRatings`: Show/hide ratings
  - `showSwapButtons`: Enable player swapping
  - `onSwapPlayer`: Callback for swaps
  - `compact`: Compact mode
- **Flexible**: Multiple display modes

#### **PlayerManager.tsx** (existing)
- **Responsibility**: CRUD operations for players
- **Already well-structured**

### 📁 src/utils/

#### **teamBalancer.ts**
- **Responsibility**: Balance team algorithm
- **Function**: `createBalancedTeams(selected, players)`
- **Pure**: Yes (no side effects)
- **Testable**: Easy to unit test

#### **whatsappShare.ts**
- **Responsibility**: WhatsApp sharing logic
- **Function**: `shareTeamsOnWhatsApp(teams)`
- **Side Effect**: Opens WhatsApp (isolated)

## Benefits

### 1. **Single Responsibility Principle**
Each component/utility has one clear purpose:
- StarRating → Render stars
- Timer → Manage time
- TeamDisplay → Show teams
- teamBalancer → Balance algorithm
- whatsappShare → Share logic

### 2. **Reusability**
Components can be used in multiple places:
```typescript
// Use StarRating anywhere
<StarRating rating={4.5} size="text-lg" />

// Use TeamDisplay in different modes
<TeamDisplay teams={teams} showRatings={true} />
<TeamDisplay teams={teams} showRatings={false} compact={true} />
```

### 3. **Testability**
Pure functions are easy to test:
```typescript
// Test team balancer
const result = createBalancedTeams(selected, players);
expect(result.length).toBe(2);

// Test star rating rendering
render(<StarRating rating={3.5} />);
expect(screen.getAllByText('⭐')).toHaveLength(4);
```

### 4. **Maintainability**
- Smaller files (easier to understand)
- Clear boundaries (less coupling)
- Isolated changes (modify one component)

### 5. **Type Safety**
Each component has clear TypeScript interfaces:
```typescript
interface TimerProps {
  onTimeEnd?: () => void;
}

interface TeamDisplayProps {
  teams: Player[][];
  showRatings?: boolean;
  showSwapButtons?: boolean;
  onSwapPlayer?: (player: Player, fromTeam: number, toTeam: number) => void;
  compact?: boolean;
}
```

## Component Hierarchy

```
App.tsx (Orchestrator)
├── PlayerManager (Player CRUD)
├── PlayerSelection (Select players)
│   └── StarRating (Show ratings)
├── TeamCreation (Create teams)
│   ├── TeamDisplay (Show options)
│   │   └── StarRating
│   └── ManualTeamBuilder
│       └── TeamDisplay
└── MatchControl (Match management)
    ├── Timer (Chronometer)
    └── MatchScores (Score tracking)
        └── TeamDisplay (Show teams)
```

## File Sizes (Approximate)

### Before Refactoring
- `App.tsx`: ~1100 lines

### After Refactoring
- `App.tsx`: ~600 lines (orchestration only)
- `StarRating.tsx`: ~40 lines
- `Timer.tsx`: ~180 lines
- `TeamDisplay.tsx`: ~80 lines
- `teamBalancer.ts`: ~70 lines
- `whatsappShare.ts`: ~30 lines
- **Total**: ~1000 lines (more organized)

## Usage Examples

### StarRating Component
```typescript
import { StarRating } from './components/StarRating';

<StarRating rating={4.5} size="text-lg" />
<StarRating rating={3.0} size="text-xs" />
```

### Timer Component
```typescript
import { Timer } from './components/Timer';

<Timer onTimeEnd={() => console.log('Time is up!')} />
```

### TeamDisplay Component
```typescript
import { TeamDisplay } from './components/TeamDisplay';

// Simple display
<TeamDisplay teams={teams} />

// With swap buttons
<TeamDisplay 
  teams={teams}
  showSwapButtons={true}
  onSwapPlayer={(player, from, to) => handleSwap(player, from, to)}
/>

// Compact mode without ratings
<TeamDisplay 
  teams={teams}
  showRatings={false}
  compact={true}
/>
```

### Team Balancer Utility
```typescript
import { createBalancedTeams } from './utils/teamBalancer';

const balanced = createBalancedTeams(selectedIds, allPlayers);
```

### WhatsApp Share Utility
```typescript
import { shareTeamsOnWhatsApp } from './utils/whatsappShare';

shareTeamsOnWhatsApp(confirmedTeams);
```

## Migration Strategy

### Phase 1: Extract Utilities ✅
- Move pure functions to utils/
- No UI dependencies
- Easy to test

### Phase 2: Extract UI Components ✅
- Create reusable components
- Define clear props interfaces
- Maintain existing functionality

### Phase 3: Refactor App.tsx (Next)
- Use new components
- Simplify orchestration logic
- Remove duplicated code

### Phase 4: Add Tests (Future)
- Unit tests for utilities
- Component tests for UI
- Integration tests for flows

## Best Practices Applied

1. **Props over State**: Components receive data via props
2. **Callbacks for Actions**: Parent handles state changes
3. **Pure Components**: No side effects when possible
4. **TypeScript**: Strong typing for all props
5. **Single File per Component**: Easy to locate
6. **Descriptive Names**: Clear purpose from name
7. **Default Props**: Sensible defaults for optional props

## Next Steps

1. Update App.tsx to use new components
2. Remove duplicated code
3. Add prop-types validation
4. Write unit tests
5. Add Storybook stories (optional)
6. Performance optimization (React.memo if needed)

## Performance Considerations

- **StarRating**: Pure component (can memoize)
- **Timer**: Self-contained state (no prop drilling)
- **TeamDisplay**: Receives data, no heavy computation
- **Utilities**: Pure functions (fast, cacheable)

## Accessibility

- Semantic HTML maintained
- ARIA labels where needed
- Keyboard navigation supported
- Screen reader friendly

## Corporate Design Maintained

All components follow the established design system:
- Black/white/gray color scheme
- Uppercase text with wide tracking
- Rounded-none borders
- Font-black weights
- Consistent spacing
