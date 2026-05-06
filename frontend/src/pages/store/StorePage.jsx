import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getNodes } from '../../api'
import { useCart } from '../../context/CartContext'
import CartIcon from '../../components/store/CartIcon'
import CatalogPage from './CatalogPage'
import ProductPage from './ProductPage'
import CartPage from './CartPage'
import HomePage from './HomePage'
import Icon from '../../components/Icon'

const storeNav = [
  { to: '/store/catalog', label: 'Catálogo', icon: 'package' },
  { to: '/store/cart', label: 'Mi Carrito', icon: 'cart' },
]

function StoreNavItem({ to, label, icon, isActive }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <NavLink
      to={to}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        color: isActive ? '#38bdf8' : '#94a3b8',
        textDecoration: 'none',
        fontSize: 15,
        fontWeight: 500,
        transition: 'all 0.2s ease',
        background: isActive ? '#0f172a' : (isHovered ? '#1a202c' : 'transparent'),
        borderRadius: 8,
      }}
    >
      <Icon name={icon} size={18} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function StorePage() {
  const navigate = useNavigate()
  const { userId, setUserId } = useCart()
  const [users, setUsers] = useState([])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await getNodes('User', {})
      setUsers(res.data.data?.slice(0, 10) || [])
    } catch (err) {
      console.error('Error loading users:', err)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        borderBottom: '1px solid #334155',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('/store/catalog')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
          }}
        >
          <Icon name="bolt" size={28} color="#38bdf8" />
          <div>
            <h1 style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#38bdf8',
              margin: 0,
              lineHeight: 1,
            }}>
              E-Commerce Store
            </h1>
            <p style={{
              fontSize: 11,
              color: '#64748b',
              margin: 0,
              marginTop: 2,
            }}>
              Powered by Neo4j Recommendations
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          {storeNav.map(({ to, label, icon }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <StoreNavItem to={to} label={label} icon={icon} isActive={isActive} />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User selector & Cart */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          {/* User selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Icon name="user" size={18} color="#94a3b8" />
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 6,
                color: '#f1f5f9',
                fontSize: 14,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {users.map(user => (
                <option key={user.userId} value={user.userId}>
                  {user.name || user.userId}
                </option>
              ))}
            </select>
          </div>

          {/* Cart icon */}
          <CartIcon />

          {/* Back to admin */}
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: 6,
              color: '#94a3b8',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            <Icon name="arrow-left" size={16} />
            Admin Panel
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        padding: 32,
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer style={{
        background: '#0f172a',
        borderTop: '1px solid #334155',
        padding: '24px 32px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: 13,
      }}>
        <p style={{ margin: 0 }}>
          Motor de Recomendación E-Commerce · Proyecto Bases de Datos 2 · Powered by Neo4j AuraDB
        </p>
      </footer>
    </div>
  )
}
