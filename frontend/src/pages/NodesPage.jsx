import React, { useState } from 'react'
import {
  createNode, getNodes, getNodeById,
  updateNodeProperties, removeNodeProperties, deleteNodes
} from '../api'
import Card from '../components/Card'
import Table from '../components/Table'
import Button from '../components/Button'
import Icon from '../components/Icon'

const LABELS = ['User', 'Product', 'Category', 'Order', 'Review', 'Seller']

const defaultProps = {
  User: '{\n  "userId": "USR99999",\n  "name": "Test User",\n  "email": "test@test.com",\n  "birthDate": "1995-06-15",\n  "isPremium": false,\n  "interests": ["tech","gaming"],\n  "totalSpent": 0.0,\n  "createdAt": "2024-01-01"\n}',
  Product: '{\n  "productId": "PRD99999",\n  "name": "Test Product",\n  "description": "Descripción de prueba",\n  "price": 99.99,\n  "stock": 50,\n  "tags": ["tech","test"],\n  "isActive": true,\n  "createdAt": "2024-01-01"\n}',
  Category: '{\n  "categoryId": "CAT9999",\n  "name": "Test Category",\n  "description": "Categoría de prueba",\n  "level": 1,\n  "isActive": true,\n  "imageUrl": "https://example.com/img.jpg",\n  "createdAt": "2024-01-01"\n}',
  Order: '{\n  "orderId": "ORD99999",\n  "status": "pending",\n  "total": 199.99,\n  "placedAt": "2024-05-01",\n  "deliveredAt": "",\n  "isPaid": false,\n  "notes": "Test order"\n}',
  Review: '{\n  "reviewId": "REV99999",\n  "rating": 5,\n  "comment": "Excelente producto",\n  "createdAt": "2024-01-01",\n  "isVerified": true,\n  "helpfulVotes": 0,\n  "sentiment": "positive"\n}',
  Seller: '{\n  "sellerId": "SEL9999",\n  "name": "Test Seller",\n  "email": "seller@test.com",\n  "rating": 4.5,\n  "joinedAt": "2020-01-01",\n  "isVerified": true,\n  "country": "Guatemala"\n}',
}

const btn = (color = '#38bdf8') => ({
  background: color, color: '#0f172a', border: 'none', borderRadius: 6,
  padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
})
const inp = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 6,
  color: '#e2e8f0',
  padding: '8px 12px',
  fontSize: 13,
  width: '100%',
  transition: 'all 0.2s ease',
  outline: 'none',
}
const inpFocusStyle = {
  borderColor: '#38bdf8',
  boxShadow: '0 0 0 3px rgba(56, 189, 248, 0.1)',
}
const ta = { ...inp, fontFamily: 'monospace', resize: 'vertical' }
const row = { display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 12 }
const label = { color: '#94a3b8', fontSize: 12, marginBottom: 4 }

