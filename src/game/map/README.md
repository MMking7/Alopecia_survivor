# Map System Integration Guide

This document explains how to integrate the map system with the existing game engine.

## Architecture Overview

```
src/game/map/
├── index.js              # Main exports
├── mapObjects.js         # Object type definitions
├── mapData.js            # Map data schemas & samples
├── mapRenderer.js        # Canvas rendering utilities
├── useMapSystem.js       # Combined integration hook
└── hooks/
    ├── useMap.js         # Map state management
    └── useCollision.js   # Collision detection
```

## Quick Start

### 1. Basic Setup

```jsx
import { useMapSystem, SAMPLE_MAP } from '../game/map'

const GameComponent = () => {
  const mapSystem = useMapSystem({
    mapData: SAMPLE_MAP,
    autoInitialize: true,
    debugMode: false,
  })

  // Wait for sprites to load
  if (!mapSystem.isLoaded) {
    return <div>Loading map...</div>
  }

  // Use mapSystem in your game loop
}
```

### 2. Movement with Collision

```javascript
// In your game update loop
const updatePlayerMovement = (state, deltaTime) => {
  const moveSpeed = state.stats.moveSpeed * GAME_CONFIG.PLAYER_SPEED * deltaTime
  
  let targetX = state.player.x
  let targetY = state.player.y

  if (state.keys.w) targetY -= moveSpeed
  if (state.keys.s) targetY += moveSpeed
  if (state.keys.a) targetX -= moveSpeed
  if (state.keys.d) targetX += moveSpeed

  // Check collision with map objects
  const result = mapSystem.processMovement(
    state.player.x, state.player.y,
    targetX, targetY,
    64 // player size
  )

  state.player.x = result.x
  state.player.y = result.y
}
```

### 3. Rendering with Y-Sorting

```javascript
// In your render function
const renderFrame = ({ state, ctx, canvas, mapSystem }) => {
  // Update transparency based on player position
  mapSystem.updateTransparencies(state.player.x, state.player.y, 64)

  // Get frame renderer
  const mapRenderer = mapSystem.createFrameRenderer(ctx, state.camera)

  // Draw background first
  drawBackground(ctx, state.camera)

  // Draw map objects BEHIND the player
  mapRenderer.renderBehindPlayer(state.player.y)

  // Draw enemies, projectiles, etc. (also Y-sorted)
  drawEnemies(ctx, state)

  // Draw player
  drawPlayer(ctx, state)

  // Draw map objects IN FRONT of the player
  mapRenderer.renderInFrontOfPlayer(state.player.y)

  // Draw UI elements on top
  drawUI(ctx, state)
}
```

### 4. Attack Collision with Destructibles

```javascript
// When player attacks
const handleAttack = (state, attackBox, damage) => {
  // Check against enemies (existing logic)
  // ...

  // Check against destructible map objects
  const mapHits = mapSystem.processAttack(attackBox, damage)
  
  mapHits.forEach(({ object, destroyed, remainingHp }) => {
    if (destroyed) {
      // Object was destroyed (e.g., statue_bust -> broken_statue)
      // Create visual effect, play sound, etc.
      state.attackEffects.push({
        type: 'aoe',
        x: object.x,
        y: object.y,
        maxRadius: 50,
        color: 'rgba(255, 200, 100, 0.5)',
        createdAt: performance.now(),
        duration: 300,
      })
    }
  })
}

// For AoE attacks
const handleAoeAttack = (centerX, centerY, radius, damage) => {
  const mapHits = mapSystem.processAttack(
    { x: centerX, y: centerY, radius },
    damage,
    true // isCircular
  )
  // Process hits...
}
```

## Object Types

### Tall Obstacles (`TALL_OBSTACLE`)
- **IDs**: `big_tree`, `old_tree`, `statue_pillar`, `broken_statue`
- **Behavior**: 
  - Blocks movement at base only
  - Becomes semi-transparent when player is behind (Y < object Y)
  - Player can visually walk behind the upper portion

### Passable Decoration (`PASSABLE_DECORATION`)
- **ID**: `bush`
- **Behavior**:
  - Does not block movement
  - Becomes semi-transparent when player overlaps

