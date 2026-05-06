import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getNodeById, runQuery, createRelationship } from '../../api'
import { useCart } from '../../context/CartContext'
import RecommendationSection from '../../components/store/RecommendationSection'
import Icon from '../../components/Icon'

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, userId } = useCart()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  // Recommendations
  const [alsoBought, setAlsoBought] = useState([])
  const [similarProducts, setSimilarProducts] = useState([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(true)

  useEffect(() => {
    loadProduct()
    loadRecommendations()
    trackView()
  }, [id])

  const loadProduct = async () => {
    setLoading(true)
    try {
      const res = await getNodeById(id, 'Product')
      setProduct(res.data.data)
    } catch (err) {
      console.error('Error loading product:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendations = async () => {
    setLoadingRecommendations(true)
    try {
      // Load "Also Bought" recommendations
      const alsoBoughtRes = await runQuery('also-bought', { productId: id })
      setAlsoBought(alsoBoughtRes.data.data || [])

      // Load similar products
      const similarRes = await runQuery('similar-products', { userId })
      // Filter to get products similar to current one (by tags or category)
      const filtered = (similarRes.data.data || []).slice(0, 6)
      setSimilarProducts(filtered)
    } catch (err) {
      console.error('Error loading recommendations:', err)
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const trackView = async () => {
    try {
      // Create VIEWED relationship
      await createRelationship({
        type: 'VIEWED',
        fromLabel: 'User',
        fromId: userId,
        toLabel: 'Product',
        toId: id,
        properties: {
          viewedAt: new Date().toISOString(),
          duration: Math.floor(Math.random() * 300) + 30, // Random duration for demo
          source: 'product_page',
        }
      })
    } catch (err) {
      console.error('Error tracking view:', err)
    }
  }

  const handleAddToCart = () => {
    if (product && quantity > 0) {
      addToCart(product, quantity)
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
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
        <p style={{ marginTop: 16 }}>Cargando producto...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 80,
      }}>
        <Icon name="package" size={64} color="#475569" />
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#f1f5f9',
          marginTop: 24,
          marginBottom: 12,
        }}>
          Producto No Encontrado
        </h2>
        <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 32 }}>
          El producto que buscas no existe o ha sido eliminado
        </p>
        <button
          onClick={() => navigate('/store/catalog')}
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Volver al Catálogo
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{
        marginBottom: 24,
        fontSize: 14,
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span 
          onClick={() => navigate('/store/catalog')}
          style={{ cursor: 'pointer', color: '#38bdf8' }}
        >
          Catálogo
        </span>
        <Icon name="chevron-right" size={14} color="#64748b" />
        <span>{product.name}</span>
      </div>

      {/* Product details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 40,
        marginBottom: 60,
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid #334155',
        borderRadius: 16,
        padding: 32,
      }}>
        {/* Product image */}
        <div>
          <div style={{
            width: '100%',
            aspectRatio: '1',
            background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
            borderRadius: 12,
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
              <Icon name="package" size={120} color="#475569" />
            )}
          </div>
        </div>

        {/* Product info */}
        <div>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#f1f5f9',
            marginBottom: 16,
            lineHeight: 1.3,
          }}>
            {product.name}
          </h1>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 20,
            }}>
              {product.tags.map((tag, idx) => (
                <span key={idx} style={{
                  fontSize: 12,
                  background: '#1e293b',
                  color: '#94a3b8',
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #334155',
                  fontWeight: 500,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div style={{
            fontSize: 40,
            fontWeight: 700,
            color: '#38bdf8',
            marginBottom: 20,
          }}>
            {formatPrice(product.price)}
          </div>

          {/* Stock status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
            fontSize: 16,
            fontWeight: 500,
          }}>
            <Icon 
              name={product.stock > 0 ? "check" : "x"} 
              size={20} 
              color={product.stock > 0 ? "#22c55e" : "#ef4444"} 
            />
            <span style={{ color: product.stock > 0 ? '#22c55e' : '#ef4444' }}>
              {product.stock > 0 
                ? `${product.stock} unidades disponibles` 
                : 'Agotado'}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <p style={{
              fontSize: 16,
              color: '#94a3b8',
              lineHeight: 1.6,
              marginBottom: 32,
            }}>
              {product.description}
            </p>
          )}

          {/* Quantity selector */}
          {product.stock > 0 && (
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#f1f5f9',
                marginBottom: 8,
              }}>
                Cantidad
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    width: 40,
                    height: 40,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: 20,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  -
                </button>
                <span style={{
                  minWidth: 60,
                  textAlign: 'center',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#f1f5f9',
                }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  style={{
                    width: 40,
                    height: 40,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: 20,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addedToCart}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: product.stock > 0 
                ? (addedToCart 
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)')
                : '#334155',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 18,
              fontWeight: 700,
              cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all 0.3s ease',
              opacity: product.stock > 0 ? 1 : 0.5,
              marginBottom: 12,
            }}
          >
            <Icon name={addedToCart ? "check" : "cart"} size={22} />
            {addedToCart ? '¡Agregado!' : (product.stock > 0 ? 'Agregar al Carrito' : 'Agotado')}
          </button>

          {/* Product ID */}
          <div style={{
            fontSize: 12,
            color: '#64748b',
            textAlign: 'center',
            marginTop: 16,
          }}>
            ID: {product.productId}
          </div>
        </div>
      </div>

      {/* Recommendations sections */}
      {!loadingRecommendations && (
        <>
          {/* Customers also bought */}
          <RecommendationSection
            title="Los clientes también compraron"
            description="Productos frecuentemente comprados junto con este artículo (Collaborative Filtering)"
            products={alsoBought}
            onAddToCart={(p) => addToCart(p)}
            icon="users"
          />

          {/* Similar products */}
          <RecommendationSection
            title="Productos Similares"
            description="Productos con características y etiquetas similares que podrían interesarte"
            products={similarProducts}
            onAddToCart={(p) => addToCart(p)}
            icon="package"
          />
        </>
      )}

      {loadingRecommendations && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: '#94a3b8',
          fontSize: 14,
        }}>
          <Icon name="loader" size={24} color="#38bdf8" />
          <p style={{ marginTop: 12 }}>Cargando recomendaciones personalizadas...</p>
        </div>
      )}
    </div>
  )
}
