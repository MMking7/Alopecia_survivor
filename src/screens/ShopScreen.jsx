import React, { useState } from 'react'

const ShopScreen = ({ coins, setCoins, shopLevels, setShopLevels, shopUpgrades, onBack }) => {
  const [selectedShopItem, setSelectedShopItem] = useState(null)

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(180deg, #87CEEB 0%, #B0E2FF 100%)',
      display: 'flex',
      padding: '40px',
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      {/* Left - Shop NPC */}
      <div style={{ width: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ color: '#234', fontSize: '48px', fontWeight: 'bold', textShadow: '2px 2px 0 #fff', marginBottom: '20px' }}>SHOP</h1>
        <div style={{ fontSize: '150px', filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.2))' }}>🧑‍💼</div>
      </div>

      {/* Right - Items Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Coins */}
        <div style={{ alignSelf: 'flex-end', background: 'rgba(0,0,0,0.7)', padding: '12px 25px', borderRadius: '8px', marginBottom: '20px' }}>
          <span style={{ color: '#FFD700', fontSize: '24px', fontWeight: 'bold' }}>💰 {coins.toLocaleString()}</span>
        </div>

        {/* Items Grid */}
        <div style={{
          background: 'rgba(50,80,100,0.85)',
          borderRadius: '12px',
          padding: '20px',
          border: '3px solid #345',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {shopUpgrades.map((item) => {
              const level = shopLevels[item.id] || 0
              const isMaxed = level >= item.maxLevel
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedShopItem(item)}
                  style={{
                    width: '70px',
                    height: '70px',
                    background: selectedShopItem?.id === item.id ? 'rgba(0,200,255,0.3)' : 'rgba(30,50,70,0.8)',
                    border: selectedShopItem?.id === item.id ? '3px solid #00BFFF' : '2px solid #456',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{item.icon}</span>
                  <div style={{ position: 'absolute', bottom: '2px', display: 'flex', gap: '2px' }}>
                    {Array.from({ length: item.maxLevel }, (_, i) => (
                      <div key={i} style={{ width: '6px', height: '6px', background: i < level ? '#FFD700' : '#555', borderRadius: '1px' }} />
                    )).slice(0, 5)}
                  </div>
                  {isMaxed && <div style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '10px', color: '#FFD700' }}>MAX</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Item Description */}
        {selectedShopItem && (
          <div style={{
            background: 'rgba(30,50,70,0.9)',
            borderRadius: '8px',
            padding: '15px 20px',
            border: '2px solid #00BFFF',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <span style={{ fontSize: '40px' }}>{selectedShopItem.icon}</span>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>{selectedShopItem.name}</h3>
                <p style={{ color: '#aaa', margin: 0, fontSize: '14px' }}>{selectedShopItem.description}</p>
              </div>
              <span style={{ marginLeft: 'auto', color: '#FF6B6B', fontSize: '18px', fontWeight: 'bold' }}>
                Cost: {selectedShopItem.cost * ((shopLevels[selectedShopItem.id] || 0) + 1)}
              </span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => {
              if (!selectedShopItem) return
              const level = shopLevels[selectedShopItem.id] || 0
              const cost = selectedShopItem.cost * (level + 1)
              if (coins >= cost && level < selectedShopItem.maxLevel) {
                setCoins(prev => prev - cost)
                setShopLevels(prev => ({ ...prev, [selectedShopItem.id]: level + 1 }))
              }
            }}
            disabled={!selectedShopItem || coins < (selectedShopItem?.cost * ((shopLevels[selectedShopItem?.id] || 0) + 1)) || (shopLevels[selectedShopItem?.id] || 0) >= selectedShopItem?.maxLevel}
            style={{ padding: '15px 50px', fontSize: '18px', fontWeight: 'bold', background: '#4A7C99', color: '#fff', border: '3px solid #345', borderRadius: '8px', cursor: 'pointer' }}
          >
            Buy
          </button>
          <button
            onClick={() => {
              if (!selectedShopItem) return
              const level = shopLevels[selectedShopItem.id] || 0
              if (level > 0) {
                const refund = Math.floor(selectedShopItem.cost * level * 0.8)
                setCoins(prev => prev + refund)
                setShopLevels(prev => ({ ...prev, [selectedShopItem.id]: level - 1 }))
              }
            }}
            disabled={!selectedShopItem || (shopLevels[selectedShopItem?.id] || 0) <= 0}
            style={{ padding: '15px 40px', fontSize: '18px', background: 'rgba(100,100,100,0.7)', color: '#fff', border: '3px solid #555', borderRadius: '8px', cursor: 'pointer' }}
          >
            Refund
          </button>
          <button onClick={onBack} style={{ marginLeft: 'auto', padding: '15px 40px', fontSize: '18px', background: 'rgba(100,100,100,0.7)', color: '#fff', border: '3px solid #555', borderRadius: '8px', cursor: 'pointer' }}>
            ← 뒤로가기
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShopScreen
