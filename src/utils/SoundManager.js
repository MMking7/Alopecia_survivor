/**
 * SoundManager - Centralized sound effect manager for the game
 * 
 * Usage: Import the play functions and call them at appropriate moments
 * 
 * Example:
 *   import { playLevelUp, playMenuConfirm } from '../utils/SoundManager'
 *   playLevelUp()
 *   playMenuConfirm()
 */

// Sound file paths
const SOUNDS = {
    levelUp: '/sounds/snd_lvl_up.wav',
    charSelectWoosh: '/sounds/snd_char_select_woosh.wav',
    charSelected: '/sounds/snd_char_selected.wav',
    menuBack: '/sounds/snd_menu_back.wav',
    menuConfirm: '/sounds/snd_menu_confirm.wav',
    menuSelect: '/sounds/snd_menu_select.wav',
    specialUse: '/sounds/snd_specialuse.wav',
    bossDefeated: '/sounds/snd_bossdefeated.wav',
    buyUpgrade: '/sounds/snd_buy_upgrade.wav',
}

// Audio cache to avoid creating new Audio objects every time
const audioCache = {}

/**
 * Play a sound by its key with volume control
 * @param {string} soundKey - Key from SOUNDS object
 * @param {number} volume - Volume from 0 to 1 (default: 0.5)
 */
const playSound = (soundKey, volume = 0.5) => {
    try {
        const soundPath = SOUNDS[soundKey]
        if (!soundPath) {
            console.warn(`[SoundManager] Unknown sound key: ${soundKey}`)
            return
        }

        // Create or reuse Audio element
        if (!audioCache[soundKey]) {
            audioCache[soundKey] = new Audio(soundPath)
        }

        const audio = audioCache[soundKey]
        audio.volume = Math.max(0, Math.min(1, volume))

        // Reset to start if already playing
        audio.currentTime = 0
        audio.play().catch(err => {
            // Ignore autoplay policy errors (user hasn't interacted yet)
            if (err.name !== 'NotAllowedError') {
                console.warn(`[SoundManager] Failed to play ${soundKey}:`, err)
            }
        })
    } catch (err) {
        console.warn(`[SoundManager] Error playing sound:`, err)
    }
}

// Convenience functions for each sound
export const playLevelUp = (volume = 0.6) => playSound('levelUp', volume)
export const playCharSelectWoosh = (volume = 0.3) => playSound('charSelectWoosh', volume)
export const playCharSelected = (volume = 0.5) => playSound('charSelected', volume)
export const playMenuBack = (volume = 0.4) => playSound('menuBack', volume)
export const playMenuConfirm = (volume = 0.5) => playSound('menuConfirm', volume)
export const playMenuSelect = (volume = 0.3) => playSound('menuSelect', volume)
export const playSpecialUse = (volume = 0.6) => playSound('specialUse', volume)
export const playBossDefeated = (volume = 0.7) => playSound('bossDefeated', volume)
export const playBuyUpgrade = (volume = 0.5) => playSound('buyUpgrade', volume)

export default {
    playLevelUp,
    playCharSelectWoosh,
    playCharSelected,
    playMenuBack,
    playMenuConfirm,
    playMenuSelect,
    playSpecialUse,
    playBossDefeated,
    playBuyUpgrade,
}
