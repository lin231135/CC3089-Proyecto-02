import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'

export default function ProductCard({ product, onAddToCart }) {
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate()

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const handleClick = () => {
    navigate(`/store/product/${product.productId}`)
  }

  const handleAddToCart = (e) => {
    e.stopPropagation()
    onAddToCart && onAddToCart(product)
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: `1px solid ${isHovered ? '#38bdf8' : '#334155'}`,
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 20px 40px rgba(56, 189, 248, 0.2)' 
          : '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Image placeholder */}
      <div style={{
        width: '100%',
        height: 200,
        background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
        borderRadius: 8,
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Icon name="package" size={64} color="#475569" />
        )}
      </div>

      {/* Product name */}
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: '#f1f5f9',
        margin: '0 0 8px 0',
        height: 48,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {product.name}
      </h3>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {product.tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} style={{
              fontSize: 11,
              background: '#1e293b',
              color: '#94a3b8',
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid #334155',
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Price and stock */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <span style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#38bdf8',
        }}>
          {formatPrice(product.price)}
        </span>
        <span style={{
          fontSize: 12,
          color: product.stock > 0 ? '#22c55e' : '#ef4444',
          fontWeight: 500,
        }}>
          {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
        </span>
      </div>

      {/* Add to cart button */}
      <button
        onClick={handleAddToCart}
        disabled={product.stock === 0}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: product.stock > 0 
            ? 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)' 
            : '#334155',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s ease',
          opacity: product.stock > 0 ? 1 : 0.5,
        }}
      >
        <Icon name="cart" size={16} />
        {product.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
      </button>
    </div>
  )
}
