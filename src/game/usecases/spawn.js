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
      console.log(`[SPAWN] Spawning boss: ${boss.id} at time: ${state.gameTime.toFixed(1)}s (Target: ${boss.spawnTime}s)`)
      if (state.spawnedBossIds) {
        state.spawnedBossIds.push(boss.id)
      }
      state.bossSpawned = true // Keep legacy flag true if any boss spawns

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
    }
  })
}
