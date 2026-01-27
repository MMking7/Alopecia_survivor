import { generateId } from '../../../domain/math'

export const handlePassivePeriodicEffects = ({ state, currentTime }) => {
    const bonuses = state.passiveBonuses || {}

    // ============================================================
    // Highway (Female Skill 2) - HP Regen
    // ============================================================
    if (bonuses.regenPercent && bonuses.regenInterval) {
        const interval = bonuses.regenInterval * 1000
        if (currentTime - (bonuses.highwayLastRegen || 0) >= interval) {
            if (state.stats.hp < state.stats.maxHp) {
                const healAmount = state.stats.maxHp * bonuses.regenPercent
                state.stats.hp = Math.min(state.stats.maxHp, state.stats.hp + healAmount)

                state.damageNumbers.push({
                    id: generateId(),
                    x: state.player.x,
                    y: state.player.y - 40,
                    damage: `${Math.floor(healAmount)}HP`,
                    color: '#00FF00',
                    createdAt: currentTime,
                    isHeal: true,
                })
            }
            bonuses.highwayLastRegen = currentTime
        }
    }

    // ============================================================
    // Hair Shield (Female Skill 3) / Infection Prevention (Talmo Doctor)
    // ============================================================
    if (bonuses.shieldSkill) {
        const { stacks: maxStacks, interval } = bonuses.shieldSkill
        const regenInterval = interval * 1000

        // Initialize last regen if not set
        if (!bonuses.shieldLastRegen) {
            bonuses.shieldLastRegen = currentTime
        }

        if (currentTime - bonuses.shieldLastRegen >= regenInterval) {
            if ((bonuses.shieldStacks || 0) < maxStacks) {
                bonuses.shieldStacks = (bonuses.shieldStacks || 0) + 1

                // Visual feedback for shield gain? (Optional)
                state.damageNumbers.push({
                    id: generateId(),
                    x: state.player.x,
                    y: state.player.y - 60,
                    damage: 'Shield Up!',
                    color: '#8A2BE2', // Purple
                    createdAt: currentTime,
                    isHeal: true
                })
            }
            bonuses.shieldLastRegen = currentTime
        }
    }
}
