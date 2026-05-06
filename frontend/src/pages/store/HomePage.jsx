import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNodes, getRecommendations, runQuery } from '../../api'
import { useCart } from '../../context/CartContext'
import ProductCarousel from '../../components/store/ProductCarousel'
import RecommendationSection from '../../components/store/RecommendationSection'
import Icon from '../../components/Icon'

export default function HomePage() {
  const navigate = useNavigate()
  const { addToCart, userId } = useCart()
  
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHomepageData()
  }, [userId])

  const loadHomepageData = async () => {
    setLoading(true)
    try {
      // Load featured products (first 8 products)
      const productsRes = await getNodes('Product')
      const allProducts = productsRes.data.data || []
      setFeaturedProducts(allProducts.slice(0, 8))

      // Load personalized recommendations
      try {
        const recRes = await getRecommendations(userId)
        setRecommendations(recRes.data.data || [])
      } catch (err) {
        console.warn('Error loading recommendations:', err)
        setRecommendations([]) // Clear recommendations on error
      }

      // Load top selling products (not sellers)
      try {
        const topRes = await runQuery('top-products-by-sales')
        setTopProducts(topRes.data.data?.slice(0, 6) || [])
      } catch (err) {
        console.warn('Error loading top products:', err)
        setTopProducts([]) // Clear top products on error
      }
    } catch (err) {
      console.error('Error loading homepage data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 80,
        color: '#94a3b8',
        fontSize: 16,
      }}>
        <Icon name="loader" size={32} color="#38bdf8" />
        <p style={{ marginTop: 16 }}>Cargando tienda...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Hero section */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid #334155',
        borderRadius: 16,
        padding: 60,
        marginBottom: 48,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }}/>
        <div style={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }}/>
        
        <Icon name="bolt" size={48} color="#38bdf8" style={{ marginBottom: 16 }} />
        <h1 style={{
          fontSize: 48,
          fontWeight: 700,
          color: '#f1f5f9',
          marginBottom: 16,
          textShadow: '0 2px 20px rgba(56, 189, 248, 0.3)',
        }}>
          Bienvenido a E-Commerce Store
        </h1>
        <p style={{
          fontSize: 20,
          color: '#94a3b8',
          marginBottom: 32,
          maxWidth: 600,
          margin: '0 auto 32px',
        }}>
          Descubre productos increíbles con nuestro motor de recomendaciones powered by Neo4j
        </p>
        <button
          onClick={() => navigate('/store/catalog')}
          style={{
            padding: '16px 40px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 18,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 16px rgba(56, 189, 248, 0.3)',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Icon name="package" size={22} />
          Explorar Catálogo
        </button>
      </div>

      {/* Personalized recommendations */}
      {recommendations.length > 0 && (
        <RecommendationSection
          title="Recomendado Para Ti"
          description="Basado en tus compras anteriores y preferencias (Collaborative Filtering)"
          products={recommendations}
          onAddToCart={(p) => addToCart(p)}
          icon="star"
        />
      )}

      {/* Top products */}
      {topProducts.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h2 style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#f1f5f9',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <Icon name="star" size={28} color="#fbbf24" />
            Más Vendidos
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {topProducts.map(product => (
              <div
                key={product.productId}
                onClick={() => navigate(`/store/product/${product.productId}`)}
                style={{
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  border: '1px solid #334155',
                  borderRadius: 12,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(56, 189, 248, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#f1f5f9',
                  marginBottom: 8,
                }}>
                  {product.name}
                </h3>
                <p style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#38bdf8',
                  marginBottom: 8,
                }}>
                  ${product.price}
                </p>
                {product.totalSold && (
                  <p style={{
                    fontSize: 13,
                    color: '#94a3b8',
                  }}>
                    {product.totalSold} vendidos
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured products */}
      <div style={{ marginBottom: 48 }}>
        <ProductCarousel
          title="Productos Destacados"
          products={featuredProducts}
          onAddToCart={(p) => addToCart(p)}
        />
      </div>

      {/* Features section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 24,
        marginTop: 60,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid #334155',
          borderRadius: 12,
          padding: 32,
          textAlign: 'center',
        }}>
          <Icon name="bolt" size={40} color="#38bdf8" style={{ marginBottom: 16 }} />
          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#f1f5f9',
            marginBottom: 8,
          }}>
            Recomendaciones Inteligentes
          </h3>
          <p style={{
            fontSize: 14,
            color: '#94a3b8',
            lineHeight: 1.6,
          }}>
            Powered by Neo4j graph database para sugerencias personalizadas
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid #334155',
          borderRadius: 12,
          padding: 32,
          textAlign: 'center',
        }}>
          <Icon name="package" size={40} color="#22c55e" style={{ marginBottom: 16 }} />
          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#f1f5f9',
            marginBottom: 8,
          }}>
            Productos de Calidad
          </h3>
          <p style={{
            fontSize: 14,
            color: '#94a3b8',
            lineHeight: 1.6,
          }}>
            Miles de productos verificados en nuestro catálogo
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid #334155',
          borderRadius: 12,
          padding: 32,
          textAlign: 'center',
        }}>
          <Icon name="cart" size={40} color="#fbbf24" style={{ marginBottom: 16 }} />
          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#f1f5f9',
            marginBottom: 8,
          }}>
            Compra Fácil
          </h3>
          <p style={{
            fontSize: 14,
            color: '#94a3b8',
            lineHeight: 1.6,
          }}>
            Proceso de compra simple y rápido con seguimiento completo
          </p>
        </div>
      </div>
    </div>
  )
}
