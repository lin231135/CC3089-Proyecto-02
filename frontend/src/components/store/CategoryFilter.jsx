import React, { useState, useEffect } from 'react'
import { getNodes } from '../../api'
import Icon from '../Icon'

export default function CategoryFilter({ selected, onChange }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await getNodes('Category')
      setCategories(res.data.data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ color: '#94a3b8', fontSize: 14 }}>Cargando categorías...</div>
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: '#f1f5f9',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <Icon name="tag" size={18} color="#38bdf8" />
        Categorías
      </h3>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <button
          onClick={() => onChange(null)}
          style={{
            padding: '8px 16px',
            background: !selected 
              ? 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)' 
              : '#1e293b',
            color: !selected ? '#fff' : '#94a3b8',
            border: `1px solid ${!selected ? '#38bdf8' : '#334155'}`,
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Todas
        </button>
        {categories.map(cat => (
          <button
            key={cat.categoryId}
            onClick={() => onChange(cat.categoryId)}
            style={{
              padding: '8px 16px',
              background: selected === cat.categoryId 
                ? 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)' 
                : '#1e293b',
              color: selected === cat.categoryId ? '#fff' : '#94a3b8',
              border: `1px solid ${selected === cat.categoryId ? '#38bdf8' : '#334155'}`,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}
