// Inactive user page
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { getUserProfile, getAllAdmins } from '../services/userService'

export function Inactive() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState(null)
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const profile = await getUserProfile(user.uid)
        if (!profile) {
          setLoading(false)
          return
        }

        // Only load data if user is inactive (ProtectedRoute handles redirections)
        if (!profile.isActive) {
          setUserProfile(profile)
          const adminList = await getAllAdmins()
          setAdmins(adminList)
        }
      } catch (error) {
        console.error('Error loading user status:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '48px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
            marginBottom: '32px'
          }}
        >
          <h1 style={{ fontSize: '32px', color: '#8B4513', marginBottom: '16px' }}>
            🎂 Espera aí, meu chapa!
          </h1>
          <div style={{ fontSize: '18px', color: '#666', lineHeight: '1.8', marginBottom: '24px' }}>
            <p style={{ marginBottom: '16px' }}>
              Você foi cadastrado no sistema meuBolo, mas ainda precisa ser ativado por um administrador. 
              É tipo quando você vai fazer um bolo e esquece que não comprou os ingredientes ainda... a espera é real! 😅
            </p>
            <p style={{ marginBottom: '16px', fontStyle: 'italic' }}>
              "A melhor forma de esperar é... esperando com um pedaço de bolo na mão!" 🍰
              <br />
              Mas como você não pode fazer bolo ainda, vai ter que esperar mesmo! 🤷‍♂️
            </p>
            <p style={{ marginBottom: '16px' }}>
              Enquanto isso, aproveite para conhecer nosso time de administradores que controlam quem pode 
              contribuir para nosso estoque de bolos! Eles são tipo os confeiteiros chefes do sistema. 👨‍🍳
            </p>
            <p style={{ fontWeight: 'bold', color: '#8B4513' }}>
              Fica de olho! Assim que um deles te ativar, você já pode começar a registrar suas contribuições! 🚀
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #A0522D 0%, #D2691E 100%)',
              color: '#FFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            Sair
          </button>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
          }}
        >
          <h2 style={{ fontSize: '24px', color: '#8B4513', marginBottom: '24px' }}>
            Administradores
          </h2>
          {admins.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '24px' }}>
              Nenhum administrador encontrado.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #FFF8E7 0%, #FFFFFF 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 150ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <img
                    src={admin.photoURL || 'https://via.placeholder.com/64?text=🎂'}
                    alt={admin.name}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #D2691E',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#8B4513', marginBottom: '4px' }}>
                      {admin.name}
                    </h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>{admin.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

