import React from 'react'
import { SPRITES } from '../constants'
import { 
  ScreenBackground, 
  PixelPanel, 
  PixelButton, 
  PixelTitle,
  CoinDisplay,
  StatBar,
  COLORS,
  PIXEL_STYLES 
} from '../styles/PixelUI'

const CharacterSelectScreen = ({ characters, selectedCharacter, onSelect, onStart, onBack, imagesLoaded, characterProgress, coins }) => {

  return (
    <ScreenBackground variant="dark">
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        padding: '30px',
        gap: '30px',
        boxSizing: 'border-box',
      }}>
        {/* Left - Selected Character Detail */}
        <PixelPanel style={{ width: '320px', display: 'flex', flexDirection: 'column' }}>
          {selectedCharacter ? (
            <>
              {/* Character Portrait */}
              <div style={{
                width: '200px',
                height: '200px',
                margin: '0 auto 20px',
                background: `linear-gradient(135deg, ${selectedCharacter.color}30, ${COLORS.bgDark})`,
                border: `4px solid ${selectedCharacter.color}`,
                boxShadow: `4px 4px 0 0 rgba(0,0,0,0.5), inset 0 0 30px ${selectedCharacter.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <img 
                  src={SPRITES.characters[selectedCharacter.id]} 
                  alt="" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                  }} 
                />
              </div>
              
              {/* Character Name */}
              <h2 style={{ 
                fontFamily: PIXEL_STYLES.fontFamily,
                color: COLORS.textWhite, 
                textAlign: 'center', 
                margin: '0 0 5px',
                fontSize: '20px',
                textShadow: '2px 2px 0 #000',
              }}>
                {selectedCharacter.name}
              </h2>
              <p style={{ 
                fontFamily: PIXEL_STYLES.fontFamily,
                color: selectedCharacter.color, 
                textAlign: 'center', 
                fontWeight: 'bold', 
                margin: '0 0 20px',
                fontSize: '14px',
              }}>
                🗡️ {selectedCharacter.weapon}
              </p>
              
              {/* Stats */}
              <PixelPanel variant="dark" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <StatBar icon="❤️" label="HP" value={selectedCharacter.baseStats.hp} color={COLORS.hp} />
                  <StatBar icon="⚔️" label="ATK" value={selectedCharacter.baseStats.damage} color={COLORS.atk} />
                  <StatBar icon="🏃" label="SPD" value={selectedCharacter.baseStats.speed} color={COLORS.spd} />
                  <StatBar icon="💥" label="CRT" value={`${(selectedCharacter.baseStats.crit * 100)}%`} color={COLORS.crit} />
                  <StatBar icon="⚡" label="HASTE" value={selectedCharacter.baseStats.attackSpeed} color={COLORS.warning} />
                </div>
              </PixelPanel>
              
              {/* Coins */}
              <div style={{ 
                marginTop: 'auto', 
                paddingTop: '15px',
                display: 'flex',
                justifyContent: 'center',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.5)',
                  border: `2px solid ${COLORS.panelBorder}`,
                  padding: '8px 15px',
                }}>
                  <span style={{ fontSize: '20px' }}>💰</span>
                  <span style={{
                    fontFamily: PIXEL_STYLES.fontFamily,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: COLORS.primary,
                    textShadow: '1px 1px 0 #000',
                  }}>
                    {coins.toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '20px',
            }}>
              <span style={{ fontSize: '64px', opacity: 0.3 }}>❓</span>
              <p style={{ 
                fontFamily: PIXEL_STYLES.fontFamily,
                color: COLORS.textDark, 
                textAlign: 'center',
                fontSize: '14px',
              }}>
                캐릭터를 선택하세요
              </p>
            </div>
          )}
        </PixelPanel>

        {/* Right - Character Grid */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Title */}
          <div style={{ marginBottom: '25px' }}>
            <PixelTitle size="medium" color={COLORS.primary}>
              🎮 CHARACTER SELECT
            </PixelTitle>
          </div>
          
          {/* Character Grid */}
          <PixelPanel style={{ flex: 1, marginBottom: '20px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '15px',
            }}>
              {characters.map((char) => {
                const isSelected = selectedCharacter?.id === char.id
                return (
                  <div
                    key={char.id}
                    onClick={() => onSelect(char)}
                    style={{
                      background: isSelected 
                        ? `linear-gradient(135deg, ${char.color}40, ${char.color}10)` 
                        : COLORS.bgLight,
                      border: `4px solid ${isSelected ? char.color : COLORS.panelBorder}`,
                      boxShadow: isSelected 
                        ? `0 0 20px ${char.color}40, 4px 4px 0 0 rgba(0,0,0,0.5)`
                        : '4px 4px 0 0 rgba(0,0,0,0.5)',
                      padding: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                    }}
                  >
                    {/* Character Image */}
                    <div style={{ 
                      width: '70px', 
                      height: '70px', 
                      margin: '0 auto 10px', 
                      background: 'rgba(0,0,0,0.4)',
                      border: '2px solid rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                    }}>
                      <img 
                        src={SPRITES.characters[char.id]} 
                        alt={char.name} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          imageRendering: 'pixelated',
                        }} 
                      />
                    </div>
                    <h3 style={{ 
                      fontFamily: PIXEL_STYLES.fontFamily,
                      color: COLORS.textWhite, 
                      margin: '0 0 5px', 
                      fontSize: '12px',
                      textShadow: '1px 1px 0 #000',
                    }}>
                      {char.name}
                    </h3>
                    <p style={{ 
                      fontFamily: PIXEL_STYLES.fontFamily,
                      color: char.color, 
                      margin: 0, 
                      fontSize: '10px',
                    }}>
                      {char.weapon}
                    </p>
                  </div>
                )
              })}
            </div>
          </PixelPanel>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <PixelButton onClick={onBack} variant="ghost" size="medium">
              ◀ BACK
            </PixelButton>
            <PixelButton 
              onClick={onStart} 
              disabled={!selectedCharacter || !imagesLoaded}
              variant="primary"
              size="large"
              style={{ flex: 1 }}
            >
              {!imagesLoaded ? '⏳ LOADING...' : '▶ START GAME'}
            </PixelButton>
          </div>
        </div>
      </div>
    </ScreenBackground>
  )
}

export default CharacterSelectScreen
