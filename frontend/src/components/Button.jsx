import React, { useState } from 'react'

export default function Button({ children, onClick, color = '#38bdf8', disabled = false, style = {} }) {
  const [isHovered, setIsHovered] = useState(false)
  const [ripples, setRipples] = useState([])

  const handleClick = (e) => {
    if (disabled) return
    
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    
    const newRipple = { x, y, size, id: Date.now() }
    setRipples([...ripples, newRipple])
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)
    
    onClick?.(e)
  }

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      disabled={disabled}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: disabled ? '#334155' : color,
        color: disabled ? '#64748b' : '#0f172a',
        border: 'none',
        borderRadius: 6,
        padding: '8px 16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        fontWeight: 600,
        transform: isHovered && !disabled ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isHovered && !disabled
          ? `0 8px 16px -4px ${color}60, 0 0 0 1px ${color}`
          : '0 2px 4px rgba(0,0,0,0.2)',
        ...style,
      }}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.5)',
            transform: 'scale(0)',
            animation: 'ripple 0.6s ease-out',
            pointerEvents: 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
      {children}
    </button>
  )
}
