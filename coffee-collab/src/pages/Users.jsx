// Users page - Admin only
import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { useUserProfile } from '../hooks/useUserProfile'
import { getAllUsers, updateUserProfile, deleteUser } from '../services/userService'
import { useAuth } from '../hooks/useAuth'

export function Users() {
  const { profile } = useUserProfile()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [nameFilter, setNameFilter] = useState('')
  const [emailFilter, setEmailFilter] = useState('')
  const [adminFilter, setAdminFilter] = useState('') // 'all', 'admin', 'not-admin'
  const [activeFilter, setActiveFilter] = useState('') // 'all', 'active', 'inactive'
  const [sortBy, setSortBy] = useState('name') // 'name', 'email', 'created'
  const [sortOrder, setSortOrder] = useState('asc') // 'asc', 'desc'
  const [allUsers, setAllUsers] = useState([])

  const loadUsers = async () => {
    try {
      const usersList = await getAllUsers()
      setAllUsers(usersList)
      applyFiltersAndSort(usersList, nameFilter, emailFilter, adminFilter, activeFilter, sortBy, sortOrder)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSort = (usersList, name, email, admin, active, sortField, sortDirection) => {
    let filtered = [...usersList]
    
    // Apply filters
    if (name) {
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(name.toLowerCase())
      )
    }
    if (email) {
      filtered = filtered.filter(u => 
        u.email?.toLowerCase().includes(email.toLowerCase())
      )
    }
    if (admin === 'admin') {
      filtered = filtered.filter(u => u.isAdmin)
    } else if (admin === 'not-admin') {
      filtered = filtered.filter(u => !u.isAdmin)
    }
    if (active === 'active') {
      filtered = filtered.filter(u => u.isActive)
    } else if (active === 'inactive') {
      filtered = filtered.filter(u => !u.isActive)
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      if (sortField === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '')
      } else if (sortField === 'email') {
        comparison = (a.email || '').localeCompare(b.email || '')
      } else if (sortField === 'created') {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
        comparison = dateA - dateB
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    setUsers(filtered)
  }

  useEffect(() => {
    if (allUsers.length > 0) {
      applyFiltersAndSort(allUsers, nameFilter, emailFilter, adminFilter, activeFilter, sortBy, sortOrder)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameFilter, emailFilter, adminFilter, activeFilter, sortBy, sortOrder, allUsers.length])

  useEffect(() => {
    loadUsers()
  }, [])

  const handleToggleFlag = async (userId, flagName, currentValue) => {
    if (saving) return
    
    setSaving(true)
    try {
      await updateUserProfile(userId, {
        [flagName]: !currentValue
      })
      // Reload users to reflect changes
      await loadUsers()
      alert(`${flagName === 'isAdmin' ? 'Status de administrador' : 'Status de ativo'} atualizado com sucesso!`)
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Erro ao atualizar usuário. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (saving) return
    
    // Prevent deleting yourself
    if (userId === currentUser?.uid) {
      alert('Você não pode deletar seu próprio usuário.')
      return
    }
    
    if (!confirm(`Tem certeza que deseja deletar o usuário "${userName}"?\n\nEsta ação não pode ser desfeita.`)) {
      return
    }
    
    setSaving(true)
    try {
      await deleteUser(userId)
      await loadUsers()
      alert('Usuário deletado com sucesso!')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Erro ao deletar usuário. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !profile) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '48px', color: '#FFF' }}>
          <p>Carregando...</p>
        </div>
      </Layout>
    )
  }

  // This page should be protected by route, but double-check
  if (!profile.isAdmin) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '48px', color: '#FFF' }}>
          <p>Acesso negado. Apenas administradores podem acessar esta página.</p>
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
              Usuários
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
                    Email
                  </label>
                  <input
                    type="text"
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    placeholder="Buscar por email..."
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
                    Administrador
                  </label>
                  <select
                    value={adminFilter}
                    onChange={(e) => setAdminFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '2px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#FFF'
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="admin">Apenas Administradores</option>
                    <option value="not-admin">Não Administradores</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold', fontSize: '14px' }}>
                    Status
                  </label>
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '2px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#FFF'
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="active">Apenas Ativos</option>
                    <option value="inactive">Apenas Inativos</option>
                  </select>
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
                    <option value="email">Email</option>
                    <option value="created">Data de Criação</option>
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
                      setEmailFilter('')
                      setAdminFilter('all')
                      setActiveFilter('all')
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

        {users.length === 0 ? (
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
              Nenhum usuário encontrado.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.name}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  {!user.photoURL && (
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #A0522D 0%, #D2691E 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF',
                        fontSize: '24px'
                      }}
                    >
                      ☕
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8B4513', marginBottom: '4px' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {user.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: user.isAdmin ? 'rgba(139, 69, 19, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '8px',
                      flex: 1,
                      minWidth: '200px'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: saving ? 'not-allowed' : 'pointer', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={user.isAdmin || false}
                        onChange={() => handleToggleFlag(user.id, 'isAdmin', user.isAdmin)}
                        disabled={saving}
                        style={{ width: '20px', height: '20px', cursor: saving ? 'not-allowed' : 'pointer' }}
                      />
                      <span style={{ fontWeight: 'bold', color: '#8B4513' }}>Administrador</span>
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: user.isActive ? 'rgba(34, 139, 34, 0.1)' : 'rgba(220, 20, 60, 0.1)',
                      borderRadius: '8px',
                      flex: 1,
                      minWidth: '200px'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: saving ? 'not-allowed' : 'pointer', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={user.isActive || false}
                        onChange={() => handleToggleFlag(user.id, 'isActive', user.isActive)}
                        disabled={saving}
                        style={{ width: '20px', height: '20px', cursor: saving ? 'not-allowed' : 'pointer' }}
                      />
                      <span style={{ fontWeight: 'bold', color: user.isActive ? '#228B22' : '#DC143C' }}>
                        Ativo
                      </span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {user.id !== currentUser?.uid && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={saving}
                        style={{
                          padding: '8px 16px',
                          background: '#DC3545',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                          opacity: saving ? 0.6 : 1
                        }}
                      >
                        Deletar
                      </button>
                    )}
                    {user.id === currentUser?.uid && (
                      <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                        (você)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
