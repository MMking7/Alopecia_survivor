import { generateId, distance } from '../../../domain/math'
import { playHit1 } from '../../../../utils/SoundManager'

export const updateSubWeaponProjectiles = ({ state, currentTime, deltaTime }) => {
  // Update sub weapon projectiles
  state.subWeaponProjectiles = state.subWeaponProjectiles.filter(proj => {
    proj.x += proj.vx * deltaTime
    proj.y += proj.vy * deltaTime

    let hit = false
    state.enemies.forEach(enemy => {
      if (enemy.isDead || hit) return
      if (distance(proj, enemy) < 30) {
        hit = true
      }
    })

    if (hit || currentTime - proj.createdAt > 5000) {
      if (proj.type === 'hair_spray_missile') {
        state.enemies.forEach(enemy => {
          if (enemy.isDead) return
          if (distance(proj, enemy) < proj.radius) {
            enemy.currentHp -= proj.damage
            enemy.lastHitTime = currentTime // Hit flash
            playHit1()
            state.damageNumbers.push({
              id: generateId(),
              x: enemy.x,
              y: enemy.y,
              damage: Math.floor(proj.damage),
              color: '#88FF88',
              createdAt: currentTime,
            })
          }
        })

        state.subWeaponEffects.push({
          id: generateId(),
          type: 'spray_cloud',
          x: proj.x,
          y: proj.y,
          radius: proj.radius,
          damagePerSecond: proj.cloudDamage,
          duration: 800, // 0.8 seconds for explosion animation
          createdAt: currentTime,
        })
      }
      return false
    }
    return true
  })
}
