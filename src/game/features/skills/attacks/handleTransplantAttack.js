import { getMainWeapon } from '../../../../MainWeapons'
import { generateId, distance } from '../../../domain/math'

export const handleTransplantAttack = ({ state, currentTime, character }) => {
  // Hair Transplant Gun - Piercing projectile that hits all enemies in a line
  const talmoWeapon = getMainWeapon('talmo_docter')
  const talmoEffect = talmoWeapon ?
    talmoWeapon.levelEffects[state.mainWeaponLevel] :
    { damage: 1.20, range: 130, angle: 120, lifeSteal: 0.15 }

  const projectileRange = talmoEffect.range
  const projectileSpeed = character.projectileSpeed || 400

  // Find direction based on aim mode
  let targetAngle = state.player.facing === 1 ? 0 : Math.PI

  if (state.aimMode === 'manual') {
    // Manual aim: shoot towards mouse cursor
    targetAngle = Math.atan2(
      state.mouse.worldY - state.player.y,
      state.mouse.worldX - state.player.x
    )
  } else {
    // Auto aim: find nearest enemy
    let nearestEnemy = null
    let nearestEnemyDist = Infinity

    state.enemies.forEach((enemy) => {
      const d = distance(state.player, enemy)
      if (d < nearestEnemyDist && d <= projectileRange * 1.5) {
        nearestEnemy = enemy
        nearestEnemyDist = d
      }
    })

    if (nearestEnemy) {
      targetAngle = Math.atan2(nearestEnemy.y - state.player.y, nearestEnemy.x - state.player.x)
    }
  }

  // Calculate damage with fragment bonus (awakening)
  let baseDamage = state.stats.damage * talmoEffect.damage
  if (talmoEffect.fragmentBonus &&
    state.fragments >= talmoEffect.fragmentBonusThreshold) {
    baseDamage *= (1 + talmoEffect.fragmentBonusDamage)
  }

  // Create piercing projectile(s) - 부메랑처럼 여러 개 발사
  if (!state.transplantProjectiles) state.transplantProjectiles = []

  const projectileCount = talmoEffect.projectileCount || 1
  const spreadAngle = talmoEffect.spreadAngle || 0.25
  const returnsToPlayer = talmoEffect.returnsToPlayer || false

  for (let i = 0; i < projectileCount; i++) {
    // 부채꼴 형태로 퍼지게 발사
    let angleOffset = 0
    if (projectileCount > 1) {
      angleOffset = (i - (projectileCount - 1) / 2) * spreadAngle
    }
    const finalAngle = targetAngle + angleOffset

    state.transplantProjectiles.push({
      id: generateId(),
      x: state.player.x,
      y: state.player.y,
      startX: state.player.x,
      startY: state.player.y,
      vx: Math.cos(finalAngle) * projectileSpeed,
      vy: Math.sin(finalAngle) * projectileSpeed,
      angle: finalAngle,
      damage: baseDamage,
      range: projectileRange,
      size: character.projectileSize || 100,
      hitEnemies: [],
      returnHitEnemies: [], // 돌아올 때 맞은 적
      createdAt: currentTime,
      color: character.attackColor,
      // Talmo Docter specific effects
      lifeSteal: talmoEffect.lifeSteal,
      fragmentChance: talmoEffect.fragmentChance || 0,
      maxFragments: talmoEffect.maxFragments || 50,
      // 부메랑 효과 (각성)
      returnsToPlayer: returnsToPlayer,
      returning: false, // 돌아오는 중인지
      maxDistance: projectileRange, // 최대 이동 거리
    })
  }
}
