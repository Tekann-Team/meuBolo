// Service for user profile operations in Firestore
import { 
  doc, 
  getDoc, 
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'

/**
 * Gets or creates user profile in Firestore
 * Creates profile if it doesn't exist (first login)
 * If no admin exists, first user becomes admin
 */
export async function getOrCreateUserProfile(user) {
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    // User profile already exists, return it
    return { id: userSnap.id, ...userSnap.data() }
  } else {
    // First login - check if there are any admins
    const adminsRef = collection(db, 'users')
    const adminsQuery = query(adminsRef, where('isAdmin', '==', true))
    const adminsSnapshot = await getDocs(adminsQuery)
    
    // If no admins exist, this user becomes the first admin
    const isAdmin = adminsSnapshot.empty

    // Create user profile
    const newProfile = {
      id: user.uid,
      email: user.email,
      name: user.displayName || user.email?.split('@')[0] || 'Usuário',
      photoURL: user.photoURL,
      isAdmin,
      isActive: isAdmin, // Admins are automatically active, regular users start inactive
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    await setDoc(userRef, newProfile)
    
    // TODO: Send email to admins about new user registration
    // This would typically be done via Cloud Functions
    
    return newProfile
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId) {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() }
  }
  return null
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  const userRef = doc(db, 'users', userId)
  await setDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp()
  }, { merge: true })
}

/**
 * Get all active users
 */
export async function getActiveUsers() {
  const usersRef = collection(db, 'users')
  const activeQuery = query(usersRef, where('isActive', '==', true))
  const snapshot = await getDocs(activeQuery)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

/**
 * Get all admins
 */
export async function getAllAdmins() {
  const usersRef = collection(db, 'users')
  const adminsQuery = query(usersRef, where('isAdmin', '==', true))
  const snapshot = await getDocs(adminsQuery)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
  const usersRef = collection(db, 'users')
  const snapshot = await getDocs(usersRef)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

/**
 * Delete user profile (admin only)
 * WARNING: This only deletes the Firestore document, not the Firebase Auth user
 */
export async function deleteUser(userId) {
  const userRef = doc(db, 'users', userId)
  await deleteDoc(userRef)
}