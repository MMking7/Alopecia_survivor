import React from 'react'
import { SPRITES, CHARACTERS } from '../constants'

const TitleScreen = ({ onStart, onShop, coins }) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundImage: `url(${SPRITES.ui.menu})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end', // Buttons at bottom
      alignItems: 'center',
      padding: '40px',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      
      {/* Start Button at Bottom Center */}
      <div style={{ marginBottom: '50px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
        <button
            onClick={onStart}
            style={{
              padding: '20px 60px',
              fontSize: '32px',
              fontWeight: 'bold',
              background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)',
              color: '#fff',
              border: '4px solid #fff',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 10px 0 #D35400, 0 10px 20px rgba(0,0,0,0.5)',
              textShadow: '2px 2px 0 rgba(0,0,0,0.2)',
              fontFamily: '"NeoDunggeunmo", "Press Start 2P", cursive',
              transform: 'scale(1)',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
        >
            GAME START
        </button>

        {/* Small Menu Row */}
        <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={onShop} style={smallBtnStyle}>STORE</button>
            <button style={smallBtnStyle} disabled>SETTING</button>
            <button style={smallBtnStyle} disabled>CREDIT</button>
        </div>
      </div>

      {/* Version */}
      <div style={{ position: 'absolute', bottom: '10px', right: '20px', color: '#fff', fontWeight: 'bold', textShadow: '2px 2px 0 #000' }}>
        Ver 1.0.0
      </div>

      {/* Coins display */}
      <div style={{
        position: 'absolute',
        top: '30px',
        right: '30px',
        background: 'rgba(0,0,0,0.6)',
        padding: '10px 20px',
        borderRadius: '30px',
        color: '#FFD700',
        fontSize: '24px',
        fontWeight: 'bold',
        border: '2px solid #fff'
      }}>
        💰 {coins.toLocaleString()}
      </div>
    </div>
  )
}

const smallBtnStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    border: '2px solid #fff',
    borderRadius: '20px',
    cursor: 'pointer',
    fontFamily: '"NeoDunggeunmo", sans-serif',
    fontWeight: 'bold'
}

export default TitleScreen
