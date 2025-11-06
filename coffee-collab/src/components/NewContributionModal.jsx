// Modal for creating a new contribution
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useUserProfile } from '../hooks/useUserProfile'
import { getActiveUsers } from '../services/userService'
import { createContribution, updateContribution } from '../services/contributionService'
import { uploadContributionEvidence } from '../services/storageService'
import { getCakeValue } from '../services/configurationService'

export function NewContributionModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cakeValue, setCakeValue] = useState(25.0)
  
  // Form state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [value, setValue] = useState('')
  const [quantityCakes, setQuantityCakes] = useState(0)
  const [purchaseEvidenceFile, setPurchaseEvidenceFile] = useState(null)
  const [purchaseEvidencePreview, setPurchaseEvidencePreview] = useState(null)
  const [purchaseEvidenceLink, setPurchaseEvidenceLink] = useState('')
  const [isDivided, setIsDivided] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState([])

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setValue('')
      setQuantityCakes(0)
      setPurchaseEvidenceFile(null)
      setPurchaseEvidencePreview(null)
      setPurchaseEvidenceLink('')
      setIsDivided(false)
      setSelectedParticipants([])
      return
    }
    
    const loadData = async () => {
      setLoading(true)
      try {
        const [usersList, currentCakeValue] = await Promise.all([
          getActiveUsers(),
          getCakeValue()
        ])
        setUsers(usersList)
        setCakeValue(currentCakeValue)
        setSelectedUserId(user?.uid || '')
      } catch (error) {
        console.error('Error loading data:', error)
        alert('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isOpen, user?.uid])
  
  // Calculate quantity of cakes when value changes
  useEffect(() => {
    if (value && cakeValue > 0) {
      const calculatedCakes = parseFloat(value) / cakeValue
      setQuantityCakes(calculatedCakes)
    } else {
      setQuantityCakes(0)
    }
  }, [value, cakeValue])


  const handlePurchaseEvidenceChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPurchaseEvidenceFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPurchaseEvidencePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!purchaseDate || !value || (!purchaseEvidenceFile && !purchaseEvidenceLink)) {
      alert('Preencha todos os campos obrigatórios (incluindo evidência de compra)')
      return
    }

    if (parseFloat(value) <= 0) {
      alert('Valor deve ser maior que zero')
      return
    }

    const purchaseDateObj = new Date(purchaseDate)
    if (purchaseDateObj > new Date()) {
      alert('Data de compra não pode ser futura')
      return
    }

    setSaving(true)
    try {
      // Create contribution first to get the ID
      const contributionData = {
        userId: selectedUserId || user.uid,
        purchaseDate: purchaseDate,
        value: parseFloat(value),
        purchaseEvidence: null, // Will be updated after upload
        isDivided: isDivided,
        participantUserIds: isDivided ? selectedParticipants : []
      }

      const result = await createContribution(contributionData)
      const contributionId = result.contributionId || result // Support both old (just ID) and new (object) format
      const compensationCreated = result.compensationCreated || false

      // Upload evidence file using the contribution ID (with error handling)
      let purchaseEvidenceURL = null
      
      try {
        // Use Google Drive link if provided, otherwise try file upload
        const purchaseEvidenceInput = purchaseEvidenceLink || purchaseEvidenceFile
        if (purchaseEvidenceInput) {
          purchaseEvidenceURL = await uploadContributionEvidence(purchaseEvidenceInput, contributionId, 'purchase')
        }
      } catch (uploadError) {
        console.error('Error uploading purchase evidence:', uploadError)
        const errorMessage = uploadError.message || 'Erro desconhecido ao fazer upload'
        
        // Show user-friendly error message
        if (errorMessage.includes('Google Client ID não configurado')) {
          alert('⚠️ Google Drive não está configurado. Por favor, configure as credenciais OAuth2 conforme o guia GOOGLE_DRIVE_SETUP.md')
        } else if (errorMessage.includes('autenticação') || errorMessage.includes('auth')) {
          alert('⚠️ Erro de autenticação com Google Drive. Por favor, tente novamente e autorize o acesso quando solicitado.')
        } else {
          alert(`⚠️ Erro ao processar evidência de compra: ${errorMessage}\n\nVocê pode fazer upload manual e colar o link do Google Drive.`)
        }
        // Continue even if upload fails - contribution is already created
      }

      // Update contribution with evidence URL (only if we have one)
      if (purchaseEvidenceURL) {
        await updateContribution(contributionId, {
          purchaseEvidence: purchaseEvidenceURL
        })
      }

      // Reset form
      setPurchaseDate(new Date().toISOString().split('T')[0])
      setValue('')
      setQuantityCakes(0)
      setPurchaseEvidenceFile(null)
      setPurchaseEvidencePreview(null)
      setPurchaseEvidenceLink('')
      setIsDivided(false)
      setSelectedParticipants([])

      // Show success message
      if (compensationCreated) {
        alert('Contribuição criada com sucesso! Uma compensação automática foi executada.')
      } else {
        alert('Contribuição criada com sucesso!')
      }
      
      // Call onSuccess callback (which will reload data) and wait for it to complete
      // Pass compensationCreated flag so Home can navigate if needed
      if (onSuccess) {
        await onSuccess(compensationCreated)
      }
      onClose()
    } catch (error) {
      console.error('Error creating contribution:', error)
      alert('Erro ao criar contribuição. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFF',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', color: '#8B4513', margin: 0 }}>Nova Contribuição</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>Carregando...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            {profile?.isAdmin && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold' }}>
                  Pessoa *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                  {users.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      style={{
                        padding: '12px',
                        border: selectedUserId === u.id ? '3px solid #D2691E' : '2px solid #DDD',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: selectedUserId === u.id ? '#FFF8E7' : '#FFF',
                        transition: 'all 150ms ease'
                      }}
                    >
                      {u.photoURL && (
                        <img
                          src={u.photoURL}
                          alt={u.name}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            marginBottom: '8px',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      <div style={{ fontSize: '12px', color: '#666' }}>{u.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold' }}>
                Data Compra *
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #DDD',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold' }}>
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                min="0.01"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #DDD',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            {value && quantityCakes > 0 && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#FFF8E7', borderRadius: '8px', border: '2px solid #D2691E' }}>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <strong>Quantidade de bolos calculada:</strong> {quantityCakes.toFixed(2)} bolos
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  (Valor do bolo: R$ {cakeValue.toFixed(2)})
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold' }}>
                Rachar compra (Vaquinha)
              </label>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={!isDivided}
                    onChange={() => {
                      setIsDivided(false)
                      setSelectedParticipants([])
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Não</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={isDivided}
                    onChange={() => setIsDivided(true)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Sim</span>
                </label>
              </div>
            </div>

            {isDivided && (
              <div style={{ marginBottom: '16px', padding: '16px', background: '#FFF8E7', borderRadius: '8px', border: '2px solid #D2691E' }}>
                <label style={{ display: 'block', marginBottom: '12px', color: '#666', fontWeight: 'bold' }}>
                  Selecionar colaboradores que vão rachar:
                </label>
                
                {/* Card readonly do usuário que está cadastrando */}
                {(() => {
                  const currentUserObj = users.find(u => u.id === (selectedUserId || user.uid))
                  if (currentUserObj) {
                    return (
                      <div style={{ marginBottom: '12px', padding: '12px', background: '#FFF', borderRadius: '8px', border: '2px solid #D2691E', opacity: 0.8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {currentUserObj.photoURL && (
                            <img
                              src={currentUserObj.photoURL}
                              alt={currentUserObj.name}
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                            />
                          )}
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#8B4513' }}>
                              {currentUserObj.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                              (você está incluído)
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  {users.filter(u => u.id !== (selectedUserId || user.uid)).map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        if (selectedParticipants.includes(u.id)) {
                          setSelectedParticipants(selectedParticipants.filter(id => id !== u.id))
                        } else {
                          setSelectedParticipants([...selectedParticipants, u.id])
                        }
                      }}
                      style={{
                        padding: '12px',
                        border: selectedParticipants.includes(u.id) ? '3px solid #D2691E' : '2px solid #DDD',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: selectedParticipants.includes(u.id) ? '#FFF' : '#FFF',
                        transition: 'all 150ms ease'
                      }}
                    >
                      {u.photoURL && (
                        <img
                          src={u.photoURL}
                          alt={u.name}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            marginBottom: '8px',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      <div style={{ fontSize: '12px', color: '#666' }}>{u.name}</div>
                    </div>
                  ))}
                </div>
                {value && quantityCakes > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#FFF', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      <strong>Total de pessoas:</strong> {selectedParticipants.length + 1} (incluindo você)
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                      <strong>Valor por pessoa:</strong> R$ {((parseFloat(value) || 0) / (selectedParticipants.length + 1)).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      <strong>Quantidade por pessoa:</strong> {(quantityCakes / (selectedParticipants.length + 1)).toFixed(2)} bolos
                    </div>
                  </div>
                )}
              </div>
            )}


            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold' }}>
                Evidência Compra *
              </label>
              <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                Selecione um arquivo para upload automático (ou cole o link do Google Drive se preferir manual)
              </div>
              <input
                type="text"
                value={purchaseEvidenceLink}
                onChange={(e) => {
                  setPurchaseEvidenceLink(e.target.value)
                  setPurchaseEvidenceFile(null)
                  setPurchaseEvidencePreview(null)
                }}
                placeholder="Cole aqui o link do Google Drive (ou selecione arquivo abaixo)"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #DDD',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '8px'
                }}
              />
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>OU</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handlePurchaseEvidenceChange(e)
                  setPurchaseEvidenceLink('')
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #DDD',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              {purchaseEvidencePreview && (
                <img
                  src={purchaseEvidencePreview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    marginTop: '12px',
                    borderRadius: '8px'
                  }}
                />
              )}
              {purchaseEvidenceLink && !purchaseEvidencePreview && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                  Link do Google Drive: {purchaseEvidenceLink.substring(0, 50)}...
                </div>
              )}
            </div>


            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
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
                type="submit"
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
          </form>
        )}
      </div>
    </div>
  )
}

