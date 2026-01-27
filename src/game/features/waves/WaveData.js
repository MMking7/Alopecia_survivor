/**
 * Wave Data Configuration
 * Defines the 10-minute wave schedule for enemy spawns
 */

// Pattern Types
export const WAVE_PATTERNS = {
    CLUSTER: 'cluster',     // Small group near player
    STAMPEDE: 'stampede',   // Line from one edge
    CIRCLE: 'circle',       // Ring around player
    HORDE: 'horde',         // Large volume rush
}

// Enemy type mapping (matches constants.js ENEMIES)
export const ENEMY_TYPES = {
    ZOMBIE: 'zombie',
    SMOKE: 'cigarette',     // "Smoke" = cigarette enemy
    CIGARETTE: 'cigarette', // Strong variant (same sprite, higher stats handled in wave)
    CLIPPER: 'clipper',
    DNA: 'dna',
    SHIELD: 'shield_guy',
    SOJU: 'soju',
}

/**
 * Wave Timeline
 * Each entry defines when and how enemies spawn
 * 
 * time: seconds from game start
 * enemyType: key from ENEMY_TYPES
 * pattern: key from WAVE_PATTERNS
 * count: number of enemies to spawn
 * direction: for STAMPEDE, which edge ('left', 'right', 'top', 'bottom', 'random')
 * healthMultiplier: optional, default 1.0
 * speedMultiplier: optional, default 1.0
 */
export const WAVE_TIMELINE = [
    // ============================================
    // Minute 0-2: Introduction Phase
    // ============================================
    { time: 15, enemyType: ENEMY_TYPES.SMOKE, pattern: WAVE_PATTERNS.CLUSTER, count: 6 },
    // Pincer attack: Left + Right
    { time: 45, enemyType: ENEMY_TYPES.ZOMBIE, pattern: WAVE_PATTERNS.STAMPEDE, count: 8, direction: 'right' },
    { time: 45, enemyType: ENEMY_TYPES.ZOMBIE, pattern: WAVE_PATTERNS.STAMPEDE, count: 8, direction: 'left' },
    { time: 60, enemyType: ENEMY_TYPES.SHIELD, pattern: WAVE_PATTERNS.STAMPEDE, count: 10, direction: 'left' },
    { time: 90, enemyType: ENEMY_TYPES.ZOMBIE, pattern: WAVE_PATTERNS.CIRCLE, count: 10 },
    // 2:00 - Boss handled by existing BOSSES array

    // ============================================
    // Minute 2-5: Mid Game Buildup
    // ============================================
    // Pincer attack: Top + Bottom
    { time: 140, enemyType: ENEMY_TYPES.CLIPPER, pattern: WAVE_PATTERNS.STAMPEDE, count: 8, direction: 'bottom' },
    { time: 140, enemyType: ENEMY_TYPES.CLIPPER, pattern: WAVE_PATTERNS.STAMPEDE, count: 8, direction: 'top' },
    { time: 165, enemyType: ENEMY_TYPES.SMOKE, pattern: WAVE_PATTERNS.HORDE, count: 20 },
    { time: 195, enemyType: ENEMY_TYPES.CIGARETTE, pattern: WAVE_PATTERNS.STAMPEDE, count: 6, direction: 'top', healthMultiplier: 1.3 },
    { time: 225, enemyType: ENEMY_TYPES.ZOMBIE, pattern: WAVE_PATTERNS.CIRCLE, count: 12 },
    { time: 255, enemyType: ENEMY_TYPES.CLIPPER, pattern: WAVE_PATTERNS.HORDE, count: 18 },
    // Pincer attack: Left + Right
    { time: 285, enemyType: ENEMY_TYPES.DNA, pattern: WAVE_PATTERNS.STAMPEDE, count: 7, direction: 'right' },
    { time: 285, enemyType: ENEMY_TYPES.DNA, pattern: WAVE_PATTERNS.STAMPEDE, count: 7, direction: 'left' },
    // 5:00 - Boss handled by existing BOSSES array

    // ============================================
    // Minute 5-10: High Intensity & Climax
    // ============================================
    // BIG Pincer: Shield wall from both sides
    { time: 320, enemyType: ENEMY_TYPES.SHIELD, pattern: WAVE_PATTERNS.STAMPEDE, count: 20, direction: 'left' },
    { time: 320, enemyType: ENEMY_TYPES.SHIELD, pattern: WAVE_PATTERNS.STAMPEDE, count: 20, direction: 'right' },
    { time: 350, enemyType: ENEMY_TYPES.ZOMBIE, pattern: WAVE_PATTERNS.HORDE, count: 30 },
    { time: 390, enemyType: ENEMY_TYPES.DNA, pattern: WAVE_PATTERNS.CIRCLE, count: 10 },
    // Pincer attack: Top + Bottom
    { time: 420, enemyType: ENEMY_TYPES.CLIPPER, pattern: WAVE_PATTERNS.STAMPEDE, count: 12, direction: 'bottom' },
    { time: 420, enemyType: ENEMY_TYPES.CLIPPER, pattern: WAVE_PATTERNS.STAMPEDE, count: 12, direction: 'top' },
    { time: 450, enemyType: ENEMY_TYPES.CIGARETTE, pattern: WAVE_PATTERNS.HORDE, count: 16, healthMultiplier: 1.2 },
    { time: 480, enemyType: ENEMY_TYPES.SHIELD, pattern: WAVE_PATTERNS.CIRCLE, count: 10 },
    { time: 510, enemyType: ENEMY_TYPES.DNA, pattern: WAVE_PATTERNS.HORDE, count: 12 },
    // Final pincer: ALL 4 DIRECTIONS
    { time: 540, enemyType: ENEMY_TYPES.ZOMBIE, pattern: WAVE_PATTERNS.STAMPEDE, count: 10, direction: 'left' },
    { time: 540, enemyType: ENEMY_TYPES.ZOMBIE, pattern: WAVE_PATTERNS.STAMPEDE, count: 10, direction: 'right' },
    { time: 540, enemyType: ENEMY_TYPES.ZOMBIE, pattern: WAVE_PATTERNS.STAMPEDE, count: 10, direction: 'top' },
    { time: 540, enemyType: ENEMY_TYPES.ZOMBIE, pattern: WAVE_PATTERNS.STAMPEDE, count: 10, direction: 'bottom' },
    { time: 570, enemyType: ENEMY_TYPES.CLIPPER, pattern: WAVE_PATTERNS.HORDE, count: 20 },
    // 10:00 - Final Boss handled by existing BOSSES array
]
