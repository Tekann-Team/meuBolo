// Modal for editing a user
import { useState, useEffect } from 'react'
import { getUserProfile, updateUserProfile } from '../services/userService'
import { uploadUserPhoto } from '../services/storageService'
import { ensureImageUrl } from '../services/googleDriveService'

export function EditUserModal({ isOpen, userId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoLink, setPhotoLink] = useState('')

  // Load user data when modal opens
  useEffect(() => {
    if (!isOpen || !userId) return
    
    const loadUser = async () => {
      setLoading(true)
      try {
        const user = await getUserProfile(userId)
        
        if (!user) {
          alert('Usuário não encontrado')
          onClose()
          return
        }

        setName(user.name || '')
        setPhotoURL(user.photoURL || '')
      } catch (error) {
        console.error('Error loading user:', error)
        alert('Erro ao carregar usuário')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [isOpen, userId, onClose])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Nome é obrigatório')
      return
    }

    setSaving(true)
    try {
      const updates = { name }
      
      // Handle photo upload
      if (photoFile) {
        try {
          const uploadedURL = await uploadUserPhoto(photoFile, userId)
          updates.photoURL = uploadedURL
        } catch (error) {
          console.error('Error uploading photo:', error)
          alert('Erro ao fazer upload da foto. Tente novamente ou cole o link do Google Drive.')
          setSaving(false)
          return
        }
      } else if (photoLink) {
        try {
          const uploadedURL = await uploadUserPhoto(photoLink, userId)
          updates.photoURL = uploadedURL
        } catch (error) {
          console.error('Error processing photo link:', error)
          alert('Erro ao processar link da foto. Verifique se é um link válido do Google Drive.')
          setSaving(false)
          return
        }
      }
      
      await updateUserProfile(userId, updates)
      
      // Reset form
      setPhotoFile(null)
      setPhotoPreview(null)
      setPhotoLink('')

      if (onSuccess) onSuccess()
      onClose()
      
      alert('Usuário atualizado com sucesso!')
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Erro ao atualizar usuário. Tente novamente.')
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
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', color: '#8B4513', margin: 0 }}>Editar Usuário</h2>
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
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 'bold' }}>
                Nome *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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

            <div style={{ marginBottom: '24px' }}>
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
                  alt="Foto atual"
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

