import React, { useState } from 'react'
import {
  createRelationship, getRelationships,
  updateRelProperties, removeRelProperties, deleteRelationships
} from '../api'
import Card from '../components/Card'
import Table from '../components/Table'

const REL_TYPES = [
  'PURCHASED', 'WROTE', 'ABOUT', 'VIEWED', 'ADDED_TO_CART',
  'BELONGS_TO', 'SIMILAR_TO', 'PLACED', 'CONTAINS',
  'SELLS', 'FOLLOWS', 'RECOMMENDED_TO', 'SUBCATEGORY_OF',
]
const LABELS = ['User', 'Product', 'Category', 'Order', 'Review', 'Seller']

const relDefaults = {
  PURCHASED: { fromLabel: 'User', toLabel: 'Product', props: '{\n  "purchasedAt": "2024-05-01",\n  "quantity": 2,\n  "unitPrice": 99.99\n}' },
  WROTE: { fromLabel: 'User', toLabel: 'Review', props: '{\n  "createdAt": "2024-05-01",\n  "verified": true,\n  "platform": "web"\n}' },
  ABOUT: { fromLabel: 'Review', toLabel: 'Product', props: '{\n  "rating": 5,\n  "sentiment": "positive",\n  "helpfulVotes": 0\n}' },
  VIEWED: { fromLabel: 'User', toLabel: 'Product', props: '{\n  "viewedAt": "2024-05-01",\n  "duration": 60,\n  "source": "search"\n}' },
  ADDED_TO_CART: { fromLabel: 'User', toLabel: 'Product', props: '{\n  "addedAt": "2024-05-01",\n  "quantity": 1,\n  "savedForLater": false\n}' },
  BELONGS_TO: { fromLabel: 'Product', toLabel: 'Category', props: '{\n  "assignedAt": "2024-01-01",\n  "isPrimary": true,\n  "rank": 1\n}' },
  SIMILAR_TO: { fromLabel: 'Product', toLabel: 'Product', props: '{\n  "similarityScore": 0.85,\n  "algorithm": "content-based",\n  "computedAt": "2024-01-01"\n}' },
  PLACED: { fromLabel: 'User', toLabel: 'Order', props: '{\n  "placedAt": "2024-05-01",\n  "channel": "web",\n  "promoCode": ""\n}' },
  CONTAINS: { fromLabel: 'Order', toLabel: 'Product', props: '{\n  "quantity": 1,\n  "unitPrice": 99.99,\n  "discount": 0.0\n}' },
  SELLS: { fromLabel: 'Seller', toLabel: 'Product', props: '{\n  "listedAt": "2024-01-01",\n  "sellerPrice": 89.99,\n  "isActive": true\n}' },
  FOLLOWS: { fromLabel: 'User', toLabel: 'Seller', props: '{\n  "followedAt": "2024-05-01",\n  "notifications": true,\n  "tier": "standard"\n}' },
  RECOMMENDED_TO: { fromLabel: 'Product', toLabel: 'User', props: '{\n  "score": 0.92,\n  "algorithm": "hybrid",\n  "generatedAt": "2024-05-01"\n}' },
  SUBCATEGORY_OF: { fromLabel: 'Category', toLabel: 'Category', props: '{\n  "createdAt": "2024-01-01",\n  "rank": 1,\n  "isActive": true\n}' },
}