export default function NodesPage() {
  const [activeTab, setActiveTab] = useState('create')
  const [msg, setMsg] = useState(null)
  const [result, setResult] = useState(null)

  // Create
  const [createLabel, setCreateLabel] = useState('User')
  const [extraLabel, setExtraLabel] = useState('')
  const [createProps, setCreateProps] = useState(defaultProps['User'])

  // Read
  const [readLabel, setReadLabel] = useState('User')
  const [readId, setReadId] = useState('')
  const [filterName, setFilterName] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [readLimit, setReadLimit] = useState('20')

  // Update
  const [updLabel, setUpdLabel] = useState('User')
  const [updIds, setUpdIds] = useState('USR00001')
  const [updProps, setUpdProps] = useState('{"isPremium": true}')

  // Remove props
  const [remLabel, setRemLabel] = useState('User')
  const [remIds, setRemIds] = useState('USR00001')
  const [remKeys, setRemKeys] = useState('email')

  // Delete
  const [delLabel, setDelLabel] = useState('User')
  const [delIds, setDelIds] = useState('USR00001')

  const ok = (data, count) => {
    setMsg({ type: 'ok', text: `Operación exitosa${count !== undefined ? ` — ${count} registro(s)` : ''}` })
    setResult(Array.isArray(data) ? data : [data])
  }
  const err = (e) => setMsg({ type: 'err', text: e?.response?.data?.error || e.message })

  const tabs = ['create', 'read', 'update', 'delete']
  const tabLabel = { create: 'Crear', read: 'Leer', update: 'Actualizar/Eliminar Props', delete: 'Eliminar Nodos' }

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Gestión de Nodos</h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <Button
              key={t}
              color={t === activeTab ? '#38bdf8' : '#334155'}
              onClick={() => { setActiveTab(t); setMsg(null); setResult(null) }}
              style={{ color: t === activeTab ? '#0f172a' : '#e2e8f0' }}
            >
              {tabLabel[t]}
            </Button>
          ))}
        </div>

        {msg && (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 13,
              background: msg.type === 'ok' ? '#14532d' : '#450a0a',
              color: msg.type === 'ok' ? '#86efac' : '#fca5a5',
              border: `1px solid ${msg.type === 'ok' ? '#22c55e' : '#ef4444'}`,
              animation: 'fadeInDown 0.3s ease',
              boxShadow: msg.type === 'ok'
                ? '0 4px 12px rgba(34, 197, 94, 0.2)'
                : '0 4px 12px rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Icon name={msg.type === 'ok' ? 'check' : 'error'} size={16} />
            {msg.text}
          </div>
        )}

      {/* CREATE */}
      {activeTab === 'create' && (
        <div>
          <Card title="Crear nodo con 1 label">
            <div style={row}>
              <div style={{ flex: 1 }}>
                <div style={label}>Label principal</div>
                <select style={inp} value={createLabel}
                  onChange={e => { setCreateLabel(e.target.value); setCreateProps(defaultProps[e.target.value] || '{}') }}>
                  {LABELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={label}>Label adicional (opcional — para 2+ labels)</div>
                <input style={inp} placeholder="ej: FeaturedProduct" value={extraLabel}
                  onChange={e => setExtraLabel(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={label}>Propiedades (JSON)</div>
              <textarea style={{ ...ta, height: 180 }} value={createProps}
                onChange={e => setCreateProps(e.target.value)} />
            </div>
            <Button onClick={async () => {
              try {
                const labels = [createLabel, ...(extraLabel ? [extraLabel] : [])]
                const res = await createNode(labels, JSON.parse(createProps))
                ok(res.data.data)
              } catch (e) { err(e) }
            }}>
              Crear Nodo {extraLabel ? '(2 labels)' : '(1 label)'}
            </Button>
          </Card>
          {result && <Card title="Resultado"><Table rows={result} /></Card>}
        </div>
      )}

      {/* READ */}
      {activeTab === 'read' && (
        <div>
          <Card title="Consultar nodos con filtros">
            <div style={row}>
              <div style={{ flex: 1 }}>
                <div style={label}>Label</div>
                <select style={inp} value={readLabel} onChange={e => setReadLabel(e.target.value)}>
                  {LABELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={label}>Buscar por nombre (contiene)</div>
                <input style={inp} placeholder="ej: Sony" value={filterName} onChange={e => setFilterName(e.target.value)} />
              </div>
            </div>
            <div style={row}>
              <div style={{ flex: 1 }}>
                <div style={label}>Precio mínimo</div>
                <input style={inp} type="number" placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={label}>Precio máximo</div>
                <input style={inp} type="number" placeholder="9999" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={label}>Límite</div>
                <input style={inp} type="number" value={readLimit} onChange={e => setReadLimit(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <Button onClick={async () => {
                try {
                  const params = { limit: readLimit }
                  if (filterName) params.name = filterName
                  if (minPrice) params.minPrice = minPrice
                  if (maxPrice) params.maxPrice = maxPrice
                  const res = await getNodes(readLabel, params)
                  ok(res.data.data, res.data.count)
                } catch (e) { err(e) }
              }}>
                Consultar Muchos
              </Button>

              <div style={{ flex: 1 }}>
                <input style={inp} placeholder="ID específico (ej: USR00001)" value={readId}
                  onChange={e => setReadId(e.target.value)} />
              </div>
              <Button color="#a78bfa" onClick={async () => {
                try {
                  const res = await getNodeById(readId, readLabel)
                  ok(res.data.data)
                } catch (e) { err(e) }
              }}>
                Consultar 1 Nodo
              </Button>
            </div>
          </Card>
          {result && <Card title={`Resultados (${result.length})`}><Table rows={result} /></Card>}
        </div>
      )}

      {/* UPDATE */}
      {activeTab === 'update' && (
        <div>
          <Card title="Actualizar / Agregar propiedades (1 o múltiples nodos)">
            <div style={row}>
              <div style={{ flex: 1 }}>
                <div style={label}>Label</div>
                <select style={inp} value={updLabel} onChange={e => setUpdLabel(e.target.value)}>
                  {LABELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <div style={label}>IDs (separados por coma)</div>
                <input style={inp} value={updIds} onChange={e => setUpdIds(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={label}>Propiedades a actualizar (JSON)</div>
              <textarea style={{ ...ta, height: 80 }} value={updProps}
                onChange={e => setUpdProps(e.target.value)} />
            </div>
            <Button color="#34d399" onClick={async () => {
              try {
                const ids = updIds.split(',').map(s => s.trim()).filter(Boolean)
                const res = await updateNodeProperties(updLabel, ids, JSON.parse(updProps))
                ok(res.data.data, res.data.count)
              } catch (e) { err(e) }
            }}>
              Actualizar Propiedades
            </Button>
          </Card>

          <Card title="Eliminar propiedades (1 o múltiples nodos)">
            <div style={row}>
              <div style={{ flex: 1 }}>
                <div style={label}>Label</div>
                <select style={inp} value={remLabel} onChange={e => setRemLabel(e.target.value)}>
                  {LABELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <div style={label}>IDs (separados por coma)</div>
                <input style={inp} value={remIds} onChange={e => setRemIds(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={label}>Propiedades a eliminar (separadas por coma)</div>
              <input style={inp} value={remKeys} onChange={e => setRemKeys(e.target.value)} />
            </div>
            <Button color="#f87171" onClick={async () => {
              try {
                const ids = remIds.split(',').map(s => s.trim()).filter(Boolean)
                const keys = remKeys.split(',').map(s => s.trim()).filter(Boolean)
                const res = await removeNodeProperties(remLabel, ids, keys)
                ok(res.data.data, res.data.count)
              } catch (e) { err(e) }
            }}>
              Eliminar Propiedades
            </Button>
          </Card>

          {result && <Card title="Resultado"><Table rows={result} /></Card>}
        </div>
      )}

      {/* DELETE */}
      {activeTab === 'delete' && (
        <div>
          <Card title="Eliminar nodos (1 o múltiples)">
            <div style={row}>
              <div style={{ flex: 1 }}>
                <div style={label}>Label</div>
                <select style={inp} value={delLabel} onChange={e => setDelLabel(e.target.value)}>
                  {LABELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <div style={label}>IDs (separados por coma)</div>
                <input style={inp} value={delIds} onChange={e => setDelIds(e.target.value)}
                  placeholder="USR00001, USR00002" />
              </div>
            </div>
            <Button color="#ef4444" onClick={async () => {
              try {
                const ids = delIds.split(',').map(s => s.trim()).filter(Boolean)
                const res = await deleteNodes(delLabel, ids)
                ok(res.data.data)
                setResult(null)
              } catch (e) { err(e) }
            }}>
              Eliminar Nodos
            </Button>
          </Card>
        </div>
      )}
      </div>
    </>
  )
}
