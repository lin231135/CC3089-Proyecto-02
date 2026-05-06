import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { createNode, createRelationship } from '../../api'
import Icon from '../../components/Icon'

export default function CartPage() {
  const navigate = useNavigate()
  const { cart, updateQuantity, removeFromCart, getTotal, clearCart, userId } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    setIsProcessing(true)
    try {
      // Create order node
      const orderData = {
        labels: ['Order'],
        properties: {
          orderId: `ORD${Date.now()}`,
          status: 'pending',
          total: getTotal(),
          isPaid: false,
          placedAt: new Date().toISOString(),
        }
      }
      const orderRes = await createNode(orderData.labels, orderData.properties)
      const orderId = orderRes.data.data.orderId

      // Create PLACED relationship (User -> Order)
      await createRelationship({
        type: 'PLACED',
        fromLabel: 'User',
        fromId: userId,
        toLabel: 'Order',
        toId: orderId,
        properties: {
          placedAt: new Date().toISOString(),
          channel: 'web',
          promoCode: null,
        }
      })

      // Create CONTAINS relationships (Order -> Product)
      for (const item of cart) {
        await createRelationship({
          type: 'CONTAINS',
          fromLabel: 'Order',
          fromId: orderId,
          toLabel: 'Product',
          toId: item.productId,
          properties: {
            quantity: item.quantity,
            unitPrice: item.price,
            discount: 0,
          }
        })

        // Create PURCHASED relationship (User -> Product)
        await createRelationship({
          type: 'PURCHASED',
          fromLabel: 'User',
          fromId: userId,
          toLabel: 'Product',
          toId: item.productId,
          properties: {
            purchasedAt: new Date().toISOString(),
            quantity: item.quantity,
            unitPrice: item.price,
          }
        })
      }

      // Clear cart and show success
      clearCart()
      setOrderPlaced(true)
      setTimeout(() => {
        navigate('/store/catalog')
      }, 3000)
    } catch (err) {
      console.error('Error placing order:', err)
      alert('Error al procesar la orden. Por favor intenta de nuevo.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (orderPlaced) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 80,
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)',
        }}>
          <Icon name="check" size={40} color="#fff" />
        </div>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#f1f5f9',
          marginBottom: 12,
        }}>
          ¡Orden Procesada!
        </h2>
        <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 24 }}>
          Tu orden ha sido creada exitosamente en Neo4j.
        </p>
        <p style={{ fontSize: 14, color: '#64748b' }}>
          Redirigiendo al catálogo...
        </p>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 80,
      }}>
        <Icon name="cart" size={64} color="#475569" />
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#f1f5f9',
          marginTop: 24,
          marginBottom: 12,
        }}>
          Tu Carrito está Vacío
        </h2>
        <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 32 }}>
          Agrega algunos productos para comenzar tu compra
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
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="package" size={20} />
          Ir al Catálogo
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#f1f5f9',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Icon name="cart" size={32} color="#38bdf8" />
          Carrito de Compras
        </h1>
        <p style={{ fontSize: 16, color: '#94a3b8', margin: 0 }}>
          {cart.length} producto{cart.length !== 1 ? 's' : ''} en tu carrito
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: 32,
      }}>
        {/* Cart items */}
        <div>
          {cart.map(item => (
            <div
              key={item.productId}
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: '1px solid #334155',
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                display: 'flex',
                gap: 20,
              }}
            >
              {/* Product image */}
              <div style={{
                width: 120,
                height: 120,
                background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                  />
                ) : (
                  <Icon name="package" size={40} color="#475569" />
                )}
              </div>

              {/* Product info */}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#f1f5f9',
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/store/product/${item.productId}`)}
                >
                  {item.name}
                </h3>
                <p style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#38bdf8',
                  marginBottom: 16,
                }}>
                  {formatPrice(item.price)}
                </p>

                {/* Quantity controls */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 14, color: '#94a3b8' }}>Cantidad:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      style={{
                        width: 32,
                        height: 32,
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 6,
                        color: '#f1f5f9',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      -
                    </button>
                    <span style={{
                      minWidth: 40,
                      textAlign: 'center',
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#f1f5f9',
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      style={{
                        width: 32,
                        height: 32,
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 6,
                        color: '#f1f5f9',
                        cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer',
                        opacity: item.quantity >= item.stock ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    style={{
                      marginLeft: 'auto',
                      padding: '8px 16px',
                      background: 'transparent',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Icon name="trash" size={16} />
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Subtotal */}
              <div style={{
                textAlign: 'right',
                flexShrink: 0,
              }}>
                <div style={{
                  fontSize: 12,
                  color: '#94a3b8',
                  marginBottom: 4,
                }}>
                  Subtotal
                </div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#f1f5f9',
                }}>
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div style={{ height: 'fit-content', position: 'sticky', top: 32 }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid #334155',
            borderRadius: 12,
            padding: 24,
          }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#f1f5f9',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid #334155',
            }}>
              Resumen de Orden
            </h2>

            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 12,
                fontSize: 14,
                color: '#94a3b8',
              }}>
                <span>Productos ({cart.length})</span>
                <span>{formatPrice(getTotal())}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 12,
                fontSize: 14,
                color: '#94a3b8',
              }}>
                <span>Envío</span>
                <span style={{ color: '#22c55e' }}>GRATIS</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 16,
                borderTop: '1px solid #334155',
                fontSize: 18,
                fontWeight: 700,
                color: '#f1f5f9',
              }}>
                <span>Total</span>
                <span style={{ color: '#38bdf8' }}>{formatPrice(getTotal())}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: isProcessing
                  ? '#334155'
                  : 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 12,
              }}
            >
              {isProcessing ? (
                <>
                  <Icon name="loader" size={20} />
                  Procesando...
                </>
              ) : (
                <>
                  <Icon name="check" size={20} />
                  Finalizar Compra
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/store/catalog')}
              style={{
                width: '100%',
                padding: '10px 20px',
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #334155',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Continuar Comprando
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
