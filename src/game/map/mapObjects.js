/**
 * Map Object Type Definitions
 * Defines all interactive and static objects that can be placed on the map
 */

// Object behavior types
export const OBJECT_BEHAVIOR = {
  BLOCKING: 'blocking',           // Blocks movement completely (walls, big obstacles)
  PASSABLE: 'passable',           // Can walk through (decorations, grass)
  DESTRUCTIBLE: 'destructible',   // Can be destroyed by attacks
  INTERACTIVE: 'interactive',     // Can be interacted with (chests, NPCs)
  HAZARD: 'hazard',              // Damages player on contact
};

// Object layer for rendering order
export const OBJECT_LAYER = {
  GROUND: 0,      // Below everything (floor decorations)
  BASE: 1,        // Ground level objects
  OBJECT: 2,      // Regular objects
  TALL: 3,        // Tall objects (trees, pillars)
  OVERLAY: 4,     // Above everything (ceiling, effects)
};

/**
 * Map Object Type Definitions
 * Each type defines:
 * - id: Unique identifier
 * - name: Display name
 * - behavior: How the object interacts with entities
 * - layer: Rendering layer
 * - collisionBox: { width, height, offsetX, offsetY } - Collision area relative to position
 * - renderBox: { width, height, offsetX, offsetY } - Visual size and offset
 * - interactionBox: { width, height, offsetX, offsetY } - Area for interactions (optional)
 * - sprites: Array of sprite frame names or animation config
 * - blocksProjectiles: Whether projectiles are stopped by this object
 * - hp: Health points for destructible objects
 * - onDestroy: Effect when destroyed
 */
export const MAP_OBJECT_TYPES = {
  // Large tree - tall blocking object
  big_tree: {
    id: 'big_tree',
    name: 'Big Tree',
    behavior: OBJECT_BEHAVIOR.BLOCKING,
    layer: OBJECT_LAYER.TALL,
    collisionBox: { width: 48, height: 32, offsetX: -24, offsetY: -16 },
    renderBox: { width: 128, height: 192, offsetX: -64, offsetY: -176 },
    sprites: ['big_tree'],
    blocksProjectiles: true,
    castsShadow: true,
    occlusionEnabled: true,
  },

  // Old tree - similar to big tree but different appearance
  old_tree: {
    id: 'old_tree',
    name: 'Old Tree',
    behavior: OBJECT_BEHAVIOR.BLOCKING,
    layer: OBJECT_LAYER.TALL,
    collisionBox: { width: 40, height: 24, offsetX: -20, offsetY: -12 },
    renderBox: { width: 112, height: 160, offsetX: -56, offsetY: -144 },
    sprites: ['old_tree'],
    blocksProjectiles: true,
    castsShadow: true,
    occlusionEnabled: true,
  },

  // Stone pillar - tall blocking decorative object
  statue_pillar: {
    id: 'statue_pillar',
    name: 'Stone Pillar',
    behavior: OBJECT_BEHAVIOR.BLOCKING,
    layer: OBJECT_LAYER.TALL,
    collisionBox: { width: 40, height: 32, offsetX: -20, offsetY: -16 },
    renderBox: { width: 64, height: 128, offsetX: -32, offsetY: -112 },
    sprites: ['statue_pillar'],
    blocksProjectiles: true,
    castsShadow: true,
    occlusionEnabled: true,
  },

  // Broken statue - passable decoration
  broken_statue: {
    id: 'broken_statue',
    name: 'Broken Statue',
    behavior: OBJECT_BEHAVIOR.PASSABLE,
    layer: OBJECT_LAYER.BASE,
    collisionBox: null, // No collision
    renderBox: { width: 48, height: 48, offsetX: -24, offsetY: -40 },
    sprites: ['broken_statue'],
    blocksProjectiles: false,
    castsShadow: false,
  },

  // Bush - passable decoration that can hide items
  bush: {
    id: 'bush',
    name: 'Bush',
    behavior: OBJECT_BEHAVIOR.PASSABLE,
    layer: OBJECT_LAYER.OBJECT,
    collisionBox: null,
    renderBox: { width: 56, height: 56, offsetX: -28, offsetY: -48 },
    sprites: ['bush'],
    blocksProjectiles: false,
    castsShadow: false,
    overlapTransparency: true,
  },

  // Statue bust - destructible object
  statue_bust: {
    id: 'statue_bust',
    name: 'Statue Bust',
    behavior: OBJECT_BEHAVIOR.DESTRUCTIBLE,
    layer: OBJECT_LAYER.OBJECT,
    collisionBox: { width: 96, height: 72, offsetX: -48, offsetY: -36 },
    renderBox: { width: 144, height: 192, offsetX: -72, offsetY: -168 },
    interactionBox: { width: 168, height: 168, offsetX: -84, offsetY: -144 },
    sprites: ['statue_bust'],
    blocksProjectiles: true,
    castsShadow: true,
    destructible: true,
    occlusionEnabled: true,
    hp: 300,
    transformsTo: 'broken_statue',
    onDestroy: {
      transformTo: 'broken_statue',
      dropItems: ['xp_orb'],
      effect: 'dust_cloud',
    },
  },
};

