import { getMainWeapon } from '../../../../MainWeapons'
import { generateId, distance } from '../../../domain/math'

export const handleBoomerangAttack = ({ state, currentTime, character }) => {
  let createdCount = 0
  // Boomerang - Throws and returns, hitting enemies multiple times
  if (!state.boomerangProjectiles) state.boomerangProjectiles = []

  // Get weapon level effects
  const mzamenWeapon = getMainWeapon('mzamen')
  const mzamenEffect = mzamenWeapon ?
    mzamenWeapon.levelEffects[state.mainWeaponLevel] :
    { waveCount: 1, damage: 1.00, speed: 300, range: 250 }

  // Check if we've reached the max active boomerangs
  if (state.boomerangProjectiles.length >= mzamenEffect.waveCount) return createdCount

  const boomerangRange = mzamenEffect.range
  const boomerangSpeed = mzamenEffect.speed
  const returnSpeed = character.returnSpeed || 450

  // Find direction based on aim mode
  let boomerangAngle = state.player.facing === 1 ? 0 : Math.PI

  if (state.aimMode === 'manual') {
    // Manual aim: throw towards mouse cursor
    boomerangAngle = Math.atan2(
      state.mouse.worldY - state.player.y,
      state.mouse.worldX - state.player.x
    )
  } else {
    // Auto aim: find nearest enemy
    let nearestBoomerangEnemy = null
    let nearestBoomerangDist = Infinity

    state.enemies.forEach((enemy) => {
      const d = distance(state.player, enemy)
      if (d < nearestBoomerangDist && d <= boomerangRange * 1.5) {
        nearestBoomerangEnemy = enemy
        nearestBoomerangDist = d
      }
    })

    if (nearestBoomerangEnemy) {
      boomerangAngle = Math.atan2(nearestBoomerangEnemy.y - state.player.y, nearestBoomerangEnemy.x - state.player.x)
    }
  }

  // Create multiple boomerangs in a spread pattern
  const boomerangSpreadAngle = 0.3 // 30 degree spread between boomerangs
  for (let i = 0; i < mzamenEffect.waveCount; i++) {
    let offsetAngle = 0
    if (mzamenEffect.waveCount > 1) {
      offsetAngle = (i - (mzamenEffect.waveCount - 1) / 2) * boomerangSpreadAngle
    }

    const finalAngle = boomerangAngle + offsetAngle

    // Apply front damage bonus from passive skill
    const frontDamageBonus = state.passiveBonuses?.frontDamageBonus || 0
    const baseDamage = state.stats.damage * mzamenEffect.damage * (1 + frontDamageBonus)
    
    // Apply range bonus
    const rangeBonus = state.passiveBonuses?.rangeBonus || 0
    const totalRange = boomerangRange * (1 + rangeBonus)

    // Apply speed scaling based on range bonus (range 늘어날수록 속도 더 빨라짐)
    // Formula: Speed scales slightly faster than range to reduce travel time
    const speedMultiplier = 1 + (rangeBonus * 1.5)
    
    const finalSpeed = boomerangSpeed * speedMultiplier
    const finalReturnSpeed = returnSpeed * speedMultiplier

    // Create boomerang projectile
    state.boomerangProjectiles.push({
      id: generateId(),
      x: state.player.x,
      y: state.player.y,
      startX: state.player.x,
      startY: state.player.y,
      vx: Math.cos(finalAngle) * finalSpeed,
      vy: Math.sin(finalAngle) * finalSpeed,
      angle: finalAngle,
      rotation: 0,
      damage: baseDamage,
      range: totalRange,
      speed: finalSpeed,
      returnSpeed: finalReturnSpeed,
      size: character.projectileSize || 80,
      hitEnemies: [],
      returning: false,
      createdAt: currentTime,
      color: character.attackColor,
      // Awakening effect
      hasReturnExplosion: mzamenEffect.returnExplosion || false,
      returnExplosionDamage: mzamenEffect.returnExplosionDamage || 0,
      returnExplosionRadius: mzamenEffect.returnExplosionRadius || 0,
      armorPenetration: mzamenEffect.armorPenetration || 0,
    })
    createdCount += 1
  }

  return createdCount
}
