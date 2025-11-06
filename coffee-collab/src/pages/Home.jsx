// Home page (Dashboard) - Most complex page
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { useUserProfile } from '../hooks/useUserProfile'
import { getUserProfile } from '../services/userService'
import { getAllContributions, getContributionsByUser, getContributionDetails } from '../services/contributionService'
import { getActiveUsers } from '../services/userService'
import { NewContributionModal } from '../components/NewContributionModal'
import { EditContributionModal } from '../components/EditContributionModal'
import { CollaboratorsChart } from '../components/CollaboratorsChart'
import { TimelineChart } from '../components/TimelineChart'

export function Home() {
  const { user, signOut } = useAuth()
  const { profile } = useUserProfile()
  const navigate = useNavigate()
  const [userStats, setUserStats] = useState({ totalValue: 0, totalCakes: 0 })
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showNewContributionModal, setShowNewContributionModal] = useState(false)
  const [collaboratorsData, setCollaboratorsData] = useState([])
  const [indicators, setIndicators] = useState({
    totalValue: 0,
    totalCakes: 0,
    avgMonthlyCakes: 0,
    avgMonthlyValue: 0,
    avgPerCollaborator: 0
  })
  const [newIndicators, setNewIndicators] = useState({
    usersWithoutContribution: [], // Array of { name, photoURL, balance }
    avgSpendingPerActive: 0
  })
  const [allContributions, setAllContributions] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [alerts, setAlerts] = useState({
    lastPlace: false
  })
  const [editingContributionId, setEditingContributionId] = useState(null)

  const loadData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const [allContribs, users] = await Promise.all([
        getAllContributions(),
        getActiveUsers()
      ])

      // Load details for all contributions and filter user's contributions
      const allContribsWithDetails = await Promise.all(
        allContribs.map(async (contrib) => {
          if (contrib.isDivided) {
            try {
              const details = await getContributionDetails(contrib.id)
              return { ...contrib, details }
            } catch (error) {
              console.error(`Error loading details for contribution ${contrib.id}:`, error)
              return contrib
            }
          }
          return contrib
        })
      )

      // User stats - consider split contributions (user's actual share)
      // Need to check ALL contributions (not just where user is creator) to find user's participation
      let userTotalValue = 0
      let userTotalCakes = 0
      
      allContribsWithDetails.forEach(c => {
        if (c.isDivided && c.details) {
          // Find user's share in split contribution (user might be creator or participant)
          const userDetail = c.details.find(d => d.userId === user.uid)
          if (userDetail) {
            userTotalValue += userDetail.value || 0
            // Support both old (quantityKg) and new (quantityCakes) format for migration
            userTotalCakes += userDetail.quantityCakes || userDetail.quantityKg || 0
          }
        } else if (c.userId === user.uid) {
          // Regular contribution (not split) - user is the creator
          userTotalValue += c.value || 0
          // Support both old (quantityKg) and new (quantityCakes) format for migration
          userTotalCakes += c.quantityCakes || c.quantityKg || 0
        }
      })
      
      setUserStats({ totalValue: userTotalValue, totalCakes: userTotalCakes })

      setAllUsers(users) // Store users for chart component (users already have balance field)

      // Calculate indicators
      const allCakes = allContribs.reduce((sum, c) => sum + (c.quantityCakes || c.quantityKg || 0), 0)
      const allValue = allContribs.reduce((sum, c) => sum + (c.value || 0), 0)
      
      // Calculate months with contributions
      const monthsSet = new Set()
      allContribs.forEach(c => {
        const date = c.purchaseDate?.toDate?.() || new Date(c.purchaseDate)
        monthsSet.add(`${date.getFullYear()}-${date.getMonth()}`)
      })
      const monthsCount = Math.max(monthsSet.size, 1)

      setIndicators({
        totalValue: allValue,
        totalCakes: allCakes,
        avgMonthlyCakes: allCakes / monthsCount,
        avgMonthlyValue: allValue / monthsCount,
        avgPerCollaborator: users.length > 0 ? allValue / users.length : 0
      })

      setAllContributions(allContribs)

      // Calculate new indicators (using balance instead of period-based calculation)
      calculateNewIndicators(allContribs, users)

      // Check for alerts
      await checkAlerts(user.uid, allContribs, users)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateNewIndicators = (allContribs, users) => {
    // 1. Usuários que ainda não contribuíram nesta rodada (saldo = 0)
    const usersWithBalance = users.map(user => ({
      userId: user.id,
      name: user.name,
      photoURL: user.photoURL,
      balance: user.balance || 0
    }))
    const usersWithoutContribution = usersWithBalance.filter(user => user.balance === 0)


    // 3. Gasto médio por colaborador ativo (últimos 6 meses)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 6)
    
    const contributionsInPeriod = allContribs.filter(c => {
      const contribDate = c.purchaseDate?.toDate?.() || new Date(c.purchaseDate)
      return contribDate >= startDate && contribDate <= endDate
    })
    
    const totalValueInPeriod = contributionsInPeriod.reduce((sum, c) => sum + (c.value || 0), 0)
    const avgSpendingPerActive = users.length > 0 ? totalValueInPeriod / users.length : 0

    setNewIndicators({
      usersWithoutContribution,
      avgSpendingPerActive
    })
  }

  const checkAlerts = async (userId, allContribs, users) => {
    try {
      // Check if user has the lowest balance (or tied for lowest)
      const usersWithBalance = users.map(user => ({
        userId: user.id,
        balance: user.balance || 0
      }))
      const sortedByBalance = [...usersWithBalance].sort((a, b) => a.balance - b.balance)
      const lowestBalance = sortedByBalance[0]?.balance || 0
      const userBalance = users.find(u => u.id === userId)?.balance || 0
      const isLastPlace = userBalance === lowestBalance && lowestBalance >= 0
      
      setAlerts({
        lastPlace: isLastPlace || false
      })
    } catch (error) {
      console.error('Error checking alerts:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
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

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '0px 24px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ marginTop: '-100px', marginBottom: '-80px', marginLeft: '-70px' }}>
            <img 
              src={`${import.meta.env.BASE_URL}meuBolo_logo_transparent.png`}
              alt="meuBolo" 
              style={{ 
                height: '390px', 
                width: 'auto',
                maxWidth: '950px',
                objectFit: 'contain',
                display: 'block'
              }} 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                cursor: 'pointer',
                padding: '16px 30px',
                borderRadius: '26px',
                transition: 'background 150ms ease',
                background: 'rgba(255, 255, 255, 0.5)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onClick={() => navigate('/settings')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 69, 19, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
              }}
            >
              <img
                src={profile.photoURL || user.photoURL || 'https://via.placeholder.com/64?text=☕'}
                alt={profile.name}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '3px solid #D2691E',
                  objectFit: 'cover'
                }}
              />
              <div>
                <div style={{ fontWeight: 'bold', color: '#8B4513', fontSize: '18px', marginBottom: '4px' }}>{profile.name}</div>
                <div style={{ fontSize: '15px', color: '#666', marginBottom: '2px' }}>
                  Saldo Atual: <strong>{(allUsers.find(u => u.id === user.uid)?.balance || 0).toFixed(2)} 🍰</strong>
                </div>
                <div style={{ fontSize: '15px', color: '#666' }}>
                  Total: <strong>R$ {userStats.totalValue.toFixed(2)}</strong> | <strong>{userStats.totalCakes.toFixed(2)} 🍰</strong>
                </div>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                style={{
                  padding: '12px 20px',
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
                + Novo
              </button>

              {showAddMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    background: '#FFF',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    padding: '8px',
                    minWidth: '200px',
                    zIndex: 100
                  }}
                >
                  <button
                    onClick={() => {
                      setShowAddMenu(false)
                      setShowNewContributionModal(true)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F5F5F5'
                    }}
                  >
                    📝 Nova Contribuição
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              style={{
                padding: '12px 20px',
                background: '#FFF',
                color: '#8B4513',
                border: '2px solid #8B4513',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Sair
            </button>
          </div>
        </div>

        {/* Avisos section */}
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Alert 1: Missing arrival */}
          {/* Alert: Last place */}
          {alerts.lastPlace && (
            <div
              style={{
                background: 'linear-gradient(135deg, #F0E68C 0%, #FFFACD 100%)',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '2px solid #B8860B',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', color: '#8B4513', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                  📊 Você ainda não contribuiu nesta rodada!
                </h3>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                  Você está na última posição (ou dividindo a última) no ranking de saldo. Você é o próximo da fila para comprar bolo! Galera tá com fome! Que tal começar a contribuir?
                  {(allUsers.find(u => u.id === user.uid)?.balance || 0) === 0 && ' Que tal começar a contribuir?'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Cards - First Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Colaboradores - 2 columns */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            <h2 style={{ fontSize: '20px', color: '#8B4513', marginBottom: '16px' }}>
              Saldo dos Colaboradores
            </h2>
            <CollaboratorsChart users={allUsers} />
          </div>

          {/* Indicadores - 1 column */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            <h2 style={{ fontSize: '20px', color: '#8B4513', marginBottom: '16px' }}>
              Indicadores
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'rgba(139, 69, 19, 0.05)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Valor Total Investido</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8B4513' }}>
                  R$ {indicators.totalValue.toFixed(2)}
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(139, 69, 19, 0.05)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total de Bolos</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8B4513' }}>
                  {indicators.totalCakes.toFixed(2)} bolos
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(139, 69, 19, 0.05)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Média Consumo Mensal</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8B4513' }}>
                  {indicators.avgMonthlyCakes.toFixed(2)} 🍰
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(139, 69, 19, 0.05)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Média Investimento Mensal</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8B4513' }}>
                  R$ {indicators.avgMonthlyValue.toFixed(2)}
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(139, 69, 19, 0.05)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Gasto Médio por Colaborador Ativo</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8B4513' }}>
                  R$ {newIndicators.avgSpendingPerActive.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards - Second Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Quem ainda não contribuiu nesta rodada */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            <h2 style={{ fontSize: '18px', color: '#8B4513', marginBottom: '16px' }}>
              👤 Quem ainda não contribuiu nesta rodada
            </h2>
            {newIndicators.usersWithoutContribution && newIndicators.usersWithoutContribution.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '16px', justifyContent: 'flex-start' }}>
                {newIndicators.usersWithoutContribution.map((user, index) => (
                  <div
                    key={user.userId || index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px',
                      background: 'rgba(139, 69, 19, 0.05)',
                      borderRadius: '8px',
                      minWidth: '120px'
                    }}
                  >
                    <img
                      src={user.photoURL || 'https://via.placeholder.com/48?text=☕'}
                      alt={user.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        border: '2px solid #D2691E',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: '#8B4513', fontSize: '14px' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                        Saldo: {user.balance.toFixed(2)} 🍰
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
                Todos já contribuíram nesta rodada! 🎉
              </div>
            )}
          </div>

        </div>

        {/* Dashboard Cards - Third Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Linha do Tempo - 3 columns (full width) */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            <h2 style={{ fontSize: '20px', color: '#8B4513', marginBottom: '16px' }}>
              Linha do Tempo
            </h2>
            <TimelineChart contributions={allContributions} />
          </div>
        </div>
      </div>

      <NewContributionModal
        isOpen={showNewContributionModal}
        onClose={() => setShowNewContributionModal(false)}
        onSuccess={async (compensationCreated) => {
          // Small delay to ensure Firestore has propagated the balance updates
          // This ensures the balance is visible when data reloads
          await new Promise(resolve => setTimeout(resolve, 500))
          // Reload all data (including updated balance)
          await loadData()
          
          // If compensation was created, navigate to compensations page
          if (compensationCreated) {
            navigate('/compensations')
          }
        }}
      />


      {editingContributionId && (
        <EditContributionModal
          isOpen={!!editingContributionId}
          contributionId={editingContributionId}
          onClose={() => {
            setEditingContributionId(null)
            loadData() // Reload to update alerts
          }}
          onSuccess={() => {
            loadData() // Reload to update alerts
            setEditingContributionId(null)
          }}
        />
      )}
    </Layout>
  )
}