/**
 * Get object type definition by ID
 */
export function getObjectType(typeId) {
  return MAP_OBJECT_TYPES[typeId] || null;
}

/**
 * Create a map object instance
 */
export function createMapObject(typeId, x, y, options = {}) {
  const typeDef = getObjectType(typeId);
  if (!typeDef) {
    console.warn(`Unknown map object type: ${typeId}`);
    return null;
  }

  const hp = options.hp ?? typeDef.hp ?? null;

  return {
    id: options.id || `${typeId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: typeId,        // For compatibility with render.js and combat.js
    typeId,              // Keep for consistency
    x,
    y,
    hp: hp,              // combat.js uses obj.hp
    currentHp: hp,
    maxHp: hp,
    isDestroyed: false,
    opacity: 1,
    ...options,
  };
}

/**
 * Check if an object type blocks movement
 */
export function isBlocking(typeId) {
  const type = getObjectType(typeId);
  return type && type.behavior === OBJECT_BEHAVIOR.BLOCKING;
}

/**
 * Check if an object type is destructible
 */
export function isDestructible(typeId) {
  const type = getObjectType(typeId);
  return type && type.behavior === OBJECT_BEHAVIOR.DESTRUCTIBLE;
}

/**
 * Get collision box in world coordinates
 */
export function getWorldCollisionBox(object) {
  const type = getObjectType(object.typeId);
  if (!type || !type.collisionBox) return null;

  const { width, height, offsetX, offsetY } = type.collisionBox;
  return {
    x: object.x + offsetX,
    y: object.y + offsetY,
    width,
    height,
  };
}

/**
 * Get render box in world coordinates
 */
export function getWorldRenderBox(object) {
  const type = getObjectType(object.typeId);
  if (!type || !type.renderBox) return null;

  const { width, height, offsetX, offsetY } = type.renderBox;
  return {
    x: object.x + offsetX,
    y: object.y + offsetY,
    width,
    height,
  };
}

/**
 * Get interaction box in world coordinates
 */
export function getWorldInteractionBox(object) {
  const type = getObjectType(object.typeId);
  if (!type) return null;

  // Use interaction box if defined, otherwise fall back to collision box
  const box = type.interactionBox || type.collisionBox;
  if (!box) return null;

  const { width, height, offsetX, offsetY } = box;
  return {
    x: object.x + offsetX,
    y: object.y + offsetY,
    width,
    height,
  };
}

// Alias exports for backward compatibility with combat.js
export const getMapObjectDef = (typeId) => getObjectType(typeId);
export const getInteractionBox = (object) => {
  // combat.js uses object.type instead of object.typeId
  const typeId = object.typeId || object.type;
  const type = getObjectType(typeId);
  if (!type) return null;

  const box = type.interactionBox || type.collisionBox;
  if (!box) return null;

  return {
    x: object.x + box.offsetX,
    y: object.y + box.offsetY,
    width: box.width,
    height: box.height,
  };
};

// Alias exports for backward compatibility with render.js
export const getRenderBox = (object) => {
  const typeId = object.typeId || object.type;
  const type = getObjectType(typeId);
  if (!type || !type.renderBox) return null;

  const { width, height, offsetX, offsetY } = type.renderBox;
  return {
    x: object.x + offsetX,
    y: object.y + offsetY,
    width,
    height,
  };
};

export const getCollisionBox = (object) => {
  const typeId = object.typeId || object.type;
  const type = getObjectType(typeId);
  if (!type || !type.collisionBox) return null;

  const { width, height, offsetX, offsetY } = type.collisionBox;
  return {
    x: object.x + offsetX,
    y: object.y + offsetY,
    width,
    height,
  };
};

