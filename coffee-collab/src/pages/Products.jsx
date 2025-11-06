// Products page
import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { getAllProducts } from '../services/productService'
import { NewProductModal } from '../components/NewProductModal'
import { EditProductModal } from '../components/EditProductModal'
import { ensureImageUrl } from '../services/googleDriveService'

export function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewProductModal, setShowNewProductModal] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [nameFilter, setNameFilter] = useState('')
  const [minRating, setMinRating] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('name') // 'name', 'rating', 'price'
  const [sortOrder, setSortOrder] = useState('asc') // 'asc', 'desc'
  const [allProducts, setAllProducts] = useState([])

  const loadProducts = async () => {
    try {
      const productsList = await getAllProducts()
      setAllProducts(productsList)
      applyFiltersAndSort(productsList, nameFilter, minRating, maxPrice, sortBy, sortOrder)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSort = (productsList, name, rating, price, sortField, sortDirection) => {
    let filtered = [...productsList]
    
    // Apply filters
    if (name) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(name.toLowerCase())
      )
    }
    if (rating) {
      const minRatingValue = parseFloat(rating)
      filtered = filtered.filter(p => (p.averageRating || 0) >= minRatingValue)
    }
    if (price) {
      const maxPriceValue = parseFloat(price)
      filtered = filtered.filter(p => (p.averagePricePerKg || 0) <= maxPriceValue)
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortField === 'rating') {
        comparison = (a.averageRating || 0) - (b.averageRating || 0)
      } else if (sortField === 'price') {
        comparison = (a.averagePricePerKg || 0) - (b.averagePricePerKg || 0)
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    setProducts(filtered)
  }

  useEffect(() => {
    if (allProducts.length > 0) {
      applyFiltersAndSort(allProducts, nameFilter, minRating, maxPrice, sortBy, sortOrder)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameFilter, minRating, maxPrice, sortBy, sortOrder, allProducts.length])

  useEffect(() => {
    loadProducts()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '48px', color: '#FFF' }}>
          <p>Carregando...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '32px', color: '#FFF', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)' }}>
              Produtos
            </h1>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '12px 24px',
                  background: showFilters ? '#8B4513' : '#FFF',
                  color: showFilters ? '#FFF' : '#8B4513',
                  border: '2px solid #8B4513',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
              >
                {showFilters ? 'Ocultar Filtros' : 'Filtrar'}
              </button>
              <button
                onClick={() => setShowNewProductModal(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #A0522D 0%, #D2691E 100%)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
              >
                + Novo Produto
              </button>
            </div>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                marginBottom: '24px'
              }}
            >
              <h3 style={{ fontSize: '20px', color: '#8B4513', marginBottom: '16px' }}>Filtros e Ordenação</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold', fontSize: '14px' }}>
                    Nome
                  </label>
                  <input
                    type="text"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder="Buscar por nome..."
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '2px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold', fontSize: '14px' }}>
                    Rating Mínimo (⭐)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    placeholder="0.0"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '2px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold', fontSize: '14px' }}>
                    Preço Máximo (R$/🍰)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Ex: 100.00"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '2px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold', fontSize: '14px' }}>
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: '8px',
                      border: '2px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#FFF'
                    }}
                  >
                    <option value="name">Nome</option>
                    <option value="rating">Rating</option>
                    <option value="price">Preço Médio</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold', fontSize: '14px' }}>
                    Ordem
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    style={{
                      padding: '8px',
                      border: '2px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#FFF'
                    }}
                  >
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                  </select>
                </div>
                <div style={{ marginTop: '24px' }}>
                  <button
                    onClick={() => {
                      setNameFilter('')
                      setMinRating('')
                      setMaxPrice('')
                      setSortBy('name')
                      setSortOrder('asc')
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#FFF',
                      color: '#8B4513',
                      border: '2px solid #8B4513',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '48px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              textAlign: 'center'
            }}
          >
            <p style={{ fontSize: '18px', color: '#666' }}>
              Nenhum produto cadastrado ainda.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  transition: 'transform 150ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {product.photoURL && (
                  <img
                    src={ensureImageUrl(product.photoURL)}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}
                    onError={(e) => {
                      console.error('Error loading image:', product.photoURL)
                      e.target.style.display = 'none'
                    }}
                  />
                )}
                <h3 style={{ fontSize: '20px', color: '#8B4513', marginBottom: '8px' }}>
                  {product.name}
                </h3>
                {product.description && (
                  <p style={{ color: '#666', marginBottom: '12px', fontSize: '14px' }}>
                    {product.description}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#8B4513', fontWeight: 'bold' }}>
                      R$ {product.averagePricePerKg?.toFixed(2) || '0.00'}/🍰
                    </div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      {product.averageRating?.toFixed(1) || '0.0'} ⭐
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingProductId(product.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#FFF',
                      color: '#8B4513',
                      border: '2px solid #8B4513',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewProductModal
        isOpen={showNewProductModal}
        onClose={() => setShowNewProductModal(false)}
        onSuccess={() => {
          loadProducts()
        }}
      />

      {editingProductId && (
        <EditProductModal
          isOpen={!!editingProductId}
          productId={editingProductId}
          onClose={() => setEditingProductId(null)}
          onSuccess={() => {
            loadProducts()
            setEditingProductId(null)
          }}
        />
      )}
    </Layout>
  )
}

