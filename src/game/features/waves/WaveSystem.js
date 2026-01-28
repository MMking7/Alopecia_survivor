/**
 * Wave System
 * Handles time-based enemy wave spawning with different patterns
 */

import { ENEMIES, GAME_CONFIG } from '../../../constants'
import { generateId } from '../../domain/math'
import { getDifficultyMultiplier } from '../../domain/difficulty'
import { WAVE_TIMELINE, WAVE_PATTERNS } from './WaveData'

/**
 * Initialize wave state (call once when game starts)
 */
export const createWaveState = () => ({
    triggeredWaves: [], // Array of wave times already triggered
    lastRandomSpawn: 0, // For filler spawns between waves
})

/**
 * Main wave spawn handler
 * Call this every frame from the game loop
 */
export const handleWaveSpawns = ({ state, currentTime }) => {
    const gameTime = state.gameTime // in seconds
    const difficulty = getDifficultyMultiplier(gameTime)

    // Initialize wave state if needed
    if (!state.waveState) {
        state.waveState = createWaveState()
    }

    // Check for waves to trigger
    WAVE_TIMELINE.forEach(wave => {
        if (gameTime >= wave.time && !state.waveState.triggeredWaves.includes(wave.time)) {
            // Mark as triggered
            state.waveState.triggeredWaves.push(wave.time)

            // Spawn the wave
            spawnWave({ state, wave, difficulty, currentTime })

            console.log(`[WAVE] Triggered: ${wave.pattern} of ${wave.count}x ${wave.enemyType} at ${wave.time}s`)
        }
    })

    // Filler spawns between waves (reduced rate)
    // Time-based spawn rate: 2x faster after 5 minutes
    const baseFillerSpawnRate = 1000 // 1 second between filler spawns
    const fillerSpawnRate = gameTime >= 300 ? baseFillerSpawnRate / 2 : baseFillerSpawnRate // 500ms after 5 mins
    if (currentTime - state.waveState.lastRandomSpawn > fillerSpawnRate) {
        state.waveState.lastRandomSpawn = currentTime
        spawnFillerEnemy({ state, difficulty })
    }
}

/**
 * Spawn a wave based on pattern type
 */
const spawnWave = ({ state, wave, difficulty, currentTime }) => {
    const enemyDef = ENEMIES.find(e => e.type === wave.enemyType)
    if (!enemyDef) {
        console.warn(`[WAVE] Unknown enemy type: ${wave.enemyType}`)
        return
    }

    const healthMult = (wave.healthMultiplier || 1.0) * difficulty.hpMultiplier
    const speedMult = (wave.speedMultiplier || 1.0) * difficulty.speedMultiplier

    switch (wave.pattern) {
        case WAVE_PATTERNS.CLUSTER:
            spawnCluster({ state, enemyDef, count: wave.count, healthMult, speedMult, difficulty })
            break
        case WAVE_PATTERNS.STAMPEDE:
            spawnStampede({ state, enemyDef, count: wave.count, direction: wave.direction || 'random', healthMult, speedMult, difficulty })
            break
        case WAVE_PATTERNS.CIRCLE:
            spawnCircle({ state, enemyDef, count: wave.count, healthMult, speedMult, difficulty })
            break
        case WAVE_PATTERNS.HORDE:
            spawnHorde({ state, enemyDef, count: wave.count, healthMult, speedMult, difficulty })
            break
        default:
            console.warn(`[WAVE] Unknown pattern: ${wave.pattern}`)
    }
}

/**
 * CLUSTER: Small group spawned near player
 */
const spawnCluster = ({ state, enemyDef, count, healthMult, speedMult, difficulty }) => {
    const baseAngle = Math.random() * Math.PI * 2
    const baseDistance = GAME_CONFIG.SPAWN_DISTANCE_MIN + 100

    for (let i = 0; i < count; i++) {
        const angle = baseAngle + (Math.random() - 0.5) * 0.5 // Slight spread
        const dist = baseDistance + Math.random() * 50

        spawnEnemy({ state, enemyDef, x: state.player.x + Math.cos(angle) * dist, y: state.player.y + Math.sin(angle) * dist, healthMult, speedMult, difficulty })
    }
}

/**
 * STAMPEDE: Line of enemies from one edge
 */
