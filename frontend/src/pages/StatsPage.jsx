import React, { useEffect, useState } from 'react'
import { getStats, verifyGraph, deleteIsolatedNodes } from '../api'
import Card from '../components/Card'
import Table from '../components/Table'
import Icon from '../components/Icon'

function StatBox({ value, label, color = '#38bdf8', delay = 0, isIcon = false }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? '#1a1f2e' : '#0f172a',
        borderRadius: 8,
        padding: '16px 24px',
        border: `1px solid ${isHovered ? color : '#334155'}`,
        textAlign: 'center',
        opacity: 0,
        animation: `fadeInScale 0.5s ease forwards ${delay}s`,
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-5px) scale(1.05)' : 'translateY(0) scale(1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isHovered
          ? `0 10px 25px -5px ${color}40, 0 0 0 1px ${color}20`
          : '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: color,
          textShadow: isHovered ? `0 0 20px ${color}60` : 'none',
          transition: 'all 0.3s ease',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 35,
        }}
      >
        {isIcon ? <Icon name={value} size={32} /> : value}
      </div>
      <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState(null)
  const [connected, setConnected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const loadData = () => {
    Promise.all([getStats(), verifyGraph()])
      .then(([s, g]) => {
        setStats(s.data.data)
        setConnected(g.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeleteIsolated = async () => {
    if (!confirm(`¿Eliminar ${connected?.isolated} nodo(s) aislado(s)? Esta acción no se puede deshacer.`)) {
      return
    }
    
    setDeleting(true)
    try {
      const res = await deleteIsolatedNodes()
      alert(`✅ ${res.data.data.deleted} nodo(s) eliminado(s) exitosamente`)
      loadData() // Reload data
    } catch (err) {
      console.error('Error deleting isolated nodes:', err)
      alert('❌ Error al eliminar nodos aislados')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div
          style={{
            width: 50,
            height: 50,
            border: '4px solid #334155',
            borderTopColor: '#38bdf8',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: '#64748b', marginTop: 16 }}>Cargando estadísticas...</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div>
        <div
          style={{
            background: 'linear-gradient(90deg, #1e293b, #0f172a, #1e293b)',
            backgroundSize: '200% 200%',
            animation: 'gradientFlow 8s ease infinite',
            padding: '20px 24px',
            borderRadius: 12,
            marginBottom: 24,
            border: '1px solid #334155',
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#f1f5f9' }}>
            Dashboard
          </h1>
          <p style={{ color: '#64748b' }}>Motor de Recomendación E-Commerce — Neo4j AuraDB</p>
        </div>

        <Card title="Estado del Grafo">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 16,
          }}>
            {stats?.nodeCounts?.map((r, idx) => (
              <StatBox key={r.label} value={r.total} label={r.label} delay={idx * 0.05} />
            ))}
            <StatBox
              value={connected?.connected ? 'check' : 'error'}
              isIcon={true}
              label={connected?.connected ? 'Grafo Conexo' : `${connected?.isolated} aislados`}
              color={connected?.connected ? '#22c55e' : '#ef4444'}
              delay={(stats?.nodeCounts?.length || 0) * 0.05}
            />
          </div>
          
          {/* Warning for isolated nodes */}
          {!connected?.connected && connected?.isolatedNodes && (
            <div style={{
              marginTop: 20,
              padding: 16,
              background: '#7f1d1d',
              border: '1px solid #991b1b',
              borderRadius: 8,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
              }}>
                <Icon name="error" size={20} color="#fca5a5" />
                <strong style={{ color: '#fca5a5', fontSize: 14 }}>
                  Advertencia: {connected?.isolated} nodo(s) sin relaciones
                </strong>
              </div>
              <p style={{ color: '#fecaca', fontSize: 13, marginBottom: 12 }}>
                Los siguientes nodos no tienen ninguna relación y deberían ser eliminados o conectados:
              </p>
              <div style={{ fontSize: 12, color: '#fecaca', fontFamily: 'monospace' }}>
                {connected.isolatedNodes.slice(0, 5).map((node, idx) => {
                  const nodeData = node.n || node
                  const labels = nodeData.labels ? nodeData.labels.join(':') : 'Unknown'
                  const props = JSON.stringify(nodeData, null, 2)
                  return (
                    <div key={idx} style={{ 
                      background: '#450a0a', 
                      padding: 8, 
                      borderRadius: 4, 
                      marginBottom: 8,
                      border: '1px solid #7f1d1d'
                    }}>
                      <div style={{ color: '#f87171', fontWeight: 600 }}>{labels}</div>
                      <pre style={{ margin: '4px 0 0 0', fontSize: 11, overflow: 'auto' }}>
                        {props.substring(0, 200)}{props.length > 200 ? '...' : ''}
                      </pre>
                    </div>
                  )
                })}
              </div>
              <div style={{ 
                display: 'flex', 
                gap: 12, 
                marginTop: 16,
                alignItems: 'center' 
              }}>
                <button
                  onClick={handleDeleteIsolated}
                  disabled={deleting}
                  style={{
                    padding: '10px 20px',
                    background: deleting ? '#991b1b' : '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: deleting ? 0.6 : 1,
                  }}
                >
                  <Icon name="trash" size={16} />
                  {deleting ? 'Eliminando...' : `Eliminar ${connected?.isolated} nodo(s)`}
                </button>
                <p style={{ color: '#fcd34d', fontSize: 12, margin: 0 }}>
                  💡 También puedes eliminarlos desde la página de Nodos
                </p>
              </div>
            </div>
          )}
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Card title="Top 5 Productos Más Comprados">
            <Table rows={stats?.topProducts} />
          </Card>
          <Card title="Top 5 Compradores Activos">
            <Table rows={stats?.topBuyers} />
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Card title="Estadísticas de Órdenes">
            {stats?.orderStats?.[0] && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 16,
                alignItems: 'start',
              }}>
                {Object.entries(stats.orderStats[0]).map(([k, v], idx) => (
                  <StatBox
                    key={k}
                    value={typeof v === 'number' ? v.toFixed(2) : v}
                    label={k}
                    color="#f59e0b"
                    delay={idx * 0.08}
                  />
                ))}
              </div>
            )}
          </Card>
          <Card title="Relaciones por Tipo">
            <Table rows={stats?.relCounts} />
          </Card>
        </div>
      </div>
    </>
  )
}
