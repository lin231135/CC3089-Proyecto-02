import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import Icon from '../Icon'

export default function CartIcon() {
  const [isHovered, setIsHovered] = useState(false)
  const { getItemCount } = useCart()
  const navigate = useNavigate()
  const itemCount = getItemCount()

  return (
    <button
      onClick={() => navigate('/store/cart')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        background: isHovered 
          ? 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)' 
          : '#1e293b',
        border: `1px solid ${isHovered ? '#38bdf8' : '#334155'}`,
        borderRadius: 8,
        padding: '10px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s ease',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <Icon name="cart" size={20} color={isHovered ? '#fff' : '#94a3b8'} />
      <span style={{
        fontSize: 14,
        fontWeight: 600,
        color: isHovered ? '#fff' : '#94a3b8',
      }}>
        Carrito
      </span>
      {itemCount > 0 && (
        <span style={{
          position: 'absolute',
          top: -8,
          right: -8,
          background: '#ef4444',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          width: 24,
          height: 24,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
        }}>
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  )
}
