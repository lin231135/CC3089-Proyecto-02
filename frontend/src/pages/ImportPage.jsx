import React, { useState } from 'react'
import { importCSV } from '../api'
import Card from '../components/Card'
import Icon from '../components/Icon'

const CSV_TYPES = [
  { value: 'users', label: 'users.csv → User' },
  { value: 'products', label: 'products.csv → Product' },
  { value: 'categories', label: 'categories.csv → Category' },
  { value: 'orders', label: 'orders.csv → Order' },
  { value: 'reviews', label: 'reviews.csv → Review' },
  { value: 'sellers', label: 'sellers.csv → Seller' },
  { value: 'rel_purchased', label: 'rel_purchased.csv → PURCHASED' },
  { value: 'rel_wrote', label: 'rel_wrote.csv → WROTE' },
  { value: 'rel_about', label: 'rel_about.csv → ABOUT' },
  { value: 'rel_viewed', label: 'rel_viewed.csv → VIEWED' },
  { value: 'rel_added_to_cart', label: 'rel_added_to_cart.csv → ADDED_TO_CART' },
  { value: 'rel_belongs_to', label: 'rel_belongs_to.csv → BELONGS_TO' },
  { value: 'rel_similar_to', label: 'rel_similar_to.csv → SIMILAR_TO' },
  { value: 'rel_placed', label: 'rel_placed.csv → PLACED' },
  { value: 'rel_contains', label: 'rel_contains.csv → CONTAINS' },
  { value: 'rel_sells', label: 'rel_sells.csv → SELLS' },
  { value: 'rel_follows', label: 'rel_follows.csv → FOLLOWS' },
  { value: 'rel_recommended_to', label: 'rel_recommended_to.csv → RECOMMENDED_TO' },
  { value: 'rel_subcategory_of', label: 'rel_subcategory_of.csv → SUBCATEGORY_OF' },
]

const NODE_TYPES = CSV_TYPES.filter(t => !t.value.startsWith('rel_'))
const REL_TYPES = CSV_TYPES.filter(t => t.value.startsWith('rel_'))

const btn = (color = '#38bdf8') => ({
  background: color, color: '#0f172a', border: 'none', borderRadius: 6,
  padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
})
const inp = { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', padding: '8px 12px', fontSize: 13, width: '100%' }
const lbl = { color: '#94a3b8', fontSize: 12, marginBottom: 4 }

export default function ImportPage() {
  const [importType, setImportType] = useState('users')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [msg, setMsg] = useState(null)

  // Bulk import all at once (drag CSV folder)
  const [bulkFiles, setBulkFiles] = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)

  const doImport = async (type, f) => {
    const res = await importCSV(type, f)
    return res.data.data
  }

  const handleSingle = async () => {
    if (!file) { setMsg({ type: 'err', text: 'Selecciona un archivo' }); return }
    setLoading(true)
    setMsg(null)
    try {
      const data = await doImport(importType, file)
      setMsg({ type: 'ok', text: `Importados: ${data.imported} registros (${data.type})` })
      setResults(r => [{ type: data.type, imported: data.imported }, ...r])
    } catch (e) {
      setMsg({ type: 'err', text: e?.response?.data?.error || e.message })
    } finally {
      setLoading(false)
    }
  }

  const handleBulk = async () => {
    if (bulkFiles.length === 0) { setMsg({ type: 'err', text: 'Selecciona archivos' }); return }
    setBulkLoading(true)
    setMsg(null)
    const newResults = []

    // Detect type from filename
    const detectType = (filename) => {
      const name = filename.replace('.csv', '').toLowerCase()
      if (CSV_TYPES.find(t => t.value === name)) return name
      return null
    }

    // Import nodes first (order matters for relationships)
    const nodeOrder = ['categories', 'sellers', 'users', 'products', 'orders', 'reviews']
    const relOrder = ['rel_belongs_to', 'rel_subcategory_of', 'rel_sells', 'rel_purchased', 'rel_wrote', 'rel_about', 'rel_viewed', 'rel_added_to_cart', 'rel_placed', 'rel_contains', 'rel_follows', 'rel_similar_to', 'rel_recommended_to']

    const fileMap = {}
    for (const f of bulkFiles) {
      const type = detectType(f.name)
      if (type) fileMap[type] = f
    }

    for (const type of [...nodeOrder, ...relOrder]) {
      if (!fileMap[type]) continue
      try {
        const data = await doImport(type, fileMap[type])
        newResults.push({ type: data.type, imported: data.imported, status: 'ok' })
      } catch (e) {
        newResults.push({ type, imported: 0, status: 'error', error: e?.response?.data?.error || e.message })
      }
    }

    setResults(newResults)
    setBulkLoading(false)
    const total = newResults.reduce((s, r) => s + r.imported, 0)
    setMsg({ type: 'ok', text: `Importación masiva completa: ${total} registros en ${newResults.length} archivos` })
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Importación CSV</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Carga masiva de datos desde archivos CSV a Neo4j AuraDB.
      </p>

      {msg && (
        <div style={{ padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13,
          background: msg.type === 'ok' ? '#14532d' : '#450a0a', color: msg.type === 'ok' ? '#86efac' : '#fca5a5' }}>
          {msg.text}
        </div>
      )}

      <Card title="Importar CSV individual">
        <div style={{ marginBottom: 12 }}>
          <div style={lbl}>Tipo de datos</div>
          <select style={inp} value={importType} onChange={e => setImportType(e.target.value)}>
            <optgroup label="Nodos">
              {NODE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </optgroup>
            <optgroup label="Relaciones">
              {REL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </optgroup>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={lbl}>Archivo CSV</div>
          <input type="file" accept=".csv"
            style={{ color: '#e2e8f0', fontSize: 13 }}
            onChange={e => setFile(e.target.files[0])} />
        </div>
        <button style={btn()} disabled={loading} onClick={handleSingle}>
          {loading ? 'Importando...' : 'Importar'}
        </button>
      </Card>

      <Card title="Importación masiva (múltiples CSVs)">
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
          Selecciona todos los CSVs del directorio <code style={{ color: '#38bdf8' }}>data/</code> a la vez.
          Los nombres de archivo deben coincidir exactamente (ej: <code style={{ color: '#38bdf8' }}>users.csv</code>, <code style={{ color: '#38bdf8' }}>rel_purchased.csv</code>).
        </p>
        <div style={{ marginBottom: 16 }}>
          <input type="file" accept=".csv" multiple
            style={{ color: '#e2e8f0', fontSize: 13 }}
            onChange={e => setBulkFiles(Array.from(e.target.files))} />
          {bulkFiles.length > 0 && (
            <p style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>
              {bulkFiles.length} archivos seleccionados: {bulkFiles.map(f => f.name).join(', ')}
            </p>
          )}
        </div>
        <button style={btn('#f59e0b')} disabled={bulkLoading} onClick={handleBulk}>
          {bulkLoading ? 'Importando (esto puede tomar unos minutos)...' : 'Importar Todo'}
        </button>
      </Card>

      {results.length > 0 && (
        <Card title="Resultados de importación">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', borderBottom: '1px solid #334155' }}>Tipo</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8', borderBottom: '1px solid #334155' }}>Importados</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', borderBottom: '1px solid #334155' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b', color: '#e2e8f0' }}>{r.type}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b', color: '#38bdf8', textAlign: 'right' }}>{r.imported}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b' }}>
                    <span style={{ color: r.status === 'error' ? '#ef4444' : '#22c55e', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name={r.status === 'error' ? 'error' : 'check'} size={14} />
                      {r.status === 'error' ? r.error : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