const btn = (color = '#38bdf8') => ({
  background: color, color: '#0f172a', border: 'none', borderRadius: 6,
  padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
})
const inp = { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', padding: '8px 12px', fontSize: 13, width: '100%' }
const ta = { ...inp, fontFamily: 'monospace', resize: 'vertical' }
const row = { display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 12 }
const lbl = { color: '#94a3b8', fontSize: 12, marginBottom: 4 }

export default function RelationshipsPage() {
  const [activeTab, setActiveTab] = useState('create')
  const [msg, setMsg] = useState(null)
  const [result, setResult] = useState(null)

  // Create
  const [relType, setRelType] = useState('PURCHASED')
  const [fromLabel, setFromLabel] = useState('User')
  const [fromId, setFromId] = useState('USR00001')
  const [toLabel, setToLabel] = useState('Product')
  const [toId, setToId] = useState('PRD00001')
  const [relProps, setRelProps] = useState(relDefaults['PURCHASED'].props)

  // Read
  const [readType, setReadType] = useState('PURCHASED')
  const [readLimit, setReadLimit] = useState('20')

  // Update
  const [updEids, setUpdEids] = useState('')
  const [updProps, setUpdProps] = useState('{"quantity": 3}')

  // Remove props
  const [remEids, setRemEids] = useState('')
  const [remKeys, setRemKeys] = useState('discount')

  // Delete
  const [delEids, setDelEids] = useState('')

  const ok = (data, count) => {
    setMsg({ type: 'ok', text: `Éxito${count !== undefined ? ` — ${count} registro(s)` : ''}` })
    setResult(Array.isArray(data) ? data : [data])
  }
  const errMsg = (e) => setMsg({ type: 'err', text: e?.response?.data?.error || e.message })

  const tabs = ['create', 'read', 'update', 'delete']
  const tabLabels = { create: 'Crear', read: 'Consultar', update: 'Gestionar Props', delete: 'Eliminar' }

  const handleRelTypeChange = (type) => {
    setRelType(type)
    const def = relDefaults[type]
    if (def) {
      setFromLabel(def.fromLabel)
      setToLabel(def.toLabel)
      setRelProps(def.props)
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Gestión de Relaciones</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t} style={{ ...btn(t === activeTab ? '#38bdf8' : '#334155'), color: t === activeTab ? '#0f172a' : '#e2e8f0' }}
            onClick={() => { setActiveTab(t); setMsg(null); setResult(null) }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13,
          background: msg.type === 'ok' ? '#14532d' : '#450a0a', color: msg.type === 'ok' ? '#86efac' : '#fca5a5' }}>
          {msg.text}
        </div>
      )}

      {/* CREATE */}
      {activeTab === 'create' && (
        <div>
          <Card title="Crear relación con propiedades">
            <div style={row}>
              <div style={{ flex: 1 }}>
                <div style={lbl}>Tipo de relación</div>
                <select style={inp} value={relType} onChange={e => handleRelTypeChange(e.target.value)}>
                  {REL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={row}>
              <div style={{ flex: 1 }}>
                <div style={lbl}>Label origen</div>
                <select style={inp} value={fromLabel} onChange={e => setFromLabel(e.target.value)}>
                  {LABELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <div style={lbl}>ID origen</div>
                <input style={inp} value={fromId} onChange={e => setFromId(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={lbl}>Label destino</div>
                <select style={inp} value={toLabel} onChange={e => setToLabel(e.target.value)}>
                  {LABELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <div style={lbl}>ID destino</div>
                <input style={inp} value={toId} onChange={e => setToId(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={lbl}>Propiedades (JSON — mínimo 3)</div>
              <textarea style={{ ...ta, height: 120 }} value={relProps}
                onChange={e => setRelProps(e.target.value)} />
            </div>
            <button style={btn()} onClick={async () => {
              try {
                const res = await createRelationship({ type: relType, fromLabel, fromId, toLabel, toId, properties: JSON.parse(relProps) })
                ok(res.data.data)
              } catch (e) { errMsg(e) }
            }}>Crear Relación</button>
          </Card>
          {result && <Card title="Resultado"><Table rows={result} /></Card>}
        </div>
      )}

      {/* READ */}
      {activeTab === 'read' && (
        <div>
          <Card title="Consultar relaciones">
            <div style={row}>
              <div style={{ flex: 1 }}>
                <div style={lbl}>Tipo</div>
                <select style={inp} value={readType} onChange={e => setReadType(e.target.value)}>
                  {REL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={lbl}>Límite</div>
                <input style={inp} type="number" value={readLimit} onChange={e => setReadLimit(e.target.value)} />
              </div>
            </div>
            <button style={btn()} onClick={async () => {
              try {
                const res = await getRelationships({ type: readType, limit: readLimit })
                ok(res.data.data, res.data.count)
              } catch (e) { errMsg(e) }
            }}>Consultar</button>
          </Card>
          {result && <Card title={`Resultados (${result.length})`}><Table rows={result} /></Card>}
        </div>
      )}

      {/* UPDATE */}
      {activeTab === 'update' && (
        <div>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
            Para obtener el elementId de una relación, consulta primero en la pestaña "Consultar" y copia el campo <code style={{ color: '#38bdf8' }}>_elementId</code>.
          </p>
          <Card title="Agregar / Actualizar propiedades de relaciones">
            <div style={{ marginBottom: 12 }}>
              <div style={lbl}>Element IDs (separados por coma)</div>
              <input style={inp} value={updEids} onChange={e => setUpdEids(e.target.value)}
                placeholder="4:abc:1, 4:abc:2" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={lbl}>Propiedades a actualizar (JSON)</div>
              <textarea style={{ ...ta, height: 80 }} value={updProps} onChange={e => setUpdProps(e.target.value)} />
            </div>
            <button style={btn('#34d399')} onClick={async () => {
              try {
                const eids = updEids.split(',').map(s => s.trim()).filter(Boolean)
                const res = await updateRelProperties(eids, JSON.parse(updProps))
                ok(res.data.data, res.data.count)
              } catch (e) { errMsg(e) }
            }}>Actualizar</button>
          </Card>

          <Card title="Eliminar propiedades de relaciones">
            <div style={{ marginBottom: 12 }}>
              <div style={lbl}>Element IDs (separados por coma)</div>
              <input style={inp} value={remEids} onChange={e => setRemEids(e.target.value)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={lbl}>Propiedades a eliminar (separadas por coma)</div>
              <input style={inp} value={remKeys} onChange={e => setRemKeys(e.target.value)} />
            </div>
            <button style={btn('#f87171')} onClick={async () => {
              try {
                const eids = remEids.split(',').map(s => s.trim()).filter(Boolean)
                const keys = remKeys.split(',').map(s => s.trim()).filter(Boolean)
                const res = await removeRelProperties(eids, keys)
                ok(res.data.data, res.data.count)
              } catch (e) { errMsg(e) }
            }}>Eliminar Props</button>
          </Card>

          {result && <Card title="Resultado"><Table rows={result} /></Card>}
        </div>
      )}

      {/* DELETE */}
      {activeTab === 'delete' && (
        <div>
          <Card title="Eliminar relaciones (1 o múltiples)">
            <div style={{ marginBottom: 12 }}>
              <div style={lbl}>Element IDs (separados por coma)</div>
              <input style={inp} value={delEids} onChange={e => setDelEids(e.target.value)}
                placeholder="4:abc:1, 4:abc:2" />
            </div>
            <button style={btn('#ef4444')} onClick={async () => {
              try {
                const eids = delEids.split(',').map(s => s.trim()).filter(Boolean)
                const res = await deleteRelationships(eids)
                ok(res.data.data)
                setResult(null)
              } catch (e) { errMsg(e) }
            }}>Eliminar Relaciones</button>
          </Card>
        </div>
      )}
    </div>
  )
}
