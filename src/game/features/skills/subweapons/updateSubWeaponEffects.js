import { distance } from '../../../domain/math'

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
