import React from 'react'

/**
 * Pixel Art UI Design System
 * 
 * Design Principles:
 * 1. Sharp edges with pixel-perfect borders (no border-radius or minimal 2-4px)
 * 2. Consistent color palette across all screens
 * 3. Pixel-style shadows (solid color offset, no blur)
 * 4. Retro typography with pixel fonts
 * 5. 8-bit inspired decorative elements
 */

// ============================================================
// COLOR PALETTE
// ============================================================
export const COLORS = {
  // Primary Colors
  primary: '#FFD700',      // Gold - Main accent
  primaryDark: '#D4A000',  // Dark gold for shadows
  
  // Secondary Colors  
  secondary: '#00D4FF',    // Cyan - Selection/highlight
  secondaryDark: '#00A0CC',
  
  // Background Colors
  bgDark: '#0D0D1A',       // Darkest background
  bgMedium: '#1A1A2E',     // Panel backgrounds
  bgLight: '#252540',      // Lighter panels
  
  // UI Colors
  panelBg: 'rgba(13, 13, 26, 0.95)',
  panelBorder: '#3D3D5C',
  
  // Text Colors
  textWhite: '#FFFFFF',
  textGray: '#B0B0B0',
  textDark: '#666680',
  
  // Status Colors
  success: '#4ADE80',
  danger: '#FF6B6B',
  warning: '#FBBF24',
  info: '#60A5FA',
  
  // Stat Colors
  hp: '#FF6B6B',
  atk: '#FFD700',
  spd: '#60A5FA',
  crit: '#FF69B4',
  def: '#8B5CF6',
}

// ============================================================
// SHARED STYLES
// ============================================================
export const PIXEL_STYLES = {
  // Pixel-perfect border (no blur shadows)
  pixelBorder: (color = COLORS.panelBorder, width = 4) => ({
    border: `${width}px solid ${color}`,
    boxShadow: `
      ${width}px ${width}px 0 0 rgba(0,0,0,0.5),
      inset -${width/2}px -${width/2}px 0 0 rgba(0,0,0,0.2),
      inset ${width/2}px ${width/2}px 0 0 rgba(255,255,255,0.1)
    `,
  }),
  
  // Retro button shadow
  buttonShadow: (shadowColor = '#000') => ({
    boxShadow: `4px 4px 0 0 ${shadowColor}`,
    transition: 'transform 0.1s, box-shadow 0.1s',
  }),
  
  // Font family
  fontFamily: '"NeoDunggeunmo", "Press Start 2P", "DungGeunMo", monospace',
}

