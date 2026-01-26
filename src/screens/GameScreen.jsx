import React from 'react'
import { GAME_CONFIG, SPRITES } from '../constants'
import { getMainWeapon, getPassiveSkills, getSpecialAbility } from '../MainWeapons'
import { useGameEngine } from '../game/adapters/react/useGameEngine'
import { formatTime } from '../game/domain/xp'
import { COLORS, PIXEL_STYLES } from '../styles/PixelUI'
import autoAimCursor from '../assets/cursors/auto_aim.png'
import manualAimCursor from '../assets/cursors/manual_aim.png'

const GameScreen = ({
  selectedCharacter,
  shopLevels,
  characterRanks = {},
  characterProgress,
  loadedImages,
  onGameOver,
  onQuit,
}) => {
  const {
    canvasRef,
    gameStateRef,
    gamePhase,
    setGamePhase,
    displayStats,
    levelUpOptions,
    pauseTab,
    setPauseTab,
    handleUpgrade,
    handleQuit,
  } = useGameEngine({
    selectedCharacter,
    shopLevels,
    characterRanks,
    characterProgress,
    loadedImages,
    onGameOver,
    onQuit,
  })

  const mainWeapon = getMainWeapon(selectedCharacter?.id)
  const mainWeaponLevel = gameStateRef.current?.mainWeaponLevel || 1
  const mainWeaponIconKey = selectedCharacter?.id
    ? (mainWeaponLevel >= (mainWeapon?.maxLevel || 7)
      ? `${selectedCharacter.id}_gaksung`
      : `${selectedCharacter.id}_mainattack`)
    : null
  const mainWeaponEntry = mainWeapon ? {
    id: mainWeapon.id,
    name: mainWeapon.name,
    description: mainWeapon.description,
    iconKey: mainWeaponIconKey,
    level: mainWeaponLevel,
    maxLevel: mainWeapon.maxLevel || 7,
    category: 'main',
  } : null
  const passiveSkillDefs = getPassiveSkills(selectedCharacter?.id)
  const passiveSkillEntries = (gameStateRef.current?.passiveSkills || []).map((skill) => {
    const def = passiveSkillDefs.find((entry) => entry.id === skill.id)
    return {
      id: skill.id,
      name: def?.name || skill.name,
      description: def?.description || '',
      iconKey: def?.icon || skill.id,
      level: skill.level || 1,
      maxLevel: def?.maxLevel || skill.maxLevel || 1,
      category: 'passive',
    }
  })
  const inventoryEntries = (gameStateRef.current?.inventory || []).map((item) => ({
    ...item,
    level: item.level || 1,
    category: item.isSubWeapon ? 'subweapon' : 'item',
  }))
  const selectionCount = (mainWeaponEntry ? 1 : 0) + passiveSkillEntries.length + inventoryEntries.length
  const selectionSections = [
    {
      id: 'main',
      title: 'MAIN WEAPON',
      entries: mainWeaponEntry ? [mainWeaponEntry] : [],
      emptyText: 'Main weapon missing.',
    },
    {
      id: 'passive',
      title: 'PASSIVE SKILLS',
      entries: passiveSkillEntries,
      emptyText: 'No passive skills yet.',
    },
    {
      id: 'inventory',
      title: 'ITEMS',
      entries: inventoryEntries,
      emptyText: 'No items collected yet.',
    },
  ]

  const renderSelectionEntry = (entry, idx) => {
    const isMainWeapon = entry.category === 'main'
    const isPassiveSkill = entry.category === 'passive'
    const isSubWeapon = entry.category === 'subweapon'
    const accentColor = isSubWeapon
      ? COLORS.primary
      : (isMainWeapon || isPassiveSkill)
        ? COLORS.warning
        : COLORS.panelBorder
    const badgeText = isMainWeapon ? 'MAIN' : isPassiveSkill ? 'SKILL' : isSubWeapon ? 'WPN' : null
    const abilityIcon = (isMainWeapon || isPassiveSkill) && entry.iconKey
      ? SPRITES.abilities?.[entry.iconKey]
      : null
    const subweaponIcon = isSubWeapon ? SPRITES.subweapons?.[entry.icon] : null
    const itemIcon = (!isMainWeapon && !isPassiveSkill && !isSubWeapon)
      ? SPRITES.items?.[entry.icon]
      : null
    const fallbackLetter = isMainWeapon ? 'W' : isPassiveSkill ? 'S' : isSubWeapon ? 'W' : 'I'

    return (
      <div
        key={`${entry.id}-${idx}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 10px',
          background: isSubWeapon
            ? `linear-gradient(90deg, rgba(255,215,0,0.1) 0%, ${COLORS.bgLight} 100%)`
            : COLORS.bgLight,
          border: `2px solid ${accentColor}`,
          boxShadow: '2px 2px 0 0 rgba(0,0,0,0.3)',
        }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          background: COLORS.bgDark,
          border: `2px solid ${accentColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '10px',
          flexShrink: 0,
        }}>
          {abilityIcon ? (
            <img src={abilityIcon} alt="" style={{ width: '22px', height: '22px', imageRendering: 'pixelated', objectFit: 'contain' }} />
          ) : isSubWeapon ? (
            subweaponIcon ? (
              <img src={subweaponIcon} alt="" style={{ width: '22px', height: '22px', imageRendering: 'pixelated', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '16px' }}>{fallbackLetter}</span>
            )
          ) : itemIcon ? (
            <img src={itemIcon} alt="" style={{ width: '20px', height: '20px', imageRendering: 'pixelated' }} />
          ) : (
            <span style={{ fontSize: '16px' }}>{fallbackLetter}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: PIXEL_STYLES.fontFamily,
            fontWeight: 'bold',
            color: isSubWeapon ? COLORS.primary : (isMainWeapon || isPassiveSkill) ? COLORS.warning : COLORS.textWhite,
            fontSize: '11px',
            textShadow: '1px 1px 0 #000',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            {entry.name}
            {badgeText && (
              <span style={{
                fontSize: '8px',
                color: COLORS.bgDark,
                background: isSubWeapon ? COLORS.primary : COLORS.warning,
                padding: '1px 4px',
              }}>{badgeText}</span>
            )}
          </div>
          <div style={{
            fontFamily: PIXEL_STYLES.fontFamily,
            fontSize: '9px',
            color: COLORS.textGray,
            marginTop: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {entry.description}
          </div>
        </div>
        <div style={{
          fontFamily: PIXEL_STYLES.fontFamily,
          fontSize: '10px',
          color: accentColor,
          fontWeight: 'bold',
          background: 'rgba(0,0,0,0.4)',
          padding: '2px 6px',
          marginLeft: '8px',
        }}>
          LV{entry.level || 1}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      cursor: `url(${displayStats.aimMode === 'manual' ? manualAimCursor : autoAimCursor}) 16 16, auto`
    }}>
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.CANVAS_WIDTH}
        height={GAME_CONFIG.CANVAS_HEIGHT}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />

      {/* XP Bar - Top Full Width */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '12px',
        background: 'rgba(13, 13, 26, 0.95)',
        borderBottom: `3px solid ${COLORS.panelBorder}`,
        boxShadow: '0 3px 0 0 rgba(0,0,0,0.5)',
        zIndex: 100,
      }}>
        <div style={{
          width: `${Math.min(100, (displayStats.xp / displayStats.xpNeeded) * 100)}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.secondaryDark})`,
          transition: 'width 0.3s ease',
          boxShadow: `inset 0 0 10px ${COLORS.secondary}80`,
        }} />
      </div>

      {/* HUD - Top Bar */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: 0,
        right: 0,
        padding: '10px 15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        pointerEvents: 'none',
      }}>
        {/* Left HUD Group */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
          pointerEvents: 'auto',
        }}>
          {/* Character Portrait + Skill Icon */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Portrait */}
            <div style={{
              background: 'rgba(13, 13, 26, 0.9)',
              border: `3px solid ${COLORS.panelBorder}`,
              boxShadow: '3px 3px 0 0 rgba(0,0,0,0.5)',
              padding: '6px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: COLORS.bgLight,
                border: `2px solid ${selectedCharacter?.color || COLORS.panelBorder}`,
                overflow: 'hidden',
              }}>
                <img
                  src={SPRITES.characters[selectedCharacter?.id]}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
                />
              </div>
            </div>

            {/* Special Ability Icon (Below Portrait) */}
            {(() => {
              const ability = getSpecialAbility(selectedCharacter?.id)
              if (!ability) return null

              const lastUsedGameTime = displayStats.specialAbilityLastUsed
              const currentGameTime = displayStats.currentGameTime || 0
              // 아직 한 번도 사용 안 했으면 쿨타임 없음 (lastUsedGameTime이 0)
              const hasBeenUsed = lastUsedGameTime > 0
              const timeSinceLastUse = hasBeenUsed ? (currentGameTime - lastUsedGameTime) * 1000 : Infinity // 초 → 밀리초
              const cooldownRemaining = hasBeenUsed ? Math.max(0, ability.cooldown - timeSinceLastUse) : 0
              const isOnCooldown = cooldownRemaining > 0
              const cooldownPercent = isOnCooldown ? (cooldownRemaining / ability.cooldown) * 100 : 0
              const cooldownSeconds = Math.ceil(cooldownRemaining / 1000)
              
              // 모근 부족 체크 (탈모의사 전용)
              const minFragments = ability.minFragments || 0
              const currentFragments = displayStats.fragments || 0
              const needsMoreFragments = minFragments > 0 && currentFragments < minFragments
              
              // 사용 불가 상태: 쿨타임 중이거나 모근 부족
              const isDisabled = isOnCooldown || needsMoreFragments
              
              // Build icon path
              const iconPath = SPRITES.abilities?.[`${selectedCharacter.id}_ability`]

              return (
                <div style={{
                  background: 'rgba(13, 13, 26, 0.9)',
                  border: `2px solid ${isDisabled ? COLORS.panelBorder : COLORS.warning}`,
                  boxShadow: isDisabled ? '2px 2px 0 0 rgba(0,0,0,0.5)' : `0 0 8px ${COLORS.warning}80`,
                  padding: '3px',
                  position: 'relative',
                  width: '36px',
                  height: '36px',
                  alignSelf: 'center',
                }}>
                  {/* Ability Icon */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: isDisabled ? 'brightness(0.3)' : 'none',
                  }}>
                    {iconPath && loadedImages[iconPath] ? (
                      <img
                        src={iconPath}
                        alt="Special"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          imageRendering: 'pixelated',
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '18px' }}>⚡</span>
                    )}
                  </div>

                  {/* Cooldown Overlay */}
                  {isOnCooldown && (
                    <>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: `conic-gradient(
                          transparent ${100 - cooldownPercent}%, 
                          rgba(0, 0, 0, 0.7) ${100 - cooldownPercent}%
                        )`,
                        pointerEvents: 'none',
                      }} />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: PIXEL_STYLES.fontFamily,
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: COLORS.textWhite,
                        textShadow: '1px 1px 0 #000, -1px -1px 0 #000',
                      }}>
                        {cooldownSeconds}
                      </div>
                    </>
                  )}
                  
                  {/* 모근 부족 Overlay */}
                  {needsMoreFragments && !isOnCooldown && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(139, 0, 0, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                    }}>
                      <span style={{
                        fontFamily: PIXEL_STYLES.fontFamily,
                        fontSize: '8px',
                        fontWeight: 'bold',
                        color: COLORS.textWhite,
                        textShadow: '1px 1px 0 #000',
                        textAlign: 'center',
                        lineHeight: '1.1',
                      }}>
                        모근<br/>부족
                      </span>
                    </div>
                  )}
                  
                  {/* Shift Key Hint or Fragment requirement */}
                  {!isOnCooldown && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-14px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontFamily: PIXEL_STYLES.fontFamily,
                      fontSize: '8px',
                      color: needsMoreFragments ? COLORS.danger : COLORS.warning,
                      textShadow: '1px 1px 0 #000',
                      whiteSpace: 'nowrap',
                    }}>
                      {needsMoreFragments ? `${currentFragments}/${minFragments}` : 'Shift'}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* HP Bar */}
          <div style={{
            background: 'rgba(13, 13, 26, 0.9)',
            border: `3px solid ${COLORS.panelBorder}`,
            boxShadow: '3px 3px 0 0 rgba(0,0,0,0.5)',
            padding: '8px 12px',
          }}>
            <div style={{
              fontFamily: PIXEL_STYLES.fontFamily,
              color: COLORS.textWhite,
              fontSize: '13px',
              marginBottom: '4px',
              textShadow: '1px 1px 0 #000',
              whiteSpace: 'nowrap',
            }}>
              ❤️ {displayStats.hp}/{displayStats.maxHp}
              {displayStats.shield > 0 && <span style={{ color: COLORS.secondary }}> 🛡️{displayStats.shield}</span>}
            </div>
            <div style={{
              width: 'clamp(100px, 15vw, 180px)',
              height: '12px',
              background: COLORS.bgDark,
              border: `2px solid ${COLORS.panelBorder}`,
            }}>
              <div style={{
                width: `${Math.min(100, (displayStats.hp / displayStats.maxHp) * 100)}%`,
                height: '100%',
                background: displayStats.hp > displayStats.maxHp * 0.3 ? COLORS.hp : '#8b0000',
                transition: 'width 0.2s',
              }} />
            </div>
          </div>

          {/* Fragment Counter (Talmo Docter only) */}
          {selectedCharacter?.id === 'talmo_docter' && (
            <div style={{
              background: 'rgba(13, 13, 26, 0.9)',
              border: `3px solid ${COLORS.panelBorder}`,
              boxShadow: '3px 3px 0 0 rgba(0,0,0,0.5)',
              padding: '8px 12px',
              minWidth: '100px',
            }}>
              <div style={{
                fontFamily: PIXEL_STYLES.fontFamily,
                color: COLORS.textWhite,
                fontSize: '13px',
                marginBottom: '4px',
                textShadow: '1px 1px 0 #000',
                whiteSpace: 'nowrap',
              }}>
                🧬 모근조각
              </div>
              <div style={{
                fontFamily: PIXEL_STYLES.fontFamily,
                color: displayStats.fragments >= 30 ? COLORS.primary : COLORS.textGray,
                fontSize: '16px',
                fontWeight: 'bold',
                textShadow: '1px 1px 0 #000',
              }}>
                {displayStats.fragments || 0} / 50
                {displayStats.fragments >= 30 && (
                  <span style={{ marginLeft: '5px', fontSize: '12px', color: COLORS.warning }}>
                    ⚡
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right HUD Group */}
        <div style={{
          background: 'rgba(13, 13, 26, 0.9)',
          border: `3px solid ${COLORS.panelBorder}`,
          boxShadow: '3px 3px 0 0 rgba(0,0,0,0.5)',
          padding: '8px 12px',
          textAlign: 'right',
          pointerEvents: 'auto',
        }}>
          <div style={{
            fontFamily: PIXEL_STYLES.fontFamily,
            color: COLORS.primary,
            fontSize: 'clamp(14px, 2vw, 18px)',
            fontWeight: 'bold',
            textShadow: '2px 2px 0 #000',
          }}>
            LV.{displayStats.level}
          </div>
          <div style={{
            fontFamily: PIXEL_STYLES.fontFamily,
            color: COLORS.textGray,
            fontSize: 'clamp(10px, 1.5vw, 12px)',
            marginTop: '4px',
            textShadow: '1px 1px 0 #000',
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
          }}>
            <span style={{ color: COLORS.info }}>⏱️{formatTime(displayStats.time)}</span>
            <span style={{ color: COLORS.danger }}>💀{displayStats.kills}</span>
            <span style={{ color: '#FFD700' }}>💰{displayStats.coins || 0}</span>
          </div>
          {/* Aim Mode Indicator */}
          <div style={{
            fontFamily: PIXEL_STYLES.fontFamily,
            fontSize: '10px',
            marginTop: '6px',
            padding: '3px 6px',
            background: displayStats.aimMode === 'manual' ? 'rgba(255, 100, 100, 0.3)' : 'rgba(100, 255, 100, 0.3)',
            border: `1px solid ${displayStats.aimMode === 'manual' ? '#ff6666' : '#66ff66'}`,
            color: displayStats.aimMode === 'manual' ? '#ff6666' : '#66ff66',
            textShadow: '1px 1px 0 #000',
            cursor: 'pointer',
          }}>
            🎯 {displayStats.aimMode === 'manual' ? 'MANUAL' : 'AUTO'} (Click)
          </div>
        </div>
      </div>

      {/* Level Up Modal */}
      {gamePhase === 'levelup' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          padding: '20px',
        }}>
          {/* Scanline overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
            pointerEvents: 'none',
          }} />

          {/* Modal Container */}
          <div style={{
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(13, 13, 26, 0.98)',
            border: `4px solid ${COLORS.primary}`,
            boxShadow: `
              6px 6px 0 0 rgba(0,0,0,0.6),
              inset 0 0 0 2px rgba(255,215,0,0.2)
            `,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              background: `linear-gradient(180deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
              padding: '12px 20px',
              textAlign: 'center',
              borderBottom: '4px solid #000',
            }}>
              <h1 style={{
                fontFamily: PIXEL_STYLES.fontFamily,
                fontSize: 'clamp(20px, 4vw, 32px)',
                color: '#000',
                margin: 0,
                letterSpacing: '4px',
                textShadow: '2px 2px 0 rgba(255,255,255,0.3)',
              }}>
                ⬆️ LEVEL UP!
              </h1>
            </div>

            {/* Character Info Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '12px 20px',
              background: 'rgba(0,0,0,0.5)',
              borderBottom: `2px solid ${COLORS.panelBorder}`,
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: COLORS.bgLight,
                border: `3px solid ${selectedCharacter?.color || COLORS.secondary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <img
                  src={SPRITES.characters[selectedCharacter.id]}
                  alt=""
                  style={{ width: '40px', height: '40px', objectFit: 'contain', imageRendering: 'pixelated' }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                <span style={{ fontFamily: PIXEL_STYLES.fontFamily, color: COLORS.textWhite, fontSize: '12px' }}>
                  ❤️ {displayStats.hp}/{displayStats.maxHp}
                </span>
                <span style={{ fontFamily: PIXEL_STYLES.fontFamily, color: COLORS.atk, fontSize: '12px' }}>
                  ⚔️ +{Math.floor((gameStateRef.current?.stats?.damage / 30 - 1) * 100)}%
                </span>
                <span style={{ fontFamily: PIXEL_STYLES.fontFamily, color: COLORS.spd, fontSize: '12px' }}>
                  🏃 +{Math.floor((gameStateRef.current?.stats?.moveSpeed - 1) * 100)}%
                </span>
                <span style={{ fontFamily: PIXEL_STYLES.fontFamily, color: COLORS.crit, fontSize: '12px' }}>
                  💥 {Math.round((gameStateRef.current?.stats?.crit || 0) * 100)}%
                </span>
              </div>
            </div>

            {/* Upgrade Options - Scrollable */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <p style={{
                fontFamily: PIXEL_STYLES.fontFamily,
                color: COLORS.textGray,
                fontSize: '11px',
                textAlign: 'center',
                margin: '0 0 5px 0',
              }}>
                SELECT AN UPGRADE
              </p>

              {levelUpOptions.map((upgrade, index) => (
                <button
                  key={upgrade.id + index}
                  onClick={() => handleUpgrade(upgrade)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    background: upgrade.isSubWeapon
                      ? `linear-gradient(90deg, rgba(255,215,0,0.15) 0%, ${COLORS.bgLight} 100%)`
                      : COLORS.bgLight,
                    border: `3px solid ${upgrade.isSubWeapon ? COLORS.primary : COLORS.panelBorder}`,
                    boxShadow: '3px 3px 0 0 rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(5px)'
                    e.currentTarget.style.borderColor = upgrade.isSubWeapon ? COLORS.primary : COLORS.secondary
                    e.currentTarget.style.boxShadow = `0 0 15px ${upgrade.isSubWeapon ? COLORS.primary : COLORS.secondary}40, 3px 3px 0 0 rgba(0,0,0,0.5)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.borderColor = upgrade.isSubWeapon ? COLORS.primary : COLORS.panelBorder
                    e.currentTarget.style.boxShadow = '3px 3px 0 0 rgba(0,0,0,0.5)'
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: COLORS.bgDark,
                    border: `2px solid ${upgrade.isMainWeapon || upgrade.isPassiveSkill ? COLORS.warning : upgrade.isSubWeapon ? COLORS.primary : COLORS.panelBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    flexShrink: 0,
                    position: 'relative',
                  }}>
                    {upgrade.isMainWeapon || upgrade.isPassiveSkill ? (
                      SPRITES.abilities && SPRITES.abilities[upgrade.icon] ? (
                        <img
                          src={SPRITES.abilities[upgrade.icon]}
                          alt={upgrade.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            imageRendering: 'pixelated',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '30px' }}>{upgrade.isMainWeapon ? '⚔️' : '✨'}</span>
                      )
                    ) : upgrade.isSubWeapon ? (
                      <img src={SPRITES.subweapons[upgrade.icon]} alt="" style={{ width: '40px', height: '40px', imageRendering: 'pixelated', objectFit: 'contain' }} />
                    ) : (
                      <img src={SPRITES.items[upgrade.icon]} alt="" style={{ width: '28px', height: '28px', imageRendering: 'pixelated' }} />
                    )}
                    {upgrade.isSubWeapon && (
                      <div style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: upgrade.grade === 3 ? COLORS.primary : upgrade.grade === 2 ? '#C0C0C0' : '#CD7F32',
                        color: '#000',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        fontFamily: PIXEL_STYLES.fontFamily,
                        padding: '1px 4px',
                        border: '1px solid #000',
                      }}>
                        ★{upgrade.grade}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{
                        fontFamily: PIXEL_STYLES.fontFamily,
                        color: COLORS.textWhite,
                        fontSize: 'clamp(12px, 2vw, 14px)',
                        fontWeight: 'bold',
                        textShadow: '1px 1px 0 #000',
                      }}>
                        {upgrade.name}
                      </span>
                      <span style={{
                        fontFamily: PIXEL_STYLES.fontFamily,
                        color: upgrade.isSubWeapon ? COLORS.primary : COLORS.secondary,
                        fontSize: '10px',
                        background: 'rgba(0,0,0,0.5)',
                        padding: '2px 6px',
                      }}>
                        {upgrade.isSubWeapon
                          ? (upgrade.currentLevel > 0 ? `LV${upgrade.currentLevel}→${upgrade.nextLevel}` : '🆕무기')
                          : `🆕${upgrade.type}`
                        }
                      </span>
                    </div>
                    <div style={{
                      fontFamily: PIXEL_STYLES.fontFamily,
                      color: COLORS.textGray,
                      fontSize: '10px',
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {upgrade.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MENU */}
      {gamePhase === 'paused' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          padding: '20px',
        }}>
          {/* Scanline overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
            pointerEvents: 'none',
          }} />

          {/* Main Pause Menu */}
          {pauseTab === 'main' && (
            <div style={{
              width: '100%',
              maxWidth: '280px',
              background: 'rgba(13, 13, 26, 0.98)',
              border: `4px solid ${COLORS.panelBorder}`,
              boxShadow: '6px 6px 0 0 rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                background: `linear-gradient(180deg, ${COLORS.bgLight} 0%, ${COLORS.bgDark} 100%)`,
                padding: '15px',
                textAlign: 'center',
                borderBottom: `3px solid ${COLORS.panelBorder}`,
              }}>
                <h2 style={{
                  fontFamily: PIXEL_STYLES.fontFamily,
                  color: COLORS.textWhite,
                  fontSize: '24px',
                  margin: 0,
                  letterSpacing: '4px',
                  textShadow: '2px 2px 0 #000',
                }}>
                  ⏸️ PAUSED
                </h2>
              </div>

              {/* Menu Buttons */}
              <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: '📊 CHARACTER', action: () => setPauseTab('character'), variant: 'dark' },
                  { label: '⚙️ SETTINGS', disabled: true, variant: 'ghost' },
                  { label: '▶ RESUME', action: () => setGamePhase('playing'), variant: 'primary' },
                  { label: '✖ QUIT', action: handleQuit, variant: 'danger' },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={btn.disabled ? undefined : btn.action}
                    disabled={btn.disabled}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontFamily: PIXEL_STYLES.fontFamily,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      cursor: btn.disabled ? 'not-allowed' : 'pointer',
                      border: '3px solid',
                      borderColor: btn.disabled ? '#333'
                        : btn.variant === 'primary' ? '#000'
                          : btn.variant === 'danger' ? '#8B0000'
                            : COLORS.panelBorder,
                      background: btn.disabled ? '#333'
                        : btn.variant === 'primary' ? `linear-gradient(180deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`
                          : btn.variant === 'danger' ? `linear-gradient(180deg, ${COLORS.danger} 0%, #CC5555 100%)`
                            : COLORS.bgLight,
                      color: btn.disabled ? '#666'
                        : btn.variant === 'primary' ? '#000'
                          : btn.variant === 'danger' ? '#fff'
                            : COLORS.textWhite,
                      boxShadow: btn.disabled ? 'none' : '3px 3px 0 0 rgba(0,0,0,0.5)',
                      textShadow: (btn.variant === 'primary') ? 'none' : '1px 1px 0 #000',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (!btn.disabled) {
                        e.currentTarget.style.transform = 'translate(2px, 2px)'
                        e.currentTarget.style.boxShadow = '1px 1px 0 0 rgba(0,0,0,0.5)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translate(0, 0)'
                      e.currentTarget.style.boxShadow = btn.disabled ? 'none' : '3px 3px 0 0 rgba(0,0,0,0.5)'
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Character Details Screen */}
          {pauseTab === 'character' && (
            <div style={{
              width: '100%',
              maxWidth: '800px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(13, 13, 26, 0.98)',
              border: `4px solid ${COLORS.panelBorder}`,
              boxShadow: '6px 6px 0 0 rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}>
              {/* Header with Back Button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 15px',
                background: `linear-gradient(180deg, ${COLORS.bgLight} 0%, ${COLORS.bgDark} 100%)`,
                borderBottom: `3px solid ${COLORS.panelBorder}`,
              }}>
                <button
                  onClick={() => setPauseTab('main')}
                  style={{
                    padding: '8px 12px',
                    fontFamily: PIXEL_STYLES.fontFamily,
                    fontSize: '12px',
                    background: 'transparent',
                    border: `2px solid ${COLORS.panelBorder}`,
                    color: COLORS.textWhite,
                    cursor: 'pointer',
                    boxShadow: '2px 2px 0 0 rgba(0,0,0,0.3)',
                  }}
                >
                  ◀ BACK
                </button>
                <h2 style={{
                  fontFamily: PIXEL_STYLES.fontFamily,
                  color: COLORS.textWhite,
                  fontSize: '18px',
                  margin: 0,
                  letterSpacing: '2px',
                  textShadow: '2px 2px 0 #000',
                }}>
                  📊 CHARACTER
                </h2>
                <div style={{ width: '70px' }} /> {/* Spacer for centering */}
              </div>

              {/* Content Area */}
              <div style={{
                display: 'flex',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                flexDirection: 'row',
                '@media (max-width: 600px)': { flexDirection: 'column' },
              }}>
                {/* Left - Character Stats */}
                <div style={{
                  width: '250px',
                  minWidth: '200px',
                  minHeight: 0,
                  padding: '15px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRight: `2px solid ${COLORS.panelBorder}`,
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {/* Character Info */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: COLORS.bgLight,
                      border: `3px solid ${selectedCharacter?.color || COLORS.secondary}`,
                      boxShadow: '3px 3px 0 0 rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <img
                        src={SPRITES.characters[selectedCharacter.id]}
                        alt=""
                        style={{ width: '48px', height: '48px', objectFit: 'contain', imageRendering: 'pixelated' }}
                      />
                    </div>
                    <div style={{ marginLeft: '12px' }}>
                      <h3 style={{
                        fontFamily: PIXEL_STYLES.fontFamily,
                        margin: 0,
                        fontSize: '14px',
                        color: COLORS.textWhite,
                        textShadow: '1px 1px 0 #000',
                      }}>
                        {selectedCharacter.name}
                      </h3>
                      <p style={{
                        fontFamily: PIXEL_STYLES.fontFamily,
                        margin: '4px 0 0',
                        color: selectedCharacter.color,
                        fontSize: '12px',
                      }}>
                        Level {displayStats.level}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: `2px solid ${COLORS.panelBorder}`,
                    padding: '10px',
                  }}>
                    <h4 style={{
                      fontFamily: PIXEL_STYLES.fontFamily,
                      color: COLORS.textGray,
                      fontSize: '10px',
                      margin: '0 0 8px 0',
                      letterSpacing: '1px',
                    }}>
                      STATS
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { icon: '❤️', label: 'HP', value: `${displayStats.hp}/${displayStats.maxHp}`, color: COLORS.hp },
                        { icon: '⚔️', label: 'ATK', value: Math.round(gameStateRef.current?.stats?.damage || 0), color: COLORS.atk },
                        { icon: '🏃', label: 'SPD', value: `${Math.round((gameStateRef.current?.stats?.moveSpeed || 1) * 100)}%`, color: COLORS.spd },
                        { icon: '💥', label: 'CRT', value: `${Math.round((gameStateRef.current?.stats?.crit || 0) * 100)}%`, color: COLORS.crit },
                        { icon: '⚡', label: 'AS', value: `${(gameStateRef.current?.stats?.attackSpeed || 1).toFixed(1)}x`, color: COLORS.warning },
                        { icon: '🛡️', label: 'DEF', value: `${Math.round((gameStateRef.current?.stats?.defense || 0) * 100)}%`, color: COLORS.textGray },
                      ].map(stat => (
                        <div key={stat.label} style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontFamily: PIXEL_STYLES.fontFamily,
                          fontSize: '14px',
                        }}>
                          <span style={{ width: '24px', fontSize: '16px' }}>{stat.icon}</span>
                          <span style={{ color: COLORS.textGray, width: '50px' }}>{stat.label}</span>
                          <span style={{ color: stat.color, fontWeight: 'bold', marginLeft: 'auto' }}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right - Inventory */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                  <div style={{
                    padding: '10px 15px',
                    borderBottom: `2px solid ${COLORS.panelBorder}`,
                    background: 'rgba(0,0,0,0.2)',
                  }}>
                    <h3 style={{
                      fontFamily: PIXEL_STYLES.fontFamily,
                      color: COLORS.textWhite,
                      fontSize: '12px',
                      margin: 0,
                      letterSpacing: '1px',
                    }}>
                      📦 INVENTORY ({selectionCount})
                    </h3>
                  </div>

                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    minHeight: 0,
                    maxHeight: '60vh',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}>
                    {selectionSections.map((section) => (
                      <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{
                          fontFamily: PIXEL_STYLES.fontFamily,
                          color: COLORS.textGray,
                          fontSize: '10px',
                          letterSpacing: '1px',
                        }}>
                          {section.title} ({section.entries.length})
                        </div>
                        {section.entries.length === 0 ? (
                          <p style={{
                            fontFamily: PIXEL_STYLES.fontFamily,
                            color: COLORS.textDark,
                            textAlign: 'center',
                            margin: '6px 0 10px',
                            fontSize: '11px',
                          }}>
                            {section.emptyText}
                          </p>
                        ) : (
                          section.entries.map(renderSelectionEntry)
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GameScreen
