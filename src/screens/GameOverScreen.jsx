import React from 'react'

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
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(4px)',
      zIndex: 20,
    }}>
      {/* Game Over Title */}
      <h1 style={{
        fontFamily: '"Press Start 2P", cursive, sans-serif',
        fontSize: '48px',
        color: '#fff',
        textShadow: '4px 4px 0 #000, -2px -2px 0 #000',
        marginBottom: '30px',
        letterSpacing: '4px'
      }}>
        GAME OVER
      </h1>

      {/* Stats Summary */}
      <div style={{
        background: 'rgba(0,0,0,0.5)',
        padding: '30px 50px',
        borderRadius: '12px',
        marginBottom: '40px',
        textAlign: 'center',
        border: '2px solid #444',
        minWidth: '350px'
      }}>
        {/* Detailed Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '15px', 
          marginBottom: '20px',
          textAlign: 'left' 
        }}>
          <div style={{ color: '#87CEEB', fontSize: '18px' }}>
            ⏱️ Time: <span style={{ color: '#fff' }}>{formatTime(stats.time)}</span>
          </div>
          <div style={{ color: '#ff6b6b', fontSize: '18px' }}>
            💀 Kills: <span style={{ color: '#fff' }}>{stats.kills}</span>
          </div>
          <div style={{ color: '#FFD700', fontSize: '18px' }}>
            ⭐ Level: <span style={{ color: '#fff' }}>{stats.level}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ 
          height: '2px', 
          background: 'linear-gradient(90deg, transparent, #444, transparent)', 
          margin: '15px 0' 
        }} />

        {/* Score */}
        <div style={{ fontSize: '28px', color: '#ccc', marginBottom: '15px' }}>
          Score: <span style={{ color: '#fff', fontWeight: 'bold' }}>
            {stats.score?.toLocaleString() || (stats.kills * 50 + Math.floor(stats.time * 10) + stats.level * 500).toLocaleString()}
          </span>
        </div>
        
        {/* Coins */}
        <div style={{ fontSize: '24px', color: '#FFD700' }}>
          💰 Coins Gained: <span style={{ fontWeight: 'bold' }}>
            +{stats.earnedCoins?.toLocaleString() || (stats.kills + Math.floor(stats.time / 5)).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Buttons Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
        {/* Retry - Primary Button */}
        <button
          onClick={onRetry}
          style={{
            padding: '15px',
            fontSize: '20px',
            fontWeight: 'bold',
            background: '#fff',
            color: '#000',
            border: '3px solid #000',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 0 #bbb',
            fontFamily: 'monospace',
            transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.target.style.transform = 'translateY(2px)'}
          onMouseUp={(e) => e.target.style.transform = 'translateY(0)'}
        >
          🔄 Retry
        </button>

        {/* Character Select */}
        <button
          onClick={onCharacterSelect}
          style={{
            padding: '12px',
            fontSize: '18px',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            border: '2px solid #fff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(50,50,50,0.8)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.8)'}
        >
          🎮 Character Select
        </button>

        {/* Main Menu */}
        <button
          onClick={onMenu}
          style={{
            padding: '12px',
            fontSize: '18px',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            border: '2px solid #fff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(50,50,50,0.8)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.8)'}
        >
          🏠 Main Menu
        </button>
      </div>
    </div>
  )
}

export default GameOverScreen
