// Service for Google Drive upload operations
// This service handles uploading files to a shared Google Drive folder
// and returns the public URL for the uploaded file.
import { authenticateGoogleDrive, getDriveFolderId } from '../lib/googleDrive'

/**
 * Upload a file to Google Drive folder
 * 
 * @param {File} file - The file to upload
 * @param {string} folderId - The Google Drive folder ID where the file will be uploaded
 * @param {string} fileName - Optional custom file name (defaults to file.name)
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export async function uploadFileToDrive(file, folderId, fileName = null) {
  try {
    // Ensure user is authenticated and get access token
    const accessToken = await authenticateGoogleDrive()
    
    if (!accessToken) {
      throw new Error('Token de acesso não disponível')
    }
    
    const customFileName = fileName || file.name
    
    // Create multipart form data
    const boundary = '-------314159265358979323846'
    const delimiter = '\r\n--' + boundary + '\r\n'
    const closeDelim = '\r\n--' + boundary + '--'
    
    const metadata = JSON.stringify({
      name: customFileName,
      parents: [folderId]
    })
    
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      metadata +
      delimiter +
      'Content-Type: ' + (file.type || 'application/octet-stream') + '\r\n\r\n'
    
    // Convert to Blob for binary data
    const multipartBody = new Blob([
      multipartRequestBody,
      file,
      closeDelim
    ])
    
    // Upload file using multipart upload
    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body: multipartBody
    })
    
    if (!uploadResponse.ok) {
      const error = await uploadResponse.json().catch(() => ({ error: { message: 'Erro desconhecido' } }))
      throw new Error(`Erro ao fazer upload: ${error.error?.message || uploadResponse.statusText}`)
    }
    
    const fileData = await uploadResponse.json()
    const fileId = fileData.id
    
    if (!fileId) {
      throw new Error('ID do arquivo não foi retornado após upload')
    }
    
    // Step 3: Make file publicly accessible using REST API
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      })
    } catch (permissionError) {
      console.warn('Erro ao tornar arquivo público, mas upload foi concluído:', permissionError)
      // Continue even if permission update fails - user can share manually
    }
    
    // Return direct image URL - format: https://lh3.googleusercontent.com/d/FILE_ID
    // Google Drive serves the image directly with this format
    return `https://lh3.googleusercontent.com/d/${fileId}`
    
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error)
    
    // Provide specific error messages based on error type
    const errorMessage = error.message || String(error)
    
    // Authentication/configuration errors
    if (errorMessage.includes('redirect_uri_mismatch') || 
        errorMessage.includes('invalid_client') || 
        errorMessage.includes('não está autorizado')) {
      throw error // Keep the detailed error message from authenticateGoogleDrive
    }
    
    // Authentication errors (generic)
    if (errorMessage.includes('auth') || 
        errorMessage.includes('sign in') || 
        errorMessage.includes('authenticate') ||
        errorMessage.includes('Token de acesso')) {
      throw new Error('Erro de autenticação. Por favor, autorize o acesso ao Google Drive quando solicitado.')
    }
    
    // Popup closed error
    if (errorMessage.includes('popup_closed') || 
        errorMessage.includes('janela de autenticação foi fechada')) {
      throw new Error('A janela de autorização foi fechada. Por favor, tente novamente e complete a autorização.')
    }
    
    // Re-throw with original error message if it's already descriptive
    throw error
  }
}

/**
 * Convert Google Drive share link to direct image URL
 * 
 * @param {string} shareLink - Google Drive share link (e.g., https://drive.google.com/file/d/FILE_ID/view)
 * @returns {string} - Direct image URL
 */
