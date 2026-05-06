import React, { useRef, useState } from 'react'
import ProductCard from './ProductCard'
import Icon from '../Icon'

export default function ProductCarousel({ title, products, onAddToCart }) {
  const scrollRef = useRef(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const scroll = (direction) => {
    const container = scrollRef.current
    if (!container) return

    const scrollAmount = 300
    const newScrollLeft = container.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount)
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })

    setTimeout(() => {
      updateArrows()
    }, 300)
  }

  const updateArrows = () => {
    const container = scrollRef.current
    if (!container) return

    setShowLeftArrow(container.scrollLeft > 0)
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <div style={{ marginBottom: 40 }}>
      {/* Title */}
      <h2 style={{
        fontSize: 24,
        fontWeight: 700,
        color: '#f1f5f9',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        {title}
        <span style={{
          fontSize: 14,
          fontWeight: 400,
          color: '#94a3b8',
          background: '#1e293b',
          padding: '4px 12px',
          borderRadius: 12,
        }}>
          {products.length}
        </span>
      </h2>

      {/* Carousel container */}
      <div style={{ position: 'relative' }}>
        {/* Left arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            style={{
              position: 'absolute',
              left: -20,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
          >
            <Icon name="chevron-left" size={20} color="#fff" />
          </button>
        )}

        {/* Right arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            style={{
              position: 'absolute',
              right: -20,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
          >
            <Icon name="chevron-right" size={20} color="#fff" />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          style={{
            display: 'flex',
            gap: 20,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: '4px 0',
          }}
        >
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {products.map(product => (
            <div key={product.productId} style={{ minWidth: 280, maxWidth: 280 }}>
              <ProductCard product={product} onAddToCart={onAddToCart} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
