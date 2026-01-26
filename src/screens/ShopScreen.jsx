import React, { useState, useEffect, useRef } from 'react'
import { SPRITES } from '../constants'
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

const GACHA_COST = 1000

// 가챠 애니메이션 컴포넌트
const GachaAnimation = ({ isPlaying, characters, onComplete, result }) => {
  const [phase, setPhase] = useState('idle') // idle, spinning, reveal
  const [displayIndex, setDisplayIndex] = useState(0)
  const [sparkles, setSparkles] = useState([])
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isPlaying && result) {
      setPhase('spinning')
      let spinSpeed = 50
      let spinCount = 0
      const maxSpins = 30

      const spin = () => {
        setDisplayIndex(prev => (prev + 1) % characters.length)
        spinCount++

        if (spinCount >= maxSpins) {
          clearTimeout(intervalRef.current)
          // 결과 캐릭터로 설정
          const resultIndex = characters.findIndex(c => c.id === result.id)
          setDisplayIndex(resultIndex >= 0 ? resultIndex : 0)
          setPhase('reveal')
          
          // 스파클 효과 생성
          const newSparkles = Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 10 + Math.random() * 20,
            delay: Math.random() * 0.5,
          }))
          setSparkles(newSparkles)
          
          setTimeout(() => {
            onComplete()
            setPhase('idle')
            setSparkles([])
          }, 2000)
        } else {
          // 점점 느려지는 효과
          spinSpeed = 50 + (spinCount / maxSpins) * 200
          intervalRef.current = setTimeout(spin, spinSpeed)
        }
      }

      intervalRef.current = setTimeout(spin, spinSpeed)

      return () => {
        if (intervalRef.current) clearTimeout(intervalRef.current)
      }
    }
  }, [isPlaying, result, characters, onComplete])

  if (!isPlaying && phase === 'idle') return null

  const currentChar = characters[displayIndex]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      {/* 스파클 효과 */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          style={{
            position: 'absolute',
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: sparkle.size,
            height: sparkle.size,
            background: `radial-gradient(circle, ${COLORS.primary}, transparent)`,
            borderRadius: '50%',
            animation: `sparkle 0.5s ease-out ${sparkle.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}

      <style>
        {`
          @keyframes sparkle {
            0% { transform: scale(0); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px ${COLORS.primary}; }
            50% { box-shadow: 0 0 60px ${COLORS.primary}, 0 0 100px ${COLORS.secondary}; }
          }
        `}
      </style>

      {/* 가챠 제목 */}
      <PixelTitle 
        size="large" 
        color={phase === 'reveal' ? COLORS.primary : COLORS.textWhite}
        style={{ marginBottom: '30px' }}
      >
        {phase === 'spinning' ? '🎰 GACHA 🎰' : '✨ NEW CHARACTER ✨'}
      </PixelTitle>

      {/* 캐릭터 카드 */}
      <div style={{
        width: '280px',
        height: '350px',
        background: phase === 'reveal' 
          ? `linear-gradient(180deg, ${currentChar?.color}40, ${COLORS.bgDark})`
          : COLORS.bgLight,
        border: `6px solid ${phase === 'reveal' ? COLORS.primary : COLORS.panelBorder}`,
        boxShadow: phase === 'reveal' 
          ? `0 0 50px ${COLORS.primary}80`
          : '8px 8px 0 0 rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: phase === 'reveal' ? 'glow 1s infinite' : 'none',
        transition: 'all 0.3s ease',
      }}>
        {/* 캐릭터 이미지 */}
        <div style={{
          width: '180px',
          height: '180px',
          background: COLORS.bgDark,
          border: `4px solid ${currentChar?.color || COLORS.panelBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          overflow: 'hidden',
        }}>
          {SPRITES.characters[currentChar?.id] ? (
            <img 
              src={SPRITES.characters[currentChar?.id]} 
              alt={currentChar?.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                imageRendering: 'pixelated',
              }}
            />
          ) : (
            <span style={{ fontSize: '80px' }}>👤</span>
          )}
        </div>

        {/* 캐릭터 이름 */}
        <div style={{
          fontFamily: PIXEL_STYLES.fontFamily,
          fontSize: '24px',
          color: COLORS.textWhite,
          textShadow: '3px 3px 0 #000',
          marginBottom: '10px',
          textAlign: 'center',
        }}>
          {currentChar?.name || '???'}
        </div>

        {/* 캐릭터 설명 */}
        <div style={{
          fontFamily: PIXEL_STYLES.fontFamily,
          fontSize: '12px',
          color: COLORS.textGray,
          textAlign: 'center',
          padding: '0 15px',
        }}>
          {phase === 'reveal' ? currentChar?.description : '...'}
        </div>
      </div>

      {phase === 'reveal' && result && (
        <div style={{
          marginTop: '20px',
          fontFamily: PIXEL_STYLES.fontFamily,
          fontSize: '18px',
          color: COLORS.primary,
          textShadow: '2px 2px 0 #000',
        }}>
          {result.isDuplicate ? `🔥 RANK UP! → RANK ${result.newRank}` : '🎉 NEW!'}
        </div>
      )}
    </div>
  )
}

