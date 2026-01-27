import { getMainWeapon } from '../../../../MainWeapons'
import { generateId, distance } from '../../../domain/math'
import { damageMapObjects } from '../../../usecases/combat'

export const handleBeamAttack = ({ state, currentTime, character }) => {
  // 원형 탈모 - 탈모빔 (Hair Loss Beam - Single target with level scaling)
  const areataWeapon = getMainWeapon('areata')
  const areataEffect = areataWeapon ? areataWeapon.levelEffects[state.mainWeaponLevel] : { damage: 2.0 }

  // Determine Aim Angle
  let aimAngle
  if (state.aimMode === 'manual') {
    aimAngle = Math.atan2(
      state.mouse.worldY - state.player.y,
      state.mouse.worldX - state.player.x
    )
  } else {
    // Auto aim: find nearest enemy to set angle
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
      aimAngle = Math.atan2(nearest.y - state.player.y, nearest.x - state.player.x)
    } else {
      // Default to facing direction if no enemy
      aimAngle = state.player.facingAngle || 0
    }
  }

  // Raycast: Find the closest enemy along the beam path
  const beamRange = state.stats.attackRange * 1.5 // 빔 사거리
  const beamWidth = 40 // 빔 판정 너비
  const explosionRadius = areataEffect.explosionRadius || 50

  let closestTarget = null
  let minTargetDist = Infinity
  let targetX, targetY

  state.enemies.forEach((enemy) => {
    // 1. Check distance to player
    const distToPlayer = distance(state.player, enemy)
    if (distToPlayer > beamRange) return

    // 2. Check angle difference (is enemy in front?)
    const angleToEnemy = Math.atan2(enemy.y - state.player.y, enemy.x - state.player.x)
    let angleDiff = angleToEnemy - aimAngle
    // Normalize to -PI ~ PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

    if (Math.abs(angleDiff) > Math.PI / 2) return // Behind the player

    // 3. Distance to line (Perpendicular distance)
    // P = Player, E = Enemy, A = Angle
    // Project Vector(PE) onto Direction Vector
    // But easier: check rotated coordinates
    const dx = enemy.x - state.player.x
    const dy = enemy.y - state.player.y

    // Rotate enemy position by -aimAngle to align beam with X-axis
    const rotatedY = dx * Math.sin(-aimAngle) + dy * Math.cos(-aimAngle)

    if (Math.abs(rotatedY) < beamWidth / 2) {
      // Collides with beam width!
      if (distToPlayer < minTargetDist) {
        minTargetDist = distToPlayer
        closestTarget = enemy
      }
    }
  })

  if (closestTarget) {
    targetX = closestTarget.x
    targetY = closestTarget.y
  } else {
    // Miss - Max range
    targetX = state.player.x + Math.cos(aimAngle) * beamRange
    targetY = state.player.y + Math.sin(aimAngle) * beamRange
  }

  // Create beam effect
  const beamCount = areataEffect.beamCount || 1
  const spreadAngle = areataEffect.spreadAngle || 0.15

  // Calculate start angle to center the beams
  const startAngle = aimAngle - ((beamCount - 1) * spreadAngle) / 2

  for (let i = 0; i < beamCount; i++) {
    const currentAngle = startAngle + (i * spreadAngle)

    // Recalculate target for this specific beam angle (Raycast again or simplify)
    // For accuracy, we should raycast for each beam.
    let thisTargetX, thisTargetY
    let thisClosestTarget = null
    let thisMinDist = Infinity

    state.enemies.forEach((enemy) => {
      const distToPlayer = distance(state.player, enemy)
      if (distToPlayer > beamRange) return

      // Check relative to currentAngle
      const dx = enemy.x - state.player.x
      const dy = enemy.y - state.player.y
      const rotatedY = dx * Math.sin(-currentAngle) + dy * Math.cos(-currentAngle)

      // Forward check
      const angleToEnemy = Math.atan2(dy, dx)
      let angleDiff = angleToEnemy - currentAngle
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      if (Math.abs(angleDiff) > Math.PI / 2) return

      if (Math.abs(rotatedY) < beamWidth / 2) {
        if (distToPlayer < thisMinDist) {
          thisMinDist = distToPlayer
          thisClosestTarget = enemy
        }
      }
    })

    if (thisClosestTarget) {
      thisTargetX = thisClosestTarget.x
      thisTargetY = thisClosestTarget.y
    } else {
      thisTargetX = state.player.x + Math.cos(currentAngle) * beamRange
      thisTargetY = state.player.y + Math.sin(currentAngle) * beamRange
    }

    state.attackEffects.push({
      id: generateId(),
      type: 'beam',
      target: { x: thisTargetX, y: thisTargetY },
      x2: thisTargetX,
      y2: thisTargetY,
      color: character.attackColor,
      createdAt: currentTime,
      duration: 200,
    })
    state.attackEffects.push({
      id: generateId(),
      type: 'aoe',
      x: thisTargetX,
      y: thisTargetY,
      maxRadius: explosionRadius,
      color: character.attackColor,
      createdAt: currentTime,
      duration: 300,
    })

    const baseDamage = state.stats.damage * areataEffect.damage
    state.enemies.forEach((enemy) => {
      if (enemy.isDead) return
      if (distance({ x: thisTargetX, y: thisTargetY }, enemy) <= explosionRadius) {
        // Crit check
        const isCritical = Math.random() < state.stats.crit
        const damage = isCritical ? baseDamage * 2.0 : baseDamage // 2x crit multiplier

        enemy.currentHp -= damage
        state.damageNumbers.push({
          id: generateId(),
          x: enemy.x,
          y: enemy.y,
          damage: Math.floor(damage),
          isCritical,
          createdAt: currentTime,
        })
      }
    })

    // Damage map objects at explosion
    damageMapObjects(state, { x: thisTargetX, y: thisTargetY, radius: explosionRadius }, damage, currentTime, true)
  }
}
