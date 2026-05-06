import React from 'react'
import ProductCarousel from './ProductCarousel'

export default function RecommendationSection({ 
  title, 
  products, 
  onAddToCart, 
  icon = 'star',
  description 
}) {
  if (!products || products.length === 0) {
    return null
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      border: '1px solid #334155',
      borderRadius: 16,
      padding: 24,
      marginBottom: 32,
    }}>
      {description && (
        <p style={{
          fontSize: 14,
          color: '#94a3b8',
          marginBottom: 16,
          lineHeight: 1.6,
        }}>
          {description}
        </p>
      )}
      <ProductCarousel 
        title={title}
        products={products}
        onAddToCart={onAddToCart}
      />
    </div>
  )
}
