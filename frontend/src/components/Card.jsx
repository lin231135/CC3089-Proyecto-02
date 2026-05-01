import React, { useState, useEffect } from 'react'

export default function Card({ title, children, style }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? '#1f2937' : '#1e293b',
        borderRadius: 10,
        padding: 24,
        border: `1px solid ${isHovered ? '#38bdf8' : '#334155'}`,
        marginBottom: 24,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isHovered
          ? '0 10px 30px -5px rgba(56, 189, 248, 0.2), 0 0 0 1px rgba(56, 189, 248, 0.1)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        ...style,
      }}
    >
      {title && (
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#38bdf8',
            marginBottom: 16,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(0)' : 'translateX(-10px)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
          }}
        >
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}
