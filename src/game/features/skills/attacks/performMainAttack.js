import { getMainWeapon } from '../../../../MainWeapons'
import { handleAoeAttack } from './handleAoeAttack'
import { handleBeamAttack } from './handleBeamAttack'
import { handleSpinAttack } from './handleSpinAttack'
import { handleLightningAttack } from './handleLightningAttack'
import { handleTransplantAttack } from './handleTransplantAttack'
import { handleBoomerangAttack } from './handleBoomerangAttack'

const attackHandlers = {
  aoe: handleAoeAttack,
  beam: handleBeamAttack,
  spin: handleSpinAttack,
  lightning: handleLightningAttack,
  transplant: handleTransplantAttack,
  boomerang: handleBoomerangAttack,
}

export const performMainAttack = ({ state, currentTime }) => {
  const character = state.player.character
  const mainWeapon = getMainWeapon(character.id)
  const weaponEffect = mainWeapon ? mainWeapon.levelEffects[state.mainWeaponLevel] : null
  const attackSpeedBonus = weaponEffect?.attackSpeedBonus || 0
  const finalAttackSpeed = state.stats.attackSpeed * (1 + attackSpeedBonus)

  // For female character (aoe), use weapon's attackCooldown directly
  // For heihachi (lightning), use weapon's attackCooldown
  // For other characters, use attackSpeed-based interval
  let attackInterval
  if ((character.attackType === 'aoe' || character.attackType === 'spin' || character.attackType === 'lightning') && mainWeapon?.attackCooldown) {
    attackInterval = mainWeapon.attackCooldown
  } else {
    attackInterval = 1000 / finalAttackSpeed
  }

  if (currentTime - state.lastAttackTime < attackInterval) return
  state.lastAttackTime = currentTime

  // Remove old effects (except for long-duration effects)
  state.attackEffects = state.attackEffects.filter((e) => {
    if (e.type === 'female_attack_zone' || e.type === 'female_special_zone' || e.type === 'areata_special_zone' || e.type === 'rotating_whirlpool') {
      return currentTime - e.createdAt < e.duration
    }
    return currentTime - e.createdAt < 300
  })

  const handler = attackHandlers[character.attackType]
  if (handler) {
    handler({ state, currentTime, character })
  }
}
