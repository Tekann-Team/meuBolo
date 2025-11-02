// Votes page
import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { getAllProducts } from '../services/productService'
import { getVotesByUser, createOrUpdateVote } from '../services/voteService'
import { ensureImageUrl } from '../services/googleDriveService'

export function Votes() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [userVotes, setUserVotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [nameFilter, setNameFilter] = useState('')
  const [minRating, setMinRating] = useState('')
  const [sortBy, setSortBy] = useState('name') // 'name', 'rating'
  const [sortOrder, setSortOrder] = useState('asc') // 'asc', 'desc'
  const [allProducts, setAllProducts] = useState([])

  const applyFiltersAndSort = (productsList, name, rating, sortField, sortDirection, votes) => {
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
    
    // Apply sorting - keep products without votes first, then apply sorting within each group
    const productsWithoutVote = filtered.filter(p => !votes[p.id])
    const productsWithVote = filtered.filter(p => votes[p.id])
    
    const sortProducts = (productList) => {
      return [...productList].sort((a, b) => {
        let comparison = 0
        
        if (sortField === 'name') {
          comparison = a.name.localeCompare(b.name)
        } else if (sortField === 'rating') {
          comparison = (a.averageRating || 0) - (b.averageRating || 0)
        }
        
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }
    
    const sortedWithout = sortProducts(productsWithoutVote)
    const sortedWith = sortProducts(productsWithVote)
    
    setProducts([...sortedWithout, ...sortedWith])
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsList, votes] = await Promise.all([
          getAllProducts(),
          user ? getVotesByUser(user.uid) : Promise.resolve([])
        ])
        
        setAllProducts(productsList)
        
        const votesMap = {}
        votes.forEach(vote => {
          votesMap[vote.productId] = vote.rating
        })
        setUserVotes(votesMap)
        
        applyFiltersAndSort(productsList, nameFilter, minRating, sortBy, sortOrder, votesMap)
      } catch (error) {
        console.error('Error loading votes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  useEffect(() => {
    if (allProducts.length > 0) {
      applyFiltersAndSort(allProducts, nameFilter, minRating, sortBy, sortOrder, userVotes)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameFilter, minRating, sortBy, sortOrder, allProducts.length, Object.keys(userVotes).length])

  const handleVote = async (productId, rating) => {
    if (!user) return
    
    try {
      await createOrUpdateVote(user.uid, productId, rating)
      
      // Update local state
      setUserVotes(prev => ({
        ...prev,
        [productId]: rating
      }))
      
      // Refresh products to update average rating
      const updatedProducts = await getAllProducts()
      setAllProducts(updatedProducts)
      applyFiltersAndSort(updatedProducts, nameFilter, minRating, sortBy, sortOrder, {
        ...userVotes,
        [productId]: rating
      })
    } catch (error) {
      console.error('Error voting:', error)
      alert('Erro ao votar')
    }
  }

  const renderStars = (productId, currentRating) => {
    const stars = []
    const handleStarClick = (rating) => {
      handleVote(productId, rating)
    }
    
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= currentRating
      stars.push(
        <span
          key={i}
          onClick={() => handleStarClick(i)}
          style={{
            fontSize: '32px',
            cursor: 'pointer',
            color: isFilled ? '#FFD700' : '#DDD',
            transition: 'all 150ms ease',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            if (!isFilled) {
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.color = '#FFD700'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            if (!isFilled) {
              e.currentTarget.style.color = '#DDD'
            }
          }}
        >
          ★
        </span>
      )
    }
    return stars
  }

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
              Votações
            </h1>
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
          <div style={{ display: 'grid', gap: '16px' }}>
            {products.map((product) => {
              const userVote = userVotes[product.id] || 0
              const hasVoted = userVote > 0
              
              return (
                <div
                  key={product.id}
                  style={{
                    background: hasVoted 
                      ? 'rgba(255, 255, 255, 0.95)'
                      : 'rgba(255, 248, 231, 0.95)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: hasVoted 
                      ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                      : '0 4px 12px rgba(218, 165, 32, 0.3)',
                    border: hasVoted ? 'none' : '2px solid #DAA520'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    {product.photoURL && (
                      <img
                        src={ensureImageUrl(product.photoURL)}
                        alt={product.name}
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '8px',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          console.error('Error loading image:', product.photoURL)
                          e.target.style.display = 'none'
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '20px', color: '#8B4513', marginBottom: '4px' }}>
                        {product.name}
                      </h3>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                        Média: {product.averageRating.toFixed(1)} ⭐ | R$ {product.averagePricePerKg.toFixed(2)}/kg
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    {renderStars(product.id, userVote)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

