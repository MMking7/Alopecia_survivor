import { getMainWeapon } from '../../../../MainWeapons'
import { generateId, distance } from '../../../domain/math'
import { damageMapObjects } from '../../../usecases/combat'
import { playHit1 } from '../../../../utils/SoundManager'

export const handleSpinAttack = ({ state, currentTime, character }) => {
  // 황비홍 - 비홍 편두 (Ponytail Spin with level scaling)
  const wongWeapon = getMainWeapon('wongfeihung')
  const wongEffect = wongWeapon ? wongWeapon.levelEffects[state.mainWeaponLevel] : { damage: 1.0, range: 100 }

  // Create spinning hair visual effect
  state.attackEffects.push({
    id: generateId(),
    type: 'spin_hair',
    radius: wongEffect.range || state.stats.attackRange * 0.7,
    angle: (currentTime / 100) % (Math.PI * 2),
    color: character.attackColor,
    createdAt: currentTime,
    duration: 400,
  })

  // 범위 내 모든 적을 찾아서 최대 5명까지 공격
  const spinRange = wongEffect.range || state.stats.attackRange * 0.7
  const enemiesInRange = state.enemies.filter((enemy) =>
    !enemy.isDead && distance(state.player, enemy) <= spinRange
  )

  // 최대 공격 대상 수: 기본 5명 + (레벨 - 1)명
  // Lv1: 5, Lv2: 6, ... Lv7: 11
  const maxTargets = 5 + Math.max(0, (state.mainWeaponLevel || 1) - 1)
  const spinTargets = enemiesInRange.slice(0, maxTargets)

  spinTargets.forEach((enemy) => {
    // 1. Calculate stats
    const isCrit = Math.random() < (state.stats.crit || 0)
    const meleeDamageBonus = state.passiveBonuses.meleeDamageBonus || 0
    let damage = state.stats.damage * wongEffect.damage * (1 + meleeDamageBonus) * (isCrit ? 1.5 : 1.0)

    // 2. Awakening: Double Swing Logic
    const isAwakening = wongEffect.doubleSwing
    let totalHitCount = isAwakening ? 2 : 1

    for (let i = 0; i < totalHitCount; i++) {
      let currentDamage = damage
      let isSecondHit = (i === 1)

      if (isSecondHit) {
        // 2nd Hit: 150% Damage + Penetration (Simulated as raw damage boost if def is 0)
        // "150% 피해" -> Multiplier 1.5
        currentDamage = damage * (wongEffect.secondSwingDamage || 1.5)
      }

      enemy.currentHp -= Math.floor(currentDamage)
      enemy.lastHitTime = currentTime // Hit flash
      playHit1()

      state.damageNumbers.push({
        id: generateId(),
        x: enemy.x + (isSecondHit ? 10 : 0), // Offset slightly
        y: enemy.y - (isSecondHit ? 10 : 0),
        damage: Math.floor(currentDamage),
        isCritical: isCrit || isSecondHit, // Highlight 2nd hit?
        createdAt: currentTime + (isSecondHit ? 100 : 0), // Visual delay for 2nd hit number
      })

      // Knockback (1st Swing only, if Awakening)
      if (isAwakening && !isSecondHit && wongEffect.firstSwingKnockback) {
        const kbForce = wongEffect.firstSwingKnockback
        const angle = Math.atan2(enemy.y - state.player.y, enemy.x - state.player.x)
        // Apply simple knockback to enemy coords (or velocity if supported)
        // Assuming simple pushes for now as enemy handles movement next frame
        // But let's check if enemy has velocity support. Some code used vx/vy. 
        // In combat.js, simple enemies move directly. 
        // We'll push x/y directly but safely.
        enemy.x += Math.cos(angle) * (kbForce * 0.1) // Small push
        enemy.y += Math.sin(angle) * (kbForce * 0.1)
      }
    }

    // Stun chance (level 5+)
    if (wongEffect.stunChance && Math.random() < wongEffect.stunChance) {
      enemy.stunned = true
      enemy.stunUntil = currentTime + (wongEffect.stunDuration || 0.5) * 1000
    }
  })

  // Damage map objects in spin range
  damageMapObjects(state, { x: state.player.x, y: state.player.y, radius: spinRange }, state.stats.damage * wongEffect.damage, currentTime, true)
}
