import React from 'react'
import { 
  PixelPanel, 
  PixelButton, 
  PixelTitle,
  COLORS,
  PIXEL_STYLES 
} from '../styles/PixelUI'
import defaultCursor from '../assets/cursors/cursor.png'

/**
 * GameOverScreen Component
 * 
 * Props:
 * - stats: { level, kills, time, hp, maxHp, earnedCoins, score }
 * - onRetry: Function to restart game with same character
 * - onCharacterSelect: Function to go back to character selection
 * - onMenu: Function to go back to main menu
 */
const GameOverScreen = ({ stats, onRetry, onCharacterSelect, onMenu }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
      cursor: `url(${defaultCursor}) 0 0, auto`,
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 2px, transparent 2px, transparent 4px)',
        pointerEvents: 'none',
      }} />

      {/* Game Over Title */}
      <PixelTitle 
        size="xlarge" 
        color={COLORS.danger}
        style={{ marginBottom: '40px', letterSpacing: '8px' }}
      >
        GAME OVER
      </PixelTitle>

      {/* Stats Panel */}
      <PixelPanel style={{ 
        minWidth: '400px', 
        marginBottom: '40px',
        textAlign: 'center',
      }}>
        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '20px', 
          marginBottom: '25px',
        }}>
          <StatItem icon="⏱️" label="TIME" value={formatTime(stats.time)} color={COLORS.info} />
          <StatItem icon="💀" label="KILLS" value={stats.kills} color={COLORS.danger} />
          <StatItem icon="⭐" label="LEVEL" value={stats.level} color={COLORS.primary} />
        </div>

        {/* Divider */}
        <div style={{ 
          height: '4px', 
          background: `linear-gradient(90deg, transparent, ${COLORS.panelBorder}, transparent)`,
          margin: '20px 0',
        }} />

        {/* Score */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            fontFamily: PIXEL_STYLES.fontFamily,
            color: COLORS.textGray,
            fontSize: '14px',
            marginBottom: '5px',
          }}>
            SCORE
          </div>
          <div style={{
            fontFamily: PIXEL_STYLES.fontFamily,
            color: COLORS.textWhite,
            fontSize: '36px',
            fontWeight: 'bold',
            textShadow: '3px 3px 0 #000',
          }}>
            {(stats.score || (stats.kills * 50 + Math.floor(stats.time * 10) + stats.level * 500)).toLocaleString()}
          </div>
        </div>
        
        {/* Coins Earned */}
        <PixelPanel variant="highlight" style={{ display: 'inline-block' }}>
          <div style={{
            fontFamily: PIXEL_STYLES.fontFamily,
            color: COLORS.primary,
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '2px 2px 0 #000',
          }}>
            💰 +{(stats.earnedCoins || (stats.kills + Math.floor(stats.time / 5))).toLocaleString()}
          </div>
        </PixelPanel>
      </PixelPanel>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '320px' }}>
        <PixelButton onClick={onRetry} variant="primary" size="large" style={{ width: '100%' }}>
          🔄 RETRY
        </PixelButton>
        <PixelButton onClick={onCharacterSelect} variant="dark" size="medium" style={{ width: '100%' }}>
          🎮 CHARACTER SELECT
        </PixelButton>
        <PixelButton onClick={onMenu} variant="ghost" size="medium" style={{ width: '100%' }}>
          🏠 MAIN MENU
        </PixelButton>
      </div>
    </div>
  )
}

// Helper component for stats
const StatItem = ({ icon, label, value, color }) => (
  <div>
    <div style={{ fontSize: '32px', marginBottom: '5px' }}>{icon}</div>
    <div style={{
      fontFamily: PIXEL_STYLES.fontFamily,
      color: COLORS.textGray,
      fontSize: '10px',
      marginBottom: '5px',
    }}>
      {label}
    </div>
    <div style={{
      fontFamily: PIXEL_STYLES.fontFamily,
      color: color,
      fontSize: '24px',
      fontWeight: 'bold',
      textShadow: '2px 2px 0 #000',
    }}>
      {value}
    </div>
  </div>
)

export default GameOverScreen
