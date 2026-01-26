import { getMainWeapon } from '../../../../MainWeapons'
import { generateId, distance } from '../../../domain/math'

export const handleBeamAttack = ({ state, currentTime, character }) => {
  // 원형 탈모 - 탈모빔 (Hair Loss Beam - Single target with level scaling)
  const areataWeapon = getMainWeapon('areata')
  const areataEffect = areataWeapon ? areataWeapon.levelEffects[state.mainWeaponLevel] : { damage: 2.0 }

  let targetX, targetY
  const explosionRadius = areataEffect.explosionRadius || 50

  if (state.aimMode === 'manual') {
    // Manual aim: shoot towards mouse cursor
    const mouseAngle = Math.atan2(
      state.mouse.worldY - state.player.y,
      state.mouse.worldX - state.player.x
    )
    const beamRange = state.stats.attackRange * 2
    targetX = state.player.x + Math.cos(mouseAngle) * beamRange
    targetY = state.player.y + Math.sin(mouseAngle) * beamRange
  } else {
    // Auto aim: find nearest enemy
    let nearest = null
    let nearestDist = Infinity
    state.enemies.forEach((enemy) => {
      const d = distance(state.player, enemy)
      if (d < nearestDist && d <= state.stats.attackRange * 2) {
        nearest = enemy
        nearestDist = d
      }
    })
    if (!nearest) return // No target in auto mode
    targetX = nearest.x
    targetY = nearest.y
  }

  // Create beam effect
  {
    state.attackEffects.push({
      id: generateId(),
      type: 'beam',
      target: { x: targetX, y: targetY },
      x2: targetX,
      y2: targetY,
      color: character.attackColor,
      createdAt: currentTime,
      duration: 200,
    })
    state.attackEffects.push({
      id: generateId(),
      type: 'aoe',
      x: targetX,
      y: targetY,
      maxRadius: explosionRadius,
      color: character.attackColor,
      createdAt: currentTime,
      duration: 300,
    })

    const damage = state.stats.damage * areataEffect.damage
    state.enemies.forEach((enemy) => {
      if (enemy.isDead) return
      if (distance({ x: targetX, y: targetY }, enemy) <= explosionRadius) {
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
