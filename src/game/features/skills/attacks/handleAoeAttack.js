import { getMainWeapon } from '../../../../MainWeapons'
import { generateId } from '../../../domain/math'

export const handleAoeAttack = ({ state, currentTime, character }) => {
  // 여성형 탈모 - 일자 탈모 장판 (Line Ground Zones)
  const femaleWeapon = getMainWeapon('female')
  if (femaleWeapon) {
    const weaponEffect = femaleWeapon.levelEffects[state.mainWeaponLevel]

    // Determine attack angle based on aim mode
    let baseAngle
    let facingDir
    if (state.aimMode === 'manual') {
      // Manual aim: use mouse cursor direction
      baseAngle = Math.atan2(
        state.mouse.worldY - state.player.y,
        state.mouse.worldX - state.player.x
      )
      facingDir = Math.cos(baseAngle) >= 0 ? 'right' : 'left'
    } else {
      // Auto aim: use lastFacingDirection
      facingDir = state.player.lastFacingDirection || 'right'
      baseAngle = facingDir === 'right' ? 0 : Math.PI
    }

    // Create line zones based on weapon level
    for (let i = 0; i < (weaponEffect.lines || 1); i++) {
      let offsetAngle = 0
      if (weaponEffect.lines > 1) {
        // Spread lines if multiple (level 5+)
        offsetAngle = (i - (weaponEffect.lines - 1) / 2) * 0.3
      }

      const zoneAngle = baseAngle + offsetAngle
      // Position zone adjacent to player based on facing direction
      const zoneX = state.player.x + Math.cos(zoneAngle) * (weaponEffect.length / 2)
      const zoneY = state.player.y + Math.sin(zoneAngle) * (weaponEffect.length / 2)

      // Calculate Crit Snapshot
      const isCrit = Math.random() < (state.stats.crit || 0)
      const critMultiplier = isCrit ? 1.5 : 1.0
      const finalDamage = weaponEffect.damagePerSecond * critMultiplier
      const finalShockwaveDamage = (weaponEffect.shockwaveDamage || 0) * critMultiplier

      // Create ground zone effect
      if (!state.groundZones) state.groundZones = []
      state.groundZones.push({
        id: generateId(),
        type: 'female_line_zone',
        x: zoneX,
        y: zoneY,
        angle: zoneAngle,
        length: weaponEffect.length,
        width: weaponEffect.width,
        damagePerSecond: finalDamage,
        duration: (weaponEffect.duration || 2) * 1000,
        createdAt: currentTime,
        color: character.attackColor,
        facingDirection: facingDir,
        // Awakening: shockwave
        hasShockwave: weaponEffect.shockwave || false,
        shockwaveDamage: finalShockwaveDamage,
        shockwaveKnockback: weaponEffect.shockwaveKnockback || 0,
        shockwaveInterval: weaponEffect.shockwaveInterval || 1000,
        lastShockwave: currentTime,
        isCrit: isCrit,
      })

      // Visual effect with sprite support
      state.attackEffects.push({
        id: generateId(),
        type: 'female_attack_zone',
        x: zoneX,
        y: zoneY,
        angle: zoneAngle,
        length: weaponEffect.length,
        width: weaponEffect.width,
        color: character.attackColor,
        createdAt: currentTime,
        duration: (weaponEffect.duration || 2) * 1000,
        useSprite: true,
        facingDirection: facingDir,
      })
    }
  }
}
