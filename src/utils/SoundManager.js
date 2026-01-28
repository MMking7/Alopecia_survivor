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
    hit1: '/sounds/snd_hit1.wav',
    attack_female: '/sounds/attack/femalebald.wav',
    attack_areata: '/sounds/attack/areata.wav',
    attack_wongfeihung: '/sounds/attack/wongfeihung.wav',
    attack_heihachi: '/sounds/attack/heihachi.wav',
    attack_talmo_docter: '/sounds/attack/talmo_docter.wav',
    attack_mzamen: '/sounds/attack/mzaman.wav',
}

// Audio cache to avoid creating new Audio objects every time
const audioCache = {}

// Audio pool for rapid-fire sounds (like hit effects)
const audioPool = {}
const POOL_SIZE = 10 // Increased for more overlapping sounds

// Throttle tracking for rapid sounds
let lastHitSoundTime = 0
const HIT_SOUND_THROTTLE_MS = 0 // No throttle - play every hit sound

// Global volume multiplier (can be set from settings)
let globalSfxVolume = 0.7

/**
 * Set the global SFX volume multiplier
 * @param {number} volume - Volume from 0 to 1
 */
export const setGlobalSfxVolume = (volume) => {
    globalSfxVolume = Math.max(0, Math.min(1, volume))
}

/**
 * Get or create an audio pool for a sound
 */
const getAudioFromPool = (soundKey) => {
    const soundPath = SOUNDS[soundKey]
    if (!soundPath) return null

    if (!audioPool[soundKey]) {
        audioPool[soundKey] = []
        for (let i = 0; i < POOL_SIZE; i++) {
            audioPool[soundKey].push(new Audio(soundPath))
        }
    }

    // Find an audio element that isn't currently playing
    const pool = audioPool[soundKey]
    for (const audio of pool) {
        if (audio.paused || audio.ended) {
            return audio
        }
    }

    // All are busy, return the first one (will restart it)
    return pool[0]
}

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
        audio.volume = Math.max(0, Math.min(1, volume * globalSfxVolume))

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

/**
 * Play a pooled sound (for rapid-fire sounds like hit effects)
 * Uses audio pooling to allow overlapping playback
 */
const playPooledSound = (soundKey, volume = 0.5, throttleMs = 0) => {
    try {
        // Throttle check
        const now = performance.now()
        if (throttleMs > 0) {
            if (now - lastHitSoundTime < throttleMs) {
                return // Skip this sound, too soon
            }
            lastHitSoundTime = now
        }

        const audio = getAudioFromPool(soundKey)
        if (!audio) {
            console.warn(`[SoundManager] Unknown sound key: ${soundKey}`)
            return
        }

        audio.volume = Math.max(0, Math.min(1, volume * globalSfxVolume))
        audio.currentTime = 0
        audio.play().catch(err => {
            if (err.name !== 'NotAllowedError') {
                console.warn(`[SoundManager] Failed to play ${soundKey}:`, err)
            }
        })
    } catch (err) {
        console.warn(`[SoundManager] Error playing pooled sound:`, err)
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

// Hit sound uses pooling + throttling for rapid playback
export const playHit1 = (volume = 0.3) => playPooledSound('hit1', volume, HIT_SOUND_THROTTLE_MS)

const CHARACTER_ATTACK_SOUNDS = {
    female: 'attack_female',
    areata: 'attack_areata',
    wongfeihung: 'attack_wongfeihung',
    heihachi: 'attack_heihachi',
    talmo_docter: 'attack_talmo_docter',
    mzamen: 'attack_mzamen',
}

export const playCharacterAttack = (characterId, volume = 0.45) => {
    const soundKey = CHARACTER_ATTACK_SOUNDS[characterId]
    if (!soundKey) return
    playSound(soundKey, volume)
}

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
    playHit1,
    playCharacterAttack,
}