### Destructible Obstacle (`DESTRUCTIBLE_OBSTACLE`)
- **ID**: `statue_bust`
- **Behavior**:
  - Blocks movement at base (like tall obstacles)
  - Has HP that decreases when attacked
  - Transforms into `broken_statue` when HP reaches 0

## Custom Maps

### Creating a Map Data Object

```javascript
const myCustomMap = {
  id: 'custom_dungeon',
  name: 'Dark Dungeon',
  width: 3000,
  height: 3000,
  background: '/sprites/dungeon_floor.png',
  objects: [
    { type: 'statue_pillar', x: 500, y: 500 },
    { type: 'statue_bust', x: 800, y: 600, hp: 100 },
    { type: 'bush', x: 300, y: 400 },
    // ... more objects
  ],
}

// Use with the hook
const mapSystem = useMapSystem({ mapData: myCustomMap })
```

### Generating Random Maps

```javascript
import { generateRandomMap } from '../game/map'

const randomMap = generateRandomMap({
  width: 2048,
  height: 2048,
  treeCount: 15,
  bushCount: 20,
  statueCount: 8,
  bustCount: 5,
  minSpacing: 120,
  safeZone: { x: 1024, y: 768, radius: 200 }, // Player spawn area
})
```

## Integration with Existing Game Engine

### Modify `createInitialState.js`

```javascript
// Add map state to initial game state
export const createInitialState = ({ selectedCharacter, ... }) => {
  return {
    // ... existing state
    
    // Add map reference
    mapData: null,       // Will be set by useMapSystem
    mapObjects: [],      // Runtime object state
  }
}
```

### Modify `useGameLoop.js`

```javascript
import { createMapRenderer } from '../../map'

export const useGameLoop = ({ mapSystem, ...props }) => {
  useEffect(() => {
    const gameLoop = (currentTime) => {
      // ... existing update logic

      // Update map transparencies
      if (mapSystem?.isLoaded) {
        mapSystem.updateTransparencies(
          state.player.x,
          state.player.y,
          64
        )
      }

      // Modify movement to check collisions
      // (integrate with updateMovementAndCamera)

      // Render with Y-sorting
      renderFrameWithMap({ state, ctx, canvas, currentTime, loadedImages, mapSystem })
    }
  }, [gamePhase, loadedImages, mapSystem])
}
```

### Modify `render.js`

Add map rendering at appropriate points in the render pipeline:

```javascript
export const renderFrame = ({ state, ctx, canvas, currentTime, loadedImages, mapSystem }) => {
  // Draw background
  // ...

  // Draw ground-level effects (coins, XP orbs, etc.)
  // ...

  if (mapSystem?.isLoaded) {
    const mapRenderer = mapSystem.createFrameRenderer(ctx, state.camera)
    
    // Render objects behind player
    mapRenderer.renderBehindPlayer(state.player.y)
  }

  // Draw enemies (Y-sorted)
  // Draw player
  // ...

  if (mapSystem?.isLoaded) {
    const mapRenderer = mapSystem.createFrameRenderer(ctx, state.camera)
    
    // Render objects in front of player
    mapRenderer.renderInFrontOfPlayer(state.player.y)
  }

  // Draw projectiles, effects, UI
  // ...
}
```

## Debug Mode

Enable debug visualization:

```javascript
const mapSystem = useMapSystem({
  mapData: SAMPLE_MAP,
  debugMode: true, // Show collision/render boxes
})

// Or toggle at runtime
mapSystem.setDebugOptions({
  showCollisionBoxes: true,
  showRenderBoxes: true,
})
```

## API Reference

### useMapSystem Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mapData` | object | SAMPLE_MAP | Map definition to load |
| `autoInitialize` | boolean | true | Initialize on mount |
| `debugMode` | boolean | false | Show debug visuals |

### useMapSystem Returns
| Property | Type | Description |
|----------|------|-------------|
| `isLoaded` | boolean | Whether sprites are loaded |
| `mapInfo` | object | Map metadata (id, name, size) |
| `processMovement` | function | Check & resolve movement collision |
| `processAttack` | function | Attack destructible objects |
| `updateTransparencies` | function | Update occlusion alphas |
| `createFrameRenderer` | function | Get Y-sorted renderer |
| `getAllObjects` | function | Get all map objects |
| `addObject` | function | Add object at runtime |
| `removeObject` | function | Remove object by ID |
