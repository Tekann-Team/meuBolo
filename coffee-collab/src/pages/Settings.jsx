// Settings page
import { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { useUserProfile } from '../hooks/useUserProfile'
import { updateUserProfile, migrateAllUserBalances } from '../services/userService'
import { uploadUserPhoto } from '../services/storageService'
import { ensureImageUrl } from '../services/googleDriveService'
import { getCakeValue, setCakeValue } from '../services/configurationService'

export function Settings() {
  const { user } = useAuth()
  const { profile, refreshProfile } = useUserProfile()
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoLink, setPhotoLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [cakeValue, setCakeValueState] = useState(25.0)
  const [editingCakeValue, setEditingCakeValue] = useState(false)
  const [savingCakeValue, setSavingCakeValue] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setPhotoURL(profile.photoURL || '')
    }
    setLoading(false)
  }, [profile])

  useEffect(() => {
    const loadCakeValue = async () => {
      try {
        const value = await getCakeValue()
        setCakeValueState(value)
      } catch (error) {
        console.error('Error loading cake value:', error)
      }
    }
    loadCakeValue()
  }, [])

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
      setPhotoLink('')
      setPhotoURL('')
    }
  }

  const handleSave = async () => {
    if (!profile) return
    
    setSaving(true)
    try {
      const updates = { name }
      
      // Handle photo upload
      if (photoFile) {
        try {
          const uploadedURL = await uploadUserPhoto(photoFile, user.uid)
          updates.photoURL = uploadedURL
        } catch (error) {
          console.error('Error uploading photo:', error)
          alert('Erro ao fazer upload da foto. Tente novamente ou cole o link do Google Drive.')
          setSaving(false)
          return
        }
      } else if (photoLink) {
        try {
          const uploadedURL = await uploadUserPhoto(photoLink, user.uid)
          updates.photoURL = uploadedURL
        } catch (error) {
          console.error('Error processing photo link:', error)
          alert('Erro ao processar link da foto. Verifique se é um link válido do Google Drive.')
          setSaving(false)
          return
        }
      }
      
      await updateUserProfile(user.uid, updates)
      await refreshProfile()
      setEditing(false)
      setPhotoFile(null)
      setPhotoPreview(null)
      setPhotoLink('')
      alert('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Erro ao atualizar perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleMigrateBalances = async () => {
    if (!confirm('Esta ação irá recalcular os saldos de todos os usuários baseado nas contribuições e compensações existentes. Deseja continuar?')) {
      return
    }

    setMigrating(true)
    try {
      const result = await migrateAllUserBalances()
      alert(`Migração concluída! ${result.message}`)
      window.location.reload() // Reload to show updated balances
    } catch (error) {
      console.error('Error migrating balances:', error)
      alert('Erro ao migrar saldos: ' + error.message)
    } finally {
      setMigrating(false)
    }
  }

  const handleSaveCakeValue = async () => {
    if (cakeValue <= 0) {
      alert('O valor do bolo deve ser maior que zero')
      return
    }

    setSavingCakeValue(true)
    try {
      await setCakeValue(cakeValue)
      setEditingCakeValue(false)
      alert('Valor do bolo atualizado com sucesso!')
    } catch (error) {
      console.error('Error saving cake value:', error)
      alert('Erro ao salvar valor do bolo. Tente novamente.')
    } finally {
      setSavingCakeValue(false)
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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', color: '#FFF', marginBottom: '24px', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)' }}>
          Settings
        </h1>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', color: '#8B4513', margin: 0 }}>
              Seus Dados
            </h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #A0522D 0%, #D2691E 100%)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Editar
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold' }}>
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #DDD',
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: editing ? '#FFF' : '#F5F5F5'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold' }}>
                Email
              </label>
              <input
                type="email"
                value={profile.email || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #DDD',
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: '#F5F5F5'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold' }}>
                Foto
              </label>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    border: '3px solid #D2691E',
                    objectFit: 'cover',
                    marginBottom: '12px'
                  }}
                />
              )}
              {!photoPreview && photoURL && (
                <img
                  src={ensureImageUrl(photoURL)}
                  alt={profile.name}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    border: '3px solid #D2691E',
                    objectFit: 'cover',
                    marginBottom: '12px'
                  }}
                />
              )}
              {editing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    value={photoLink}
                    onChange={(e) => {
                      setPhotoLink(e.target.value)
                      setPhotoFile(null)
                      setPhotoPreview(null)
                    }}
                    placeholder="Cole aqui o link do Google Drive"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>OU</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}
            </div>
            {editing && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={() => {
                    setEditing(false)
                    setName(profile.name || '')
                    setPhotoURL(profile.photoURL || '')
                    setPhotoFile(null)
                    setPhotoPreview(null)
                    setPhotoLink('')
                  }}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    background: '#FFF',
                    color: '#8B4513',
                    border: '2px solid #8B4513',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    background: saving ? '#CCC' : 'linear-gradient(135deg, #A0522D 0%, #D2691E 100%)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {profile.isAdmin && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            <h2 style={{ fontSize: '24px', color: '#8B4513', marginBottom: '24px' }}>
              Configurações do Sistema
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'rgba(139, 69, 19, 0.1)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '18px', color: '#8B4513', marginBottom: '8px' }}>
                  Valor do Bolo
                </h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                  Configure o valor padrão de um bolo em reais (R$). Este valor é usado para calcular automaticamente a quantidade de bolos quando uma contribuição é cadastrada.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', color: '#666', fontWeight: 'bold', minWidth: '120px' }}>
                    Valor (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={cakeValue}
                    onChange={(e) => setCakeValueState(parseFloat(e.target.value) || 0)}
                    disabled={!editingCakeValue}
                    style={{
                      flex: 1,
                      maxWidth: '200px',
                      padding: '12px',
                      border: '2px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '16px',
                      background: editingCakeValue ? '#FFF' : '#F5F5F5'
                    }}
                  />
                  {!editingCakeValue ? (
                    <button
                      onClick={() => setEditingCakeValue(true)}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #A0522D 0%, #D2691E 100%)',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Editar
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setEditingCakeValue(false)
                          // Reload cake value
                          getCakeValue().then(value => setCakeValueState(value))
                        }}
                        disabled={savingCakeValue}
                        style={{
                          padding: '8px 16px',
                          background: '#FFF',
                          color: '#8B4513',
                          border: '2px solid #8B4513',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: savingCakeValue ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveCakeValue}
                        disabled={savingCakeValue}
                        style={{
                          padding: '8px 16px',
                          background: savingCakeValue ? '#CCC' : 'linear-gradient(135deg, #A0522D 0%, #D2691E 100%)',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: savingCakeValue ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {savingCakeValue ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(139, 69, 19, 0.1)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '18px', color: '#8B4513', marginBottom: '8px' }}>
                  Migração de Saldos
                </h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                  Use esta função para recalcular os saldos de todos os usuários baseado nas contribuições e compensações existentes. 
                  Isso é útil após a migração para o novo sistema de saldo.
                </p>
                <button
                  onClick={handleMigrateBalances}
                  disabled={migrating}
                  style={{
                    padding: '12px 24px',
                    background: migrating ? '#CCC' : 'linear-gradient(135deg, #A0522D 0%, #D2691E 100%)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: migrating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {migrating ? 'Migrando...' : 'Migrar Saldos de Todos os Usuários'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}




