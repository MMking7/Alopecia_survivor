import React, { useState } from 'react'
import { 
  ScreenBackground, 
  PixelPanel, 
  PixelButton, 
  PixelTitle,
  CoinDisplay,
  LevelIndicator,
  COLORS,
  PIXEL_STYLES 
} from '../styles/PixelUI'

const ShopScreen = ({ coins, setCoins, shopLevels, setShopLevels, shopUpgrades, onBack }) => {
  const [selectedShopItem, setSelectedShopItem] = useState(null)

  const handleBuy = () => {
    if (!selectedShopItem) return
    const level = shopLevels[selectedShopItem.id] || 0
    const cost = selectedShopItem.cost * (level + 1)
    if (coins >= cost && level < selectedShopItem.maxLevel) {
      setCoins(prev => prev - cost)
      setShopLevels(prev => ({ ...prev, [selectedShopItem.id]: level + 1 }))
    }
  }

  const handleRefund = () => {
    if (!selectedShopItem) return
    const level = shopLevels[selectedShopItem.id] || 0
    if (level > 0) {
      const refund = Math.floor(selectedShopItem.cost * level * 0.8)
      setCoins(prev => prev + refund)
      setShopLevels(prev => ({ ...prev, [selectedShopItem.id]: level - 1 }))
    }
  }

  const selectedLevel = selectedShopItem ? (shopLevels[selectedShopItem.id] || 0) : 0
  const selectedCost = selectedShopItem ? selectedShopItem.cost * (selectedLevel + 1) : 0
  const canBuy = selectedShopItem && coins >= selectedCost && selectedLevel < selectedShopItem.maxLevel
  const canRefund = selectedShopItem && selectedLevel > 0

  return (
    <ScreenBackground variant="blue">
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        padding: '30px',
        gap: '30px',
        boxSizing: 'border-box',
      }}>
        {/* Left - Shop Info */}
        <PixelPanel style={{ width: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <PixelTitle size="medium" color={COLORS.primary} style={{ marginBottom: '20px' }}>
            🛒 STORE
          </PixelTitle>
          
          {/* Shop NPC */}
          <div style={{
            width: '180px',
            height: '180px',
            background: COLORS.bgLight,
            border: `4px solid ${COLORS.panelBorder}`,
            boxShadow: '4px 4px 0 0 rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}>
            <span style={{ fontSize: '120px', filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.3))' }}>🧙</span>
          </div>
          
          {/* Shop Message */}
          <PixelPanel variant="dark" style={{ width: '100%', textAlign: 'center' }}>
            <p style={{
              fontFamily: PIXEL_STYLES.fontFamily,
              color: COLORS.textGray,
              fontSize: '12px',
              margin: 0,
              lineHeight: 1.6,
            }}>
              "어서오게, 여행자여!<br/>
              무엇이 필요한가?"
            </p>
          </PixelPanel>
          
          {/* Coins at bottom */}
          <div style={{ marginTop: 'auto' }}>
            <CoinDisplay coins={coins} />
          </div>
        </PixelPanel>

        {/* Right - Items */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Items Grid */}
          <PixelPanel style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: '15px',
            }}>
              {shopUpgrades.map((item) => {
                const level = shopLevels[item.id] || 0
                const isMaxed = level >= item.maxLevel
                const isSelected = selectedShopItem?.id === item.id
                
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedShopItem(item)}
                    style={{
                      minWidth: '95px',
                      height: '120px',
                      background: isSelected 
                        ? `linear-gradient(180deg, ${COLORS.secondary}30, ${COLORS.bgDark})`
                        : COLORS.bgLight,
                      border: `4px solid ${isSelected ? COLORS.secondary : COLORS.panelBorder}`,
                      boxShadow: isSelected 
                        ? `0 0 15px ${COLORS.secondary}40, 4px 4px 0 0 rgba(0,0,0,0.5)`
                        : '4px 4px 0 0 rgba(0,0,0,0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.1s ease',
                      padding: '10px 6px',
                    }}
                  >
                    <span style={{ fontSize: '36px', marginBottom: '6px' }}>{item.icon}</span>
                    
                    {/* Item Name */}
                    <div style={{
                      fontFamily: PIXEL_STYLES.fontFamily,
                      fontSize: '9px',
                      color: COLORS.textWhite,
                      textAlign: 'center',
                      marginBottom: '8px',
                      lineHeight: 1.2,
                      textShadow: '1px 1px 0 #000',
                      width: '100%',
                      padding: '0 2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {item.name}
                    </div>
                    
                    {/* Level Progress Bar */}
                    <div style={{
                      width: '70px',
                      height: '12px',
                      background: 'rgba(0,0,0,0.6)',
                      border: `2px solid ${COLORS.panelBorder}`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${(level / item.maxLevel) * 100}%`,
                        background: isMaxed 
                          ? `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.primaryDark})`
                          : `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.secondaryDark})`,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    {/* Level Text */}
                    <span style={{
                      fontFamily: PIXEL_STYLES.fontFamily,
                      fontSize: '11px',
                      color: isMaxed ? COLORS.primary : COLORS.textWhite,
                      fontWeight: 'bold',
                      textShadow: '1px 1px 0 #000',
                      marginTop: '4px',
                    }}>
                      {level}/{item.maxLevel}
                    </span>
                  </div>
                )
              })}
            </div>
          </PixelPanel>

          {/* Item Description */}
          <PixelPanel 
            variant={selectedShopItem ? 'highlight' : 'default'} 
            style={{ marginBottom: '20px', minHeight: '120px' }}
          >
            {selectedShopItem ? (
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {/* Icon */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: COLORS.bgLight,
                  border: `4px solid ${COLORS.panelBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '48px' }}>{selectedShopItem.icon}</span>
                </div>
                
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontFamily: PIXEL_STYLES.fontFamily,
                    color: COLORS.textWhite,
                    margin: '0 0 8px',
                    fontSize: '18px',
                    textShadow: '2px 2px 0 #000',
                  }}>
                    {selectedShopItem.name}
                  </h3>
                  <p style={{
                    fontFamily: PIXEL_STYLES.fontFamily,
                    color: COLORS.textGray,
                    margin: '0 0 10px',
                    fontSize: '12px',
                  }}>
                    {selectedShopItem.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{
                      fontFamily: PIXEL_STYLES.fontFamily,
                      color: selectedLevel >= selectedShopItem.maxLevel ? COLORS.primary : COLORS.textGray,
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}>
                      Level: {selectedLevel} / {selectedShopItem.maxLevel}
                      {selectedLevel >= selectedShopItem.maxLevel && ' (MAX)'}
                    </span>
                  </div>
                </div>
                
                {/* Cost */}
                <div style={{
                  textAlign: 'right',
                  flexShrink: 0,
                }}>
                  <div style={{
                    fontFamily: PIXEL_STYLES.fontFamily,
                    color: COLORS.textGray,
                    fontSize: '12px',
                    marginBottom: '5px',
                  }}>
                    COST
                  </div>
                  <div style={{
                    fontFamily: PIXEL_STYLES.fontFamily,
                    color: canBuy ? COLORS.primary : COLORS.danger,
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textShadow: '2px 2px 0 #000',
                  }}>
                    💰 {selectedLevel >= selectedShopItem.maxLevel ? '---' : selectedCost}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '80px',
              }}>
                <p style={{
                  fontFamily: PIXEL_STYLES.fontFamily,
                  color: COLORS.textDark,
                  fontSize: '14px',
                }}>
                  아이템을 선택하세요
                </p>
              </div>
            )}
          </PixelPanel>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <PixelButton 
              onClick={handleBuy}
              disabled={!canBuy}
              variant="primary"
              size="large"
              style={{ flex: 1 }}
            >
              💰 BUY
            </PixelButton>
            <PixelButton 
              onClick={handleRefund}
              disabled={!canRefund}
              variant="danger"
              size="medium"
            >
              ↩ REFUND
            </PixelButton>
            <PixelButton 
              onClick={onBack}
              variant="ghost"
              size="medium"
            >
              ◀ BACK
            </PixelButton>
          </div>
        </div>
      </div>
    </ScreenBackground>
  )
}

export default ShopScreen
