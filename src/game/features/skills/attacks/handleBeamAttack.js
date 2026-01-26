import { getMainWeapon } from '../../../../MainWeapons'
import { generateId, distance } from '../../../domain/math'

export const handleBeamAttack = ({ state, currentTime, character }) => {
  // 원형 탈모 - 탈모빔 (Hair Loss Beam - Single target with level scaling)
  const areataWeapon = getMainWeapon('areata')
  const areataEffect = areataWeapon ? areataWeapon.levelEffects[state.mainWeaponLevel] : { damage: 2.0 }

  let nearest = null
  let nearestDist = Infinity
  state.enemies.forEach((enemy) => {
    const d = distance(state.player, enemy)
    if (d < nearestDist && d <= state.stats.attackRange * 2) {
      nearest = enemy
      nearestDist = d
    }
  })
  if (nearest) {
    state.attackEffects.push({
      id: generateId(),
      type: 'beam',
      target: { x: nearest.x, y: nearest.y },
      x2: nearest.x,
      y2: nearest.y,
      color: character.attackColor,
      createdAt: currentTime,
      duration: 200,
    })
    const explosionRadius = areataEffect.explosionRadius || 50
    state.attackEffects.push({
      id: generateId(),
      type: 'aoe',
      x: nearest.x,
      y: nearest.y,
      maxRadius: explosionRadius,
      color: character.attackColor,
      createdAt: currentTime,
      duration: 300,
    })

    const damage = state.stats.damage * areataEffect.damage
    state.enemies.forEach((enemy) => {
      if (enemy.isDead) return
      if (distance(nearest, enemy) <= explosionRadius) {
        enemy.currentHp -= damage
        state.damageNumbers.push({
          id: generateId(),
          x: enemy.x,
          y: enemy.y,
          damage: Math.floor(damage),
          createdAt: currentTime,
        })
      }
    })
  }
}
