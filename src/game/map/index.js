// ============================================================
// Map System - Index Export
// ============================================================

// Object definitions
export {
  MAP_OBJECT_TYPES,
  getMapObjectDef,
  createMapObject,
  getCollisionBox,
  getRenderBox,
  getInteractionBox,
  getSortKey,
} from './mapObjects'

// Map data
export {
  SAMPLE_MAP,
  EMPTY_MAP,
  generateRandomMap,
  MAP_REGISTRY,
  getMapById,
} from './mapData'

// Hooks
export { useMap } from './hooks/useMap'
export { useCollision } from './hooks/useCollision'
export { useMapSystem } from './useMapSystem'

// Rendering
export {
  preloadMapSprites,
  renderMapObject,
  createMapRenderer,
  createMapRenderIntegration,
} from './mapRenderer'

// Integration helpers
export {
  updateMovementWithMapCollision,
  processMapObjectAttack,
  renderMapWithPlayer,
  isValidSpawnPosition,
  findValidSpawnPosition,
  hasLineOfSight,
} from './mapIntegration'
