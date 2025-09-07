import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'
import { User as FirebaseUser } from 'firebase/auth'

const ACCESS_TOKEN = 'ixiclinic_admin_token'

interface AdminUser {
  uid: string
  email: string
  displayName?: string
  role: 'super_admin' | 'admin' | 'support'
  permissions: string[]
  lastLogin?: Date
}

interface AuthState {
  // Firebase user
  firebaseUser: FirebaseUser | null
  setFirebaseUser: (user: FirebaseUser | null) => void
  
  // Admin user with roles and permissions
  adminUser: AdminUser | null
  setAdminUser: (user: AdminUser | null) => void
  
  // Authentication state
  isAuthenticated: boolean
  isLoading: boolean
  setLoading: (loading: boolean) => void
  
  // Token management
  accessToken: string
  setAccessToken: (token: string) => void
  resetAccessToken: () => void
  
  // Auth actions
  login: (firebaseUser: FirebaseUser, adminUser: AdminUser) => void
  logout: () => void
  
  // Permission checks
  hasPermission: (permission: string) => boolean
  isRole: (role: string) => boolean
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const cookieState = getCookie(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''
  
  return {
    // State
    firebaseUser: null,
    adminUser: null,
    isAuthenticated: false,
    isLoading: false,
    accessToken: initToken,
    
    // Setters
    setFirebaseUser: (firebaseUser) =>
      set((state) => ({ 
        ...state, 
        firebaseUser,
        isAuthenticated: !!firebaseUser 
      })),
      
    setAdminUser: (adminUser) =>
      set((state) => ({ ...state, adminUser })),
      
    setLoading: (isLoading) =>
      set((state) => ({ ...state, isLoading })),
      
    setAccessToken: (accessToken) =>
      set((state) => {
        setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
        return { ...state, accessToken }
      }),
      
    resetAccessToken: () =>
      set((state) => {
        removeCookie(ACCESS_TOKEN)
        return { ...state, accessToken: '' }
      }),
      
    // Actions
    login: (firebaseUser, adminUser) =>
      set((state) => ({
        ...state,
        firebaseUser,
        adminUser,
        isAuthenticated: true,
        isLoading: false
      })),
      
    logout: () =>
      set((state) => {
        removeCookie(ACCESS_TOKEN)
        return {
          ...state,
          firebaseUser: null,
          adminUser: null,
          isAuthenticated: false,
          accessToken: '',
          isLoading: false
        }
      }),
      
    // Permission helpers
    hasPermission: (permission) => {
      const { adminUser } = get()
      return adminUser?.permissions.includes(permission) || false
    },
    
    isRole: (role) => {
      const { adminUser } = get()
      return adminUser?.role === role || false
    }
  }
})