// ============================================================
// PIXEL PANEL COMPONENT
// ============================================================
export const PixelPanel = ({ 
  children, 
  style = {}, 
  variant = 'default',
  noPadding = false,
  ...props 
}) => {
  const variants = {
    default: {
      background: COLORS.panelBg,
      borderColor: COLORS.panelBorder,
    },
    highlight: {
      background: 'rgba(0, 212, 255, 0.1)',
      borderColor: COLORS.secondary,
    },
    dark: {
      background: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#222',
    }
  }
  
  const v = variants[variant] || variants.default
  
  return (
    <div
      style={{
        background: v.background,
        border: `4px solid ${v.borderColor}`,
        boxShadow: `
          4px 4px 0 0 rgba(0,0,0,0.5),
          inset -2px -2px 0 0 rgba(0,0,0,0.3),
          inset 2px 2px 0 0 rgba(255,255,255,0.05)
        `,
        padding: noPadding ? 0 : '20px',
        imageRendering: 'pixelated',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================================
// PIXEL BUTTON COMPONENT
// ============================================================
export const PixelButton = ({ 
  children, 
  onClick, 
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style = {},
  ...props 
}) => {
  const variants = {
    primary: {
      background: `linear-gradient(180deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
      color: '#000',
      borderColor: '#000',
      shadowColor: '#8B6914',
      hoverBg: COLORS.primary,
    },
    secondary: {
      background: `linear-gradient(180deg, ${COLORS.secondary} 0%, ${COLORS.secondaryDark} 100%)`,
      color: '#000',
      borderColor: '#006080',
      shadowColor: '#004D66',
      hoverBg: COLORS.secondary,
    },
    dark: {
      background: `linear-gradient(180deg, #3D3D5C 0%, #252540 100%)`,
      color: COLORS.textWhite,
      borderColor: '#1A1A2E',
      shadowColor: '#0D0D1A',
      hoverBg: '#4D4D6C',
    },
    danger: {
      background: `linear-gradient(180deg, ${COLORS.danger} 0%, #CC5555 100%)`,
      color: '#fff',
      borderColor: '#8B0000',
      shadowColor: '#660000',
      hoverBg: COLORS.danger,
    },
    ghost: {
      background: 'transparent',
      color: COLORS.textWhite,
      borderColor: COLORS.panelBorder,
      shadowColor: 'rgba(0,0,0,0.3)',
      hoverBg: 'rgba(255,255,255,0.1)',
    }
  }
  
  const sizes = {
    small: { padding: '8px 16px', fontSize: '14px' },
    medium: { padding: '12px 24px', fontSize: '18px' },
    large: { padding: '16px 40px', fontSize: '24px' },
  }
  
  const v = variants[variant] || variants.primary
  const s = sizes[size] || sizes.medium
  
  const [isPressed, setIsPressed] = React.useState(false)
  
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={{
        background: disabled ? '#444' : v.background,
        color: disabled ? '#888' : v.color,
        border: `3px solid ${disabled ? '#333' : v.borderColor}`,
        boxShadow: isPressed 
          ? 'none' 
          : `4px 4px 0 0 ${disabled ? '#222' : v.shadowColor}`,
        padding: s.padding,
        fontSize: s.fontSize,
        fontFamily: PIXEL_STYLES.fontFamily,
        fontWeight: 'bold',
        transform: isPressed ? 'translate(4px, 4px)' : 'translate(0, 0)',
        transition: 'transform 0.05s, box-shadow 0.05s',
        textShadow: variant === 'primary' || variant === 'secondary' 
          ? 'none' 
          : '2px 2px 0 rgba(0,0,0,0.5)',
        letterSpacing: '1px',
        imageRendering: 'pixelated',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

// ============================================================
// PIXEL TITLE COMPONENT
// ============================================================
export const PixelTitle = ({ 
  children, 
  size = 'large',
  color = COLORS.primary,
  style = {},
  ...props 
}) => {
  const sizes = {
    small: '24px',
    medium: '36px',
    large: '48px',
    xlarge: '64px',
  }
  
  return (
    <h1
      style={{
        fontFamily: PIXEL_STYLES.fontFamily,
        fontSize: sizes[size] || sizes.large,
        color: color,
        textShadow: `
          4px 4px 0 #000,
          -2px -2px 0 #000,
          2px -2px 0 #000,
          -2px 2px 0 #000
        `,
        margin: 0,
        letterSpacing: '4px',
        imageRendering: 'pixelated',
        ...style,
      }}
      {...props}
    >
      {children}
    </h1>
  )
}

// ============================================================
// COIN DISPLAY COMPONENT
// ============================================================
export const CoinDisplay = ({ coins, style = {} }) => (
  <PixelPanel
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 20px',
      ...style,
    }}
  >
    <span style={{ fontSize: '24px' }}>💰</span>
    <span style={{
      fontFamily: PIXEL_STYLES.fontFamily,
      fontSize: '24px',
      fontWeight: 'bold',
      color: COLORS.primary,
      textShadow: '2px 2px 0 #000',
    }}>
      {coins.toLocaleString()}
    </span>
  </PixelPanel>
)

// ============================================================
// STAT BAR COMPONENT
// ============================================================
export const StatBar = ({ 
  icon, 
  label, 
  value, 
  color = COLORS.textWhite,
  maxValue,
  showBar = false,
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: PIXEL_STYLES.fontFamily,
    fontSize: '14px',
  }}>
    <span style={{ width: '24px', textAlign: 'center' }}>{icon}</span>
    <span style={{ color: COLORS.textGray, width: '60px' }}>{label}</span>
    {showBar && maxValue ? (
      <div style={{
        flex: 1,
        height: '12px',
        background: '#1A1A2E',
        border: '2px solid #3D3D5C',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${(value / maxValue) * 100}%`,
          background: color,
        }} />
      </div>
    ) : (
      <span style={{ color, fontWeight: 'bold', marginLeft: 'auto' }}>{value}</span>
    )}
  </div>
)

// ============================================================
// LEVEL INDICATOR COMPONENT
// ============================================================
export const LevelIndicator = ({ current, max, size = 8 }) => (
  <div style={{ display: 'flex', gap: '3px' }}>
    {Array.from({ length: Math.min(max, 10) }, (_, i) => (
      <div
        key={i}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: i < current ? COLORS.primary : '#333',
          border: '1px solid #000',
        }}
      />
    ))}
  </div>
)

// ============================================================
// DECORATIVE PIXEL BORDER
// ============================================================
export const PixelBorderDecoration = ({ style = {} }) => (
  <div style={{
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    border: '8px solid transparent',
    borderImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect x='0' y='0' width='8' height='8' fill='%23FFD700'/%3E%3Crect x='8' y='0' width='8' height='8' fill='%23D4A000'/%3E%3Crect x='16' y='0' width='8' height='8' fill='%23FFD700'/%3E%3Crect x='0' y='8' width='8' height='8' fill='%23D4A000'/%3E%3Crect x='16' y='8' width='8' height='8' fill='%23D4A000'/%3E%3Crect x='0' y='16' width='8' height='8' fill='%23FFD700'/%3E%3Crect x='8' y='16' width='8' height='8' fill='%23D4A000'/%3E%3Crect x='16' y='16' width='8' height='8' fill='%23FFD700'/%3E%3C/svg%3E") 8 repeat`,
    ...style,
  }} />
)

// ============================================================
// SCREEN BACKGROUND COMPONENT
// ============================================================
export const ScreenBackground = ({ children, variant = 'dark', style = {} }) => {
  const backgrounds = {
    dark: `linear-gradient(180deg, ${COLORS.bgDark} 0%, ${COLORS.bgMedium} 100%)`,
    blue: `linear-gradient(180deg, #0D1B2A 0%, #1B263B 100%)`,
    purple: `linear-gradient(180deg, #1A0A2E 0%, #2D1B4E 100%)`,
  }
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: backgrounds[variant] || backgrounds.dark,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Pixel grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '8px 8px',
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  )
}

export default {
  COLORS,
  PIXEL_STYLES,
  PixelPanel,
  PixelButton,
  PixelTitle,
  CoinDisplay,
  StatBar,
  LevelIndicator,
  PixelBorderDecoration,
  ScreenBackground,
}