const ShopScreen = ({ 
  coins, 
  setCoins, 
  shopLevels, 
  setShopLevels, 
  shopUpgrades, 
  characterRanks = {},
  setCharacterRanks,
  characters = [],
  onBack 
}) => {
  const [selectedShopItem, setSelectedShopItem] = useState(null)
  const [activeTab, setActiveTab] = useState('upgrades') // 'upgrades' or 'gacha'
  const [isGachaPlaying, setIsGachaPlaying] = useState(false)
  const [gachaResult, setGachaResult] = useState(null)

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

  // 가챠 뽑기
  const handleGacha = () => {
    if (coins < GACHA_COST || isGachaPlaying || characters.length === 0) return
    
    setCoins(prev => prev - GACHA_COST)
    
    // 1/N 확률로 랜덤 캐릭터 선택
    const randomIndex = Math.floor(Math.random() * characters.length)
    const selectedChar = characters[randomIndex]
    
    const currentRank = characterRanks[selectedChar.id] || 0
    const newRank = currentRank + 1
    const isDuplicate = currentRank > 0
    
    setGachaResult({
      ...selectedChar,
      isDuplicate,
      newRank,
    })
    
    setIsGachaPlaying(true)
  }

  const handleGachaComplete = () => {
    if (gachaResult) {
      setCharacterRanks(prev => ({
        ...prev,
        [gachaResult.id]: gachaResult.newRank
      }))
    }
    setIsGachaPlaying(false)
    setGachaResult(null)
  }

  const canGacha = coins >= GACHA_COST && !isGachaPlaying && characters.length > 0

  const selectedLevel = selectedShopItem ? (shopLevels[selectedShopItem.id] || 0) : 0
  const selectedCost = selectedShopItem ? selectedShopItem.cost * (selectedLevel + 1) : 0
  const canBuy = selectedShopItem && coins >= selectedCost && selectedLevel < selectedShopItem.maxLevel
  const canRefund = selectedShopItem && selectedLevel > 0

  return (
    <ScreenBackground variant="blue">
      {/* 가챠 애니메이션 오버레이 */}
      <GachaAnimation 
        isPlaying={isGachaPlaying}
        characters={characters}
        result={gachaResult}
        onComplete={handleGachaComplete}
      />

      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        padding: '30px',
        gap: '30px',
        boxSizing: 'border-box',
      }}>
        {/* Left - Shop Info (고정 너비) */}
        <PixelPanel style={{ 
          width: '300px', 
          minWidth: '300px',
          maxWidth: '300px',
          flexShrink: 0,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}>
          <PixelTitle size="medium" color={COLORS.primary} style={{ marginBottom: '20px' }}>
            🛒 STORE
          </PixelTitle>
          
          {/* Tab Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', width: '100%' }}>
            <PixelButton
              onClick={() => setActiveTab('upgrades')}
              variant={activeTab === 'upgrades' ? 'primary' : 'ghost'}
              size="small"
              style={{ flex: 1 }}
            >
              UPGRADE
            </PixelButton>
            <PixelButton
              onClick={() => setActiveTab('gacha')}
              variant={activeTab === 'gacha' ? 'primary' : 'ghost'}
              size="small"
              style={{ flex: 1 }}
            >
              GACHA
            </PixelButton>
          </div>
          
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
            <span style={{ fontSize: '120px', filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.3))' }}>
              {activeTab === 'upgrades' ? '🧙' : '🎰'}
            </span>
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
              {activeTab === 'upgrades' 
                ? '"어서오게, 여행자여!\n무엇이 필요한가?"'
                : '"운을 시험해 볼텐가?\n1000 코인이면 돼!"'}
            </p>
          </PixelPanel>
          
          {/* Coins at bottom */}
          <div style={{ marginTop: 'auto' }}>
            <CoinDisplay coins={coins} />
          </div>
        </PixelPanel>

        {/* Right - Content (flex: 1로 남은 공간 차지) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {activeTab === 'upgrades' ? (
            <>
              {/* Items Grid */}
              <PixelPanel style={{ marginBottom: '20px', flex: '0 0 auto' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
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
                style={{ marginBottom: '20px', minHeight: '120px', flex: '0 0 auto' }}
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
                    <div style={{ flex: 1, minWidth: 0 }}>
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
              <div style={{ display: 'flex', gap: '15px', marginTop: 'auto' }}>
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
            </>
          ) : (
            <>
              {/* Gacha Tab Content */}
              <PixelPanel style={{ marginBottom: '20px', flex: '0 0 auto' }}>
                <PixelTitle size="small" color={COLORS.secondary} style={{ marginBottom: '15px', textAlign: 'center' }}>
                  🎰 CHARACTER GACHA 🎰
                </PixelTitle>
                
                <div style={{
                  fontFamily: PIXEL_STYLES.fontFamily,
                  fontSize: '14px',
                  color: COLORS.textGray,
                  textAlign: 'center',
                  marginBottom: '20px',
                }}>
                  1000 코인으로 랜덤 캐릭터를 뽑으세요!<br/>
                  중복 시 RANK UP → 스탯 +1%
                </div>

                {/* Character Grid with Ranks */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', 
                  gap: '10px',
                  marginBottom: 0,
                }}>
                  {characters.map((char) => {
                    const rank = characterRanks[char.id] || 0
                    const bonusPercent = rank * 1
                    
                    return (
                      <div
                        key={char.id}
                        style={{
                          background: rank > 0 
                            ? `linear-gradient(180deg, ${char.color}40, ${COLORS.bgDark})`
                            : COLORS.bgLight,
                          border: `3px solid ${rank > 0 ? char.color : COLORS.panelBorder}`,
                          boxShadow: rank > 0 
                            ? `0 0 10px ${char.color}50`
                            : '3px 3px 0 0 rgba(0,0,0,0.5)',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          position: 'relative',
                          minWidth: 0,
                        }}
                      >
                        {/* Character Image */}
                        <div style={{
                          width: '50px',
                          height: '50px',
                          background: COLORS.bgDark,
                          border: `2px solid ${char.color}`,
                          marginBottom: '6px',
                          overflow: 'hidden',
                          opacity: rank > 0 ? 1 : 0.4,
                          flexShrink: 0,
                        }}>
                          {SPRITES.characters[char.id] ? (
                            <img 
                              src={SPRITES.characters[char.id]} 
                              alt={char.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                imageRendering: 'pixelated',
                                filter: rank > 0 ? 'none' : 'grayscale(100%)',
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '24px',
                            }}>👤</div>
                          )}
                        </div>
                        
                        {/* Character Name */}
                        <div style={{
                          fontFamily: PIXEL_STYLES.fontFamily,
                          fontSize: '8px',
                          color: rank > 0 ? COLORS.textWhite : COLORS.textDark,
                          textAlign: 'center',
                          textShadow: '1px 1px 0 #000',
                          marginBottom: '4px',
                          height: '18px',
                          overflow: 'hidden',
                          width: '100%',
                        }}>
                          {char.name}
                        </div>
                        
                        {/* Rank Badge */}
                        <div style={{
                          background: rank > 0 
                            ? `linear-gradient(180deg, ${COLORS.primary}, ${COLORS.primaryDark})`
                            : 'rgba(0,0,0,0.5)',
                          padding: '2px 8px',
                          borderRadius: '2px',
                        }}>
                          <span style={{
                            fontFamily: PIXEL_STYLES.fontFamily,
                            fontSize: '10px',
                            color: COLORS.textWhite,
                            fontWeight: 'bold',
                          }}>
                            {rank > 0 ? `R${rank}` : '-'}
                          </span>
                        </div>
                        
                        {/* Bonus Display */}
                        {rank > 0 && (
                          <div style={{
                            fontFamily: PIXEL_STYLES.fontFamily,
                            fontSize: '9px',
                            color: COLORS.primary,
                            marginTop: '4px',
                          }}>
                            +{bonusPercent}%
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </PixelPanel>

              {/* Gacha Info Panel */}
              <PixelPanel variant="highlight" style={{ marginBottom: '20px', minHeight: '120px', flex: '0 0 auto' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  {/* Gacha Machine Icon */}
                  <div style={{
                    width: '100px',
                    height: '100px',
                    background: `linear-gradient(180deg, ${COLORS.secondary}40, ${COLORS.bgDark})`,
                    border: `4px solid ${COLORS.secondary}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '60px' }}>🎰</span>
                  </div>
                  
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontFamily: PIXEL_STYLES.fontFamily,
                      color: COLORS.textWhite,
                      margin: '0 0 8px',
                      fontSize: '18px',
                      textShadow: '2px 2px 0 #000',
                    }}>
                      캐릭터 가챠
                    </h3>
                    <p style={{
                      fontFamily: PIXEL_STYLES.fontFamily,
                      color: COLORS.textGray,
                      margin: '0 0 10px',
                      fontSize: '12px',
                    }}>
                      모든 캐릭터가 동일한 확률 (1/{characters.length})로 등장합니다.<br/>
                      RANK가 오르면 해당 캐릭터의 모든 스탯이 1%씩 증가합니다!
                    </p>
                    <div style={{
                      fontFamily: PIXEL_STYLES.fontFamily,
                      fontSize: '12px',
                      color: COLORS.primary,
                    }}>
                      보유 캐릭터: {Object.keys(characterRanks).filter(k => characterRanks[k] > 0).length} / {characters.length}
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
                      color: canGacha ? COLORS.primary : COLORS.danger,
                      fontSize: '24px',
                      fontWeight: 'bold',
                      textShadow: '2px 2px 0 #000',
                    }}>
                      💰 {GACHA_COST}
                    </div>
                  </div>
                </div>
              </PixelPanel>

              {/* Gacha Buttons */}
              <div style={{ display: 'flex', gap: '15px', marginTop: 'auto' }}>
                <PixelButton 
                  onClick={handleGacha}
                  disabled={!canGacha}
                  variant="primary"
                  size="large"
                  style={{ flex: 1 }}
                >
                  🎰 PULL GACHA
                </PixelButton>
                <PixelButton 
                  onClick={onBack}
                  variant="ghost"
                  size="medium"
                >
                  ◀ BACK
                </PixelButton>
              </div>
            </>
          )}
        </div>
      </div>
    </ScreenBackground>
  )
}

export default ShopScreen
