import { distance } from '../../../domain/math'
import { playHit1 } from '../../../../utils/SoundManager'

export const updateSubWeaponEffects = ({ state, currentTime, deltaTime }) => {
  // Update sub weapon effects
  state.subWeaponEffects = state.subWeaponEffects.filter(effect => {
    const elapsed = currentTime - effect.createdAt
    if (elapsed > effect.duration) return false

    if (effect.damagePerSecond) {
      state.enemies.forEach(enemy => {
        if (enemy.isDead) return
        if (distance(effect, enemy) < effect.radius) {
          const damage = state.stats.damage * effect.damagePerSecond * deltaTime
          enemy.currentHp -= damage
          // Hit feedback for DoT - throttle to avoid spam
          if (!enemy.lastEffectHitTime || currentTime - enemy.lastEffectHitTime > 200) {
            enemy.lastHitTime = currentTime
            enemy.lastEffectHitTime = currentTime
            playHit1()
          }

          if (effect.slowAmount) {
            enemy.slowed = true
            enemy.slowAmount = effect.slowAmount
            enemy.slowUntil = currentTime + 500
          }
        }
      })
    }

    return true
  })
}
