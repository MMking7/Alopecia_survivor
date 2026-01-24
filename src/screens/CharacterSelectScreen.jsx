import React from 'react'
import { SPRITES } from '../constants'

const CharacterSelectScreen = ({ characters, selectedCharacter, onSelect, onStart, onBack, imagesLoaded }) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      display: 'flex',
      padding: '40px',
      gap: '40px',
      boxSizing: 'border-box',
    }}>
      {/* Left - Selected Character Detail */}
      <div style={{
        width: '300px',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '16px',
        padding: '30px',
        border: '3px solid #444',
      }}>
        {selectedCharacter ? (
          <>
            <div style={{
              width: '200px',
              height: '200px',
              margin: '0 auto 20px',
              borderRadius: '16px',
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${selectedCharacter.color}40, ${selectedCharacter.color}20)`,
              border: `3px solid ${selectedCharacter.color}`,
            }}>
              <img src={SPRITES.characters[selectedCharacter.id]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h2 style={{ color: '#fff', textAlign: 'center', margin: '0 0 10px' }}>{selectedCharacter.name}</h2>
            <p style={{ color: selectedCharacter.color, textAlign: 'center', fontWeight: 'bold', margin: '0 0 20px' }}>{selectedCharacter.weapon}</p>
            
            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: '❤️', label: 'HP', value: selectedCharacter.baseStats.hp, color: '#ff6b6b' },
                { icon: '⚔️', label: 'ATK', value: selectedCharacter.baseStats.damage, color: '#ffd700' },
                { icon: '🏃', label: 'SPD', value: selectedCharacter.baseStats.speed, color: '#87ceeb' },
                { icon: '💥', label: 'CRT', value: `${(selectedCharacter.baseStats.crit * 100)}%`, color: '#ff69b4' },
                { icon: '⚡', label: 'Haste', value: selectedCharacter.baseStats.attackSpeed, color: '#ffff00' },
              ].map(stat => (
                <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px' }}>
                  <span>{stat.icon} {stat.label}</span>
                  <span style={{ color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ color: '#888', textAlign: 'center' }}>캐릭터를 선택하세요</p>
        )}
      </div>

      {/* Right - Character Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ color: '#FFD700', fontSize: '36px', marginBottom: '30px' }}>🎮 캐릭터 선택</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
          {characters.map((char) => (
            <div
              key={char.id}
              onClick={() => onSelect(char)}
              style={{
                background: selectedCharacter?.id === char.id ? `linear-gradient(135deg, ${char.color}60, ${char.color}30)` : 'rgba(30, 40, 60, 0.9)',
                border: `4px solid ${selectedCharacter?.id === char.id ? char.color : '#444'}`,
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
              }}
            >
              <div style={{ width: '80px', height: '80px', margin: '0 auto 10px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
                <img src={SPRITES.characters[char.id]} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h3 style={{ color: '#fff', margin: '0 0 5px', fontSize: '16px' }}>{char.name}</h3>
              <p style={{ color: char.color, margin: 0, fontSize: '12px' }}>{char.weapon}</p>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '20px', marginTop: 'auto' }}>
          <button onClick={onBack} style={{ padding: '15px 40px', fontSize: '18px', background: 'rgba(100,100,100,0.7)', color: '#fff', border: '3px solid #555', borderRadius: '8px', cursor: 'pointer' }}>
            ← 뒤로가기
          </button>
          <button 
            onClick={onStart} 
            disabled={!selectedCharacter || !imagesLoaded}
            style={{ 
              padding: '15px 60px', 
              fontSize: '20px', 
              fontWeight: 'bold',
              background: selectedCharacter ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(100,100,100,0.5)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: selectedCharacter ? 'pointer' : 'not-allowed',
              boxShadow: selectedCharacter ? '0 4px 20px rgba(102,126,234,0.5)' : 'none',
            }}
          >
            {!imagesLoaded ? '로딩 중...' : '🎮 게임 시작'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CharacterSelectScreen