export function convertDriveLinkToImageUrl(shareLink) {
  try {
    if (!shareLink) return shareLink
    
    // If already a direct image URL (lh3.googleusercontent.com), return as is
    if (shareLink.includes('lh3.googleusercontent.com')) {
      return shareLink
    }
    
    // Extract file ID from various Google Drive URL formats
    const patterns = [
      /\/d\/([a-zA-Z0-9_-]+)/,  // Standard: /d/FILE_ID (in URL path)
      /\/file\/d\/([a-zA-Z0-9_-]+)/,  // /file/d/FILE_ID (in URL path)
      /id=([a-zA-Z0-9_-]+)/,     // Alternative: ?id=FILE_ID (in query params)
    ]
    
    for (const pattern of patterns) {
      const match = shareLink.match(pattern)
      if (match && match[1]) {
        const fileId = match[1]
        // Return direct image URL - format: https://lh3.googleusercontent.com/d/FILE_ID
        return `https://lh3.googleusercontent.com/d/${fileId}`
      }
    }
    
    throw new Error('Could not extract file ID from Google Drive URL')
  } catch (error) {
    console.error('Error converting Drive link:', error)
    throw new Error('Invalid Google Drive URL format')
  }
}

/**
 * Ensure image URL is properly formatted for display
 * Converts Google Drive links to direct image URLs if needed
 * 
 * @param {string} imageUrl - Image URL (may be Google Drive link or direct URL)
 * @returns {string} - Direct image URL ready for display
 */
export function ensureImageUrl(imageUrl) {
  if (!imageUrl) return imageUrl
  
  // If already a direct image URL (lh3.googleusercontent.com), return as is
  if (imageUrl.includes('lh3.googleusercontent.com')) {
    // The URL format is: https://lh3.googleusercontent.com/d/FILE_ID
    // Sometimes it might have query params, but the base format should work
    // Remove any existing query params and keep only the base URL
    const baseUrl = imageUrl.split('?')[0].split('=')[0]
    // Return clean URL - Google Drive will serve the image directly
    return baseUrl
  }
  
  // If it's a Google Drive share link, convert it
  if (isGoogleDriveUrl(imageUrl)) {
    try {
      return convertDriveLinkToImageUrl(imageUrl)
    } catch (error) {
      console.error('Error converting Drive URL:', error)
      // Return original URL if conversion fails
      return imageUrl
    }
  }
  
  // Return as is for other URLs
  return imageUrl
}

/**
 * Validate if a URL is a Google Drive link
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is a Google Drive link
 */
export function isGoogleDriveUrl(url) {
  if (!url) return false
  return url.includes('drive.google.com') || url.includes('docs.google.com')
}

/**
 * Upload contribution evidence to Google Drive
 * This is a convenience wrapper around uploadFileToDrive
 * 
 * @param {File} file - The image file to upload
 * @param {string} contributionId - The contribution ID for organizing files
 * @param {string} type - Type of evidence ('purchase' or 'arrival')
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export async function uploadContributionEvidenceToDrive(file, contributionId, type = 'purchase') {
  const timestamp = Date.now()
  const fileName = file.name
  const extension = fileName.split('.').pop()
  const customFileName = `${type}_${contributionId}_${timestamp}.${extension}`
  
  const DRIVE_FOLDER_ID = getDriveFolderId()
  
  return await uploadFileToDrive(file, DRIVE_FOLDER_ID, customFileName)
}

/**
 * Upload product photo to Google Drive
 * 
 * @param {File} file - The image file to upload
 * @param {string} productId - The product ID for organizing files
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export async function uploadProductPhotoToDrive(file, productId) {
  const timestamp = Date.now()
  const fileName = file.name
  const extension = fileName.split('.').pop()
  const customFileName = `product_${productId}_${timestamp}.${extension}`
  
  const DRIVE_FOLDER_ID = getDriveFolderId()
  
  return await uploadFileToDrive(file, DRIVE_FOLDER_ID, customFileName)
}

/**
 * Upload user photo to Google Drive
 * 
 * @param {File} file - The image file to upload
 * @param {string} userId - The user ID for organizing files
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export async function uploadUserPhotoToDrive(file, userId) {
  const timestamp = Date.now()
  const fileName = file.name
  const extension = fileName.split('.').pop()
  const customFileName = `user_${userId}_${timestamp}.${extension}`
  
  const DRIVE_FOLDER_ID = getDriveFolderId()
  
  return await uploadFileToDrive(file, DRIVE_FOLDER_ID, customFileName)
}

