import React, { useState } from 'react'
import { runQuery, getRecommendations } from '../api'
import Card from '../components/Card'
import Table from '../components/Table'

const btn = (color = '#38bdf8') => ({
  background: color, color: '#0f172a', border: 'none', borderRadius: 6,
  padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
})
const inp = { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', padding: '8px 12px', fontSize: 13, width: '100%' }
const lbl = { color: '#94a3b8', fontSize: 12, marginBottom: 4 }

const QUERIES = [
  {
    id: 'collab-filter',
    label: 'Filtrado Colaborativo',
    desc: 'Productos recomendados basados en compras de usuarios similares.',
    param: 'userId',
    default: 'USR00001',
  },
  {
    id: 'top-sellers-by-volume',
    label: 'Top 5 Sellers por Volumen',
    desc: 'Los 5 vendedores con mayor ingreso total generado.',
    param: null,
  },
  {
    id: 'avg-rating-by-category',
    label: 'Rating Promedio por Categoría',
    desc: 'Promedio de calificaciones por categoría con sus subcategorías.',
    param: null,
  },
  {
    id: 'also-bought',
    label: 'También Compraron',
    desc: 'Usuarios que compraron el producto X también compraron estos productos.',
    param: 'productId',
    default: 'PRD00001',
  },
  {
    id: 'similar-products',
    label: 'Productos Similares Vistos',
    desc: 'Productos similares a los que un usuario ha visto recientemente.',
    param: 'userId',
    default: 'USR00001',
  },
  {
    id: 'products-without-reviews',
    label: 'Productos sin Reviews',
    desc: 'Productos que no tienen ninguna reseña asociada.',
    param: null,
  },
]

function QueryCard({ q }) {
  const [paramVal, setParamVal] = useState(q.default || '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = q.param ? { [q.param]: paramVal } : {}
      const res = await runQuery(q.id, params)
      setResult(res.data.data)
    } catch (e) {
      setError(e?.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{q.label}</h3>
        <p style={{ color: '#64748b', fontSize: 13 }}>{q.desc}</p>
      </div>
      {q.param && (
        <div style={{ marginBottom: 12 }}>
          <div style={lbl}>{q.param}</div>
          <input style={{ ...inp, maxWidth: 300 }} value={paramVal} onChange={e => setParamVal(e.target.value)} />
        </div>
      )}
      <button style={btn()} disabled={loading} onClick={run}>
        {loading ? 'Ejecutando...' : 'Ejecutar Consulta'}
      </button>
      {error && <p style={{ color: '#fca5a5', fontSize: 13, marginTop: 8 }}>Error: {error}</p>}
      {result && result.length > 0 && <Table rows={result} />}
      {result && result.length === 0 && <p style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>Sin resultados.</p>}
    </Card>
  )
}

export default function QueriesPage() {
  const [userId, setUserId] = useState('USR00001')
  const [recResult, setRecResult] = useState(null)
  const [recLoading, setRecLoading] = useState(false)
  const [recError, setRecError] = useState(null)

  const runRec = async () => {
    setRecLoading(true)
    setRecError(null)
    try {
      const res = await getRecommendations(userId)
      setRecResult(res.data.data)
    } catch (e) {
      setRecError(e?.response?.data?.error || e.message)
    } finally {
      setRecLoading(false)
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Consultas Cypher</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        6 consultas de presentación (2 por integrante) + motor de recomendación colaborativa.
      </p>

      <Card title="Motor de Recomendación (Filtrado Colaborativo)">
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
          Recomienda productos basados en qué compraron usuarios con historial de compras similar.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ flex: 1, maxWidth: 300 }}>
            <div style={lbl}>userId</div>
            <input style={inp} value={userId} onChange={e => setUserId(e.target.value)} />
          </div>
          <button style={{ ...btn(), marginTop: 16 }} disabled={recLoading} onClick={runRec}>
            {recLoading ? 'Cargando...' : 'Recomendar'}
          </button>
        </div>
        {recError && <p style={{ color: '#fca5a5', fontSize: 13 }}>Error: {recError}</p>}
        {recResult && <Table rows={recResult} />}
      </Card>

      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', margin: '32px 0 16px' }}>
        Consultas de Presentación
      </h2>

      {QUERIES.map(q => <QueryCard key={q.id} q={q} />)}
    </div>
  )
}
