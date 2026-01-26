import { UPGRADES } from '../../constants'
import { generateMixedLevelUpOptions } from '../../SubWeapons'
import { getMainWeapon, getPassiveSkillOptions } from '../../MainWeapons'

export const buildLevelUpOptions = (state) => {
  const optionPool = []

  // 1. Main Weapon Upgrade (if not maxed) - add to pool
  if (state.mainWeaponLevel < 7) {
    const mainWeapon = getMainWeapon(state.player.character.id)
    if (mainWeapon) {
      const nextLevel = state.mainWeaponLevel + 1
      const nextEffect = mainWeapon.levelEffects[nextLevel]
      optionPool.push({
        id: mainWeapon.id,
        name: mainWeapon.name,
        type: nextLevel === 7 ? '무기 (각성)' : '무기',
        description: mainWeapon.description,
        icon: nextLevel === 7 ? `${state.player.character.id}_gaksung` : `${state.player.character.id}_mainattack`,
        isMainWeapon: true,
        currentLevel: state.mainWeaponLevel,
        nextLevel,
        effect: nextEffect,
      })
    }
  }

  // 2. Passive Skills - add all available to pool
  const passiveOptions = getPassiveSkillOptions(state.player.character.id, state.passiveSkills)
  passiveOptions.forEach((skill) => {
    optionPool.push({
      ...skill,
      type: '패시브 스킬',
      icon: skill.icon,
    })
  })

  // 3. Sub Weapons and Items - add to pool
  const mixedOptions = generateMixedLevelUpOptions(UPGRADES, state.inventory, 5)
  optionPool.push(...mixedOptions)

  // Randomly select 3 options from the pool
  const shuffled = [...optionPool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}
