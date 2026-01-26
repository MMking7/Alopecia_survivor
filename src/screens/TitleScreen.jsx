import React from 'react'
import { SPRITES } from '../constants'
import { 
  PixelPanel, 
  PixelButton, 
  CoinDisplay,
  COLORS,
  PIXEL_STYLES 
} from '../styles/PixelUI'

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
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: '40px',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Scanline overlay for retro effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 4px)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Coins display - top right */}
      <div style={{ position: 'absolute', top: '30px', right: '30px', zIndex: 2 }}>
        <CoinDisplay coins={coins} />
      </div>
      
      {/* Main Buttons Container */}
      <div style={{ 
        marginBottom: '50px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px', 
        alignItems: 'center',
        zIndex: 2,
      }}>
        {/* Start Button */}
        <PixelButton 
          onClick={onStart} 
          variant="primary" 
          size="large"
          style={{ minWidth: '280px' }}
        >
          ▶ GAME START
        </PixelButton>

        {/* Menu Row */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <PixelButton onClick={onShop} variant="dark" size="medium">
            🛒 STORE
          </PixelButton>
          <PixelButton variant="ghost" size="medium" disabled>
            ⚙️ SETTING
          </PixelButton>
          <PixelButton variant="ghost" size="medium" disabled>
            📜 CREDIT
          </PixelButton>
        </div>
      </div>

      {/* Version */}
      <div style={{ 
        position: 'absolute', 
        bottom: '15px', 
        right: '20px', 
        fontFamily: PIXEL_STYLES.fontFamily,
        fontSize: '12px',
        color: COLORS.textGray,
        textShadow: '2px 2px 0 #000',
        zIndex: 2,
      }}>
        Ver 1.0.0
      </div>
    </div>
  )
}

export default TitleScreen
