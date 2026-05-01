import React, { useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import StatsPage from './pages/StatsPage'
import NodesPage from './pages/NodesPage'
import RelationshipsPage from './pages/RelationshipsPage'
import ImportPage from './pages/ImportPage'
import QueriesPage from './pages/QueriesPage'
import StorePage from './pages/store/StorePage'
import Icon from './components/Icon'

const nav = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/nodes', label: 'Nodos', icon: 'node' },
  { to: '/relationships', label: 'Relaciones', icon: 'link' },
  { to: '/import', label: 'Importar CSV', icon: 'import' },
  { to: '/queries', label: 'Consultas', icon: 'search' },
  { to: '/store', label: 'Tienda', icon: 'cart', highlight: true },
]

function NavItem({ to, label, icon, highlight }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {({ isActive }) => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 20px',
          color: isActive ? '#38bdf8' : (highlight ? '#22c55e' : '#94a3b8'),
          fontSize: 14,
          fontWeight: highlight ? 600 : 400,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          background: isActive ? '#0f172a' : (isHovered ? '#1a202c' : 'transparent'),
          borderLeft: `3px solid ${isActive ? '#38bdf8' : (highlight ? '#22c55e' : 'transparent')}`,
          transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
        }}>
          <span style={{
            transition: 'transform 0.2s ease',
            transform: isHovered ? 'scale(1.15)' : 'scale(1)',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Icon name={icon} size={18} />
          </span>
          <span>{label}</span>
        </div>
      )}
    </NavLink>
  )
}

const s = {
  app: { display: 'flex', minHeight: '100vh', background: '#0a0f1a' },
  sidebar: {
    width: 220,
    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
    padding: '24px 0',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    borderRight: '1px solid #334155',
    boxShadow: '4px 0 12px rgba(0, 0, 0, 0.3)',
  },
  logo: {
    padding: '0 20px 24px',
    fontSize: 15,
    fontWeight: 700,
    color: '#38bdf8',
    borderBottom: '1px solid #334155',
    textShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
  },
  main: {
    flex: 1,
    padding: 32,
    overflowY: 'auto',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  },
}

export default function App() {
  return (
    <>
      <style>{`
        @keyframes logoGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(56, 189, 248, 0.3); }
          50% { text-shadow: 0 0 30px rgba(56, 189, 248, 0.6); }
        }
      `}</style>
      <div style={s.app}>
        <aside style={s.sidebar}>
          <div style={{
            ...s.logo,
            animation: 'logoGlow 3s ease-in-out infinite',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Icon name="bolt" size={20} />
            <span>
              Motor Rec.<br />E-Commerce
            </span>
          </div>
          {nav.map(({ to, label, icon, highlight }) => (
            <NavItem key={to} to={to} label={label} icon={icon} highlight={highlight} />
          ))}
        </aside>
        <main style={s.main}>
          <Routes>
            <Route path="/" element={<StatsPage />} />
            <Route path="/nodes" element={<NodesPage />} />
            <Route path="/relationships" element={<RelationshipsPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/queries" element={<QueriesPage />} />
            <Route path="/store/*" element={<StorePage />} />
          </Routes>
        </main>
      </div>
    </>
  )
}