const spawnStampede = ({ state, enemyDef, count, direction, healthMult, speedMult, difficulty }) => {
    // Determine spawn edge
    let dir = direction
    if (dir === 'random') {
        const dirs = ['left', 'right', 'top', 'bottom']
        dir = dirs[Math.floor(Math.random() * dirs.length)]
    }

    const spawnDist = GAME_CONFIG.SPAWN_DISTANCE_MAX
    const spreadRange = 800 // How spread out the line is (increased)

    for (let i = 0; i < count; i++) {
        let x, y
        const offset = (i - count / 2) * (spreadRange / count)

        switch (dir) {
            case 'left':
                x = state.player.x - spawnDist
                y = state.player.y + offset
                break
            case 'right':
                x = state.player.x + spawnDist
                y = state.player.y + offset
                break
            case 'top':
                x = state.player.x + offset
                y = state.player.y - spawnDist
                break
            case 'bottom':
                x = state.player.x + offset
                y = state.player.y + spawnDist
                break
            default:
                x = state.player.x + spawnDist
                y = state.player.y + offset
        }

        // Calculate locked direction (towards player center at spawn time)
        let lockedDirection = { x: 0, y: 0 }
        switch (dir) {
            case 'left':
                lockedDirection = { x: 1, y: 0 } // Move right
                break
            case 'right':
                lockedDirection = { x: -1, y: 0 } // Move left
                break
            case 'top':
                lockedDirection = { x: 0, y: 1 } // Move down
                break
            case 'bottom':
                lockedDirection = { x: 0, y: -1 } // Move up
                break
        }

        spawnEnemy({ state, enemyDef, x, y, healthMult, speedMult: speedMult * 1.5, difficulty, attackType: 'stampede', lockedDirection }) // Stampede enemies are faster
    }
}

/**
 * CIRCLE: Ring of enemies surrounding player
 */
const spawnCircle = ({ state, enemyDef, count, healthMult, speedMult, difficulty }) => {
    const radius = GAME_CONFIG.SPAWN_DISTANCE_MIN + 150

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        const x = state.player.x + Math.cos(angle) * radius
        const y = state.player.y + Math.sin(angle) * radius

        spawnEnemy({ state, enemyDef, x, y, healthMult, speedMult, difficulty })
    }
}

/**
 * HORDE: Large volume of enemies from multiple directions
 */
const spawnHorde = ({ state, enemyDef, count, healthMult, speedMult, difficulty }) => {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist = GAME_CONFIG.SPAWN_DISTANCE_MIN + Math.random() * (GAME_CONFIG.SPAWN_DISTANCE_MAX - GAME_CONFIG.SPAWN_DISTANCE_MIN)
        const x = state.player.x + Math.cos(angle) * dist
        const y = state.player.y + Math.sin(angle) * dist

        // Hordes have slightly weaker enemies but faster
        spawnEnemy({ state, enemyDef, x, y, healthMult: healthMult * 0.8, speedMult: speedMult * 1.3, difficulty })
    }
}

/**
 * Filler spawn (for between waves)
 */
const spawnFillerEnemy = ({ state, difficulty }) => {
    // Use basic enemies for filler
    const fillerTypes = ENEMIES.filter(e => ['zombie', 'clipper', 'dna'].includes(e.type))
    if (fillerTypes.length === 0) return

    const enemyDef = fillerTypes[Math.floor(Math.random() * fillerTypes.length)]
    const angle = Math.random() * Math.PI * 2
    const dist = GAME_CONFIG.SPAWN_DISTANCE_MIN + Math.random() * 100

    spawnEnemy({
        state,
        enemyDef,
        x: state.player.x + Math.cos(angle) * dist,
        y: state.player.y + Math.sin(angle) * dist,
        healthMult: difficulty.hpMultiplier,
        speedMult: difficulty.speedMultiplier,
        difficulty,
    })
}

/**
 * Core enemy spawner
 */
const spawnEnemy = ({ state, enemyDef, x, y, healthMult, speedMult, difficulty, attackType, lockedDirection }) => {
    state.enemies.push({
        id: generateId(),
        ...enemyDef,
        x,
        y,
        currentHp: Math.floor(enemyDef.hp * healthMult),
        maxHp: Math.floor(enemyDef.hp * healthMult),
        scaledDamage: enemyDef.damage * difficulty.damageMultiplier,
        scaledSpeed: enemyDef.speed * speedMult,
        rotation: 0,
        lastAttack: 0,
        isDashing: false,
        dashTarget: null,
        isDead: false,
        deathTimer: 0,
        vx: 0,
        vy: 0,
        attackType: attackType || enemyDef.attackType, // Override if provided
        lockedDirection: lockedDirection || null, // For stampede walls
    })
}
