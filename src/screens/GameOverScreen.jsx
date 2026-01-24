import React from 'react'

const GameOverScreen = ({ stats, onRetry, onMenu }) => {
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
          padding: '20px 40px',
          borderRadius: '12px',
          marginBottom: '40px',
          textAlign: 'center',
          border: '2px solid #444'
        }}>
          <div style={{ fontSize: '24px', color: '#ccc', marginBottom: '10px' }}>
            Score: <span style={{ color: '#fff', fontWeight: 'bold' }}>{(stats.kills * 50 + stats.time * 10 + stats.level * 500).toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '24px', color: '#FFD700' }}>
            HoloCoins Gained: <span style={{ fontWeight: 'bold' }}>+{(stats.kills + Math.floor(stats.time / 5)).toLocaleString()}</span>
          </div>
        </div>

        {/* Buttons Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '300px' }}>
          {/* Retry - White Button */}
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
                  fontFamily: 'monospace'
              }}
          >
              Retry
          </button>

          {/* Character Select - Dark Button */}
          <button
              // Assuming this might be handled via onMenu or a separate onCharacterSelect prop if desired,
              // but for now let's say "Character Select" goes to char select screen.
              // Logic for routing should be in App.jsx handlers.
              // Wait, the original code had three buttons: Retry, Character Select, Main Menu.
              // I will expose onCharacterSelect prop or just reuse onMenu if simplest?
              // No, let's add onCharacterSelect prop to be explicit.
              onClick={onMenu} // Temporary placeholder if prop missing, but ideally passed
              style={{
                  padding: '12px',
                  fontSize: '18px',
                  background: 'rgba(0,0,0,0.8)',
                  color: '#fff',
                  border: '2px solid #fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  display: 'none' // Hiding this for a sec as I didn't add it to props yet, or should I?
              }}
          >
              Character Select
          </button>
          
          {/* Correction: I should add onCharacterSelect prop */}
        </div>
    </div>
  )
}

// Re-writing the component with correct props
const RealGameOverScreen = ({ stats, onRetry, onCharacterSelect, onMenu }) => {
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
            padding: '20px 40px',
            borderRadius: '12px',
            marginBottom: '40px',
            textAlign: 'center',
            border: '2px solid #444'
          }}>
            <div style={{ fontSize: '24px', color: '#ccc', marginBottom: '10px' }}>
              Score: <span style={{ color: '#fff', fontWeight: 'bold' }}>{(stats.kills * 50 + stats.time * 10 + stats.level * 500).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: '24px', color: '#FFD700' }}>
              HoloCoins Gained: <span style={{ fontWeight: 'bold' }}>+{(stats.kills + Math.floor(stats.time / 5)).toLocaleString()}</span>
            </div>
          </div>
  
          {/* Buttons Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '300px' }}>
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
                    fontFamily: 'monospace'
                }}
            >
                Retry
            </button>
  
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
                    fontFamily: 'monospace'
                }}
            >
                Character Select
            </button>
  
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
                    fontFamily: 'monospace'
                }}
            >
                Main Menu
            </button>
          </div>
      </div>
    )
  }

export default RealGameOverScreen
