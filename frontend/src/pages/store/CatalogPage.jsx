import React, { useState, useEffect } from 'react'
import { getNodes, runQuery } from '../../api'
import { useCart } from '../../context/CartContext'
import ProductCard from '../../components/store/ProductCard'
import CategoryFilter from '../../components/store/CategoryFilter'
import Icon from '../../components/Icon'

export default function CatalogPage() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [sortBy, setSortBy] = useState('name')
  const { addToCart } = useCart()

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [products, selectedCategory, searchTerm, priceRange, sortBy])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await getNodes('Product')
      setProducts(res.data.data || [])
    } catch (err) {
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...products]

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(term)))
      )
    }

    // Filter by price range
    if (priceRange.min !== '') {
      filtered = filtered.filter(p => p.price >= parseFloat(priceRange.min))
    }
    if (priceRange.max !== '') {
      filtered = filtered.filter(p => p.price <= parseFloat(priceRange.max))
    }

    // Filter by category (this would require a relationship query in real scenario)
    // For now, we'll filter by tags if category is selected
    if (selectedCategory) {
      // In a real scenario, we'd query products that BELONG_TO this category
      // For demo, we'll use tags or make an API call
      // filtered = filtered based on BELONGS_TO relationship
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredProducts(filtered)
  }

  const handleAddToCart = (product) => {
    addToCart(product)
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
          <Icon name="package" size={32} color="#38bdf8" />
          Catálogo de Productos
        </h1>
        <p style={{ fontSize: 16, color: '#94a3b8', margin: 0 }}>
          Explora nuestro catálogo completo con {products.length} productos disponibles
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid #334155',
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
      }}>
        {/* Search bar */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: '#f1f5f9',
            marginBottom: 8,
          }}>
            Buscar productos
          </label>
          <div style={{ position: 'relative' }}>
            <Icon 
              name="search" 
              size={18} 
              color="#94a3b8"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              type="text"
              placeholder="Buscar por nombre, descripción o etiquetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f1f5f9',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Category filter */}
        <CategoryFilter
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />

        {/* Price range and sort */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginTop: 24,
        }}>
          {/* Min price */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#f1f5f9',
              marginBottom: 8,
            }}>
              Precio mínimo
            </label>
            <input
              type="number"
              placeholder="$0"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f1f5f9',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {/* Max price */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#f1f5f9',
              marginBottom: 8,
            }}>
              Precio máximo
            </label>
            <input
              type="number"
              placeholder="$999999"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f1f5f9',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {/* Sort by */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#f1f5f9',
              marginBottom: 8,
            }}>
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f1f5f9',
                fontSize: 14,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="name">Nombre (A-Z)</option>
              <option value="price-asc">Precio (menor a mayor)</option>
              <option value="price-desc">Precio (mayor a menor)</option>
            </select>
          </div>
        </div>

        {/* Clear filters */}
        {(searchTerm || priceRange.min || priceRange.max || selectedCategory) && (
          <button
            onClick={() => {
              setSearchTerm('')
              setPriceRange({ min: '', max: '' })
              setSelectedCategory(null)
            }}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Icon name="x" size={16} /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Results count */}
      <div style={{
        marginBottom: 24,
        fontSize: 16,
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <Icon name="check" size={18} color="#38bdf8" />
        Mostrando {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
      </div>

      {/* Products grid */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: 60,
          color: '#94a3b8',
          fontSize: 16,
        }}>
          <Icon name="loader" size={32} color="#38bdf8" />
          <p style={{ marginTop: 16 }}>Cargando productos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 60,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid #334155',
          borderRadius: 16,
        }}>
          <Icon name="package" size={48} color="#475569" />
          <h3 style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#f1f5f9',
            marginTop: 16,
            marginBottom: 8,
          }}>
            No se encontraron productos
          </h3>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            Intenta ajustar los filtros o realizar otra búsqueda
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
        }}>
          {filteredProducts.map(product => (
            <ProductCard
              key={product.productId}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  )
}
