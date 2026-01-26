import { GAME_CONFIG } from '../../constants'

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const getXpNeededForLevel = (level) => {
  const base = 100
  if (level <= 1) return base
  return Math.floor(base * Math.pow(GAME_CONFIG.LEVEL_XP_MULTIPLIER, level - 1))
}
