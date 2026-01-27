import { updateActiveSpecialAbilities } from './abilities/updateActiveSpecialAbilities'
import { applyPassiveBonuses } from './passives/applyPassiveBonuses'
import { updatePassiveSkills } from './passives/updatePassiveSkills'
import { activateSpecialAbility } from './abilities/activateSpecialAbility'
import { performMainAttack } from './attacks/performMainAttack'
import { triggerSubWeaponAttacks } from './subweapons/triggerSubWeaponAttacks'
import { updateSubWeaponProjectiles } from './subweapons/updateSubWeaponProjectiles'
import { updateSubWeaponEffects } from './subweapons/updateSubWeaponEffects'
import { handlePassivePeriodicEffects } from './passives/handlePassivePeriodicEffects'

export const updateSkillSystems = ({ state, currentTime, deltaTime, gameStateRef }) => {
  updateActiveSpecialAbilities({ state, currentTime, deltaTime })
  applyPassiveBonuses({ state, currentTime })
  updatePassiveSkills({ state, currentTime, deltaTime })
  handlePassivePeriodicEffects({ state, currentTime })
  activateSpecialAbility({ state, currentTime })
  performMainAttack({ state, currentTime })
  triggerSubWeaponAttacks({ state, currentTime, deltaTime, gameStateRef })
  updateSubWeaponProjectiles({ state, currentTime, deltaTime })
  updateSubWeaponEffects({ state, currentTime, deltaTime })
}
