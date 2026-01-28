import { GAME_CONFIG, ENEMIES, BOSSES } from '../../constants'
import { getDifficultyMultiplier } from '../domain/difficulty'
import { generateId } from '../domain/math'
import { handleWaveSpawns } from '../features/waves/WaveSystem'

export const handleSpawns = ({ state, currentTime }) => {
  const difficulty = getDifficultyMultiplier(state.gameTime)

  // Wave-based spawning (replaces random spawns)
  handleWaveSpawns({ state, currentTime })

  // Spawn boss
  // Spawn boss (Multiple Bosses supported)
  BOSSES.forEach(boss => {
    // Check if it's time to spawn this boss AND it hasn't been spawned yet
    const alreadySpawned = state.spawnedBossIds ? state.spawnedBossIds.includes(boss.id) : state.bossSpawned

    if (state.gameTime >= boss.spawnTime && !alreadySpawned) {

      if (state.spawnedBossIds) {
        state.spawnedBossIds.push(boss.id)
      }
      state.bossSpawned = true // Keep legacy flag true if any boss spawns

      // Record boss spawn event for UI notification
      if (!state.bossSpawnEvents) {
        state.bossSpawnEvents = []
      }
      state.bossSpawnEvents.push({
        bossId: boss.id,
        time: state.gameTime,
        sound: boss.sound,
        subtitle: boss.subtitle,
      })

      const angle = Math.random() * Math.PI * 2
      state.enemies.push({
        id: generateId(),
        ...boss,
        x: state.player.x + Math.cos(angle) * 500,
        y: state.player.y + Math.sin(angle) * 500,
        currentHp: Math.floor(boss.hp * difficulty.hpMultiplier),
        maxHp: Math.floor(boss.hp * difficulty.hpMultiplier),
        scaledDamage: boss.damage * difficulty.damageMultiplier,
        scaledSpeed: boss.speed,
        rotation: 0,
        lastAttack: 0,
      })

      // Special: At 10 minute boss (boss_airraid), spawn circle of 50 shields with 3x health
      if (boss.id === 'boss_airraid') {
        const shieldDef = ENEMIES.find(e => e.type === 'shield_guy')
        if (shieldDef) {
          const shieldCount = 50
          const circleRadius = GAME_CONFIG.SPAWN_DISTANCE_MIN + 100
          const healthMultiplier = 3.0 * difficulty.hpMultiplier

          for (let i = 0; i < shieldCount; i++) {
            const shieldAngle = (i / shieldCount) * Math.PI * 2
            const shieldX = state.player.x + Math.cos(shieldAngle) * circleRadius
            const shieldY = state.player.y + Math.sin(shieldAngle) * circleRadius

            state.enemies.push({
              id: generateId(),
              ...shieldDef,
              x: shieldX,
              y: shieldY,
              currentHp: Math.floor(shieldDef.hp * healthMultiplier),
              maxHp: Math.floor(shieldDef.hp * healthMultiplier),
              scaledDamage: shieldDef.damage * difficulty.damageMultiplier,
              scaledSpeed: shieldDef.speed * difficulty.speedMultiplier,
              rotation: 0,
              lastAttack: 0,
              isDashing: false,
              dashTarget: null,
              isDead: false,
              deathTimer: 0,
              vx: 0,
              vy: 0,
            })
          }
          console.log(`[BOSS] Spawned shield circle: ${shieldCount} shields with 3x health`)
        }
      }
    }
  })
}
