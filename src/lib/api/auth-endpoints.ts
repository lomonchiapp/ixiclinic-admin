/**
 * Simulación de API endpoints para Firebase Auth
 * En un entorno real, estos serían endpoints de servidor (Express, Next.js API, etc.)
 */

import { firebaseAdminAuth } from '../firebase-admin-auth'

export interface AuthCheckResponse {
  exists: boolean
  user?: {
    uid: string
    email: string
    displayName?: string
    disabled: boolean
    metadata: {
      creationTime: string
      lastSignInTime?: string
    }
  }
  error?: string
}

export interface MultipleAuthCheckResponse {
  results: Record<string, boolean>
  errors?: Record<string, string>
}

/**
 * Simular endpoint: POST /api/auth/check-email
 */
export async function checkEmailEndpoint(email: string): Promise<AuthCheckResponse> {
  try {
    // En desarrollo, usar el Firebase Admin SDK directamente
    if (import.meta.env.DEV) {
      if (await firebaseAdminAuth.isAvailable()) {
        const exists = await firebaseAdminAuth.emailExists(email)
        let user = undefined
        
        if (exists) {
          const userRecord = await firebaseAdminAuth.getUserByEmail(email)
          if (userRecord) {
            user = {
              uid: userRecord.uid,
              email: userRecord.email || email,
              displayName: userRecord.displayName,
              disabled: userRecord.disabled,
              metadata: {
                creationTime: userRecord.metadata.creationTime,
                lastSignInTime: userRecord.metadata.lastSignInTime
              }
            }
          }
        }
        
        return { exists, user }
      }
    }
    
    // Fallback: simulación para desarrollo sin Firebase Admin
    return await mockCheckEmail(email)
    
  } catch (error) {
    console.error('Error en checkEmailEndpoint:', error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Simular endpoint: POST /api/auth/check-multiple-emails
 */
export async function checkMultipleEmailsEndpoint(emails: string[]): Promise<MultipleAuthCheckResponse> {
  try {
    // En desarrollo, usar el Firebase Admin SDK directamente
    if (import.meta.env.DEV) {
      if (await firebaseAdminAuth.isAvailable()) {
        const results = await firebaseAdminAuth.checkMultipleEmails(emails)
        return { results }
      }
    }
    
    // Fallback: simulación para desarrollo sin Firebase Admin
    const results: Record<string, boolean> = {}
    for (const email of emails) {
      const response = await mockCheckEmail(email)
      results[email] = response.exists
    }
    
    return { results }
    
  } catch (error) {
    console.error('Error en checkMultipleEmailsEndpoint:', error)
    return {
      results: emails.reduce((acc, email) => ({ ...acc, [email]: false }), {}),
      errors: { general: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }
}

/**
 * Simular endpoint: GET /api/auth/list-users
 */
export async function listUsersEndpoint(maxResults: number = 1000) {
  try {
    if (import.meta.env.DEV && await firebaseAdminAuth.isAvailable()) {
      const result = await firebaseAdminAuth.listUsers(maxResults)
      return {
        users: result.users.map(user => ({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          disabled: (user as any).disabled || false,
          metadata: {
            creationTime: (user as any).metadata?.creationTime || new Date().toISOString(),
            lastSignInTime: (user as any).metadata?.lastSignInTime || new Date().toISOString()
          }
        })),
        pageToken: result.pageToken
      }
    }
    
    // Fallback: usuarios simulados
    return {
      users: [
        {
          uid: 'mock-uid-1',
          email: 'admin@ixiclinic.com',
          displayName: 'Admin IxiClinic',
          disabled: false,
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
          }
        },
        {
          uid: 'mock-uid-2',
          email: 'doctor@ixiclinic.com',
          displayName: 'Dr. Test',
          disabled: false,
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
          }
        }
      ]
    }
    
  } catch (error) {
    console.error('Error en listUsersEndpoint:', error)
    throw error
  }
}

/**
 * Mock para desarrollo sin Firebase Admin SDK
 */
async function mockCheckEmail(email: string): Promise<AuthCheckResponse> {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
  
  // Lista de emails que simulamos que existen
  const mockExistingEmails = [
    'admin@ixiclinic.com',
    'doctor@ixiclinic.com',
    'test@example.com',
    'user@test.com',
    'demo@ixiclinic.com',
    'support@ixiclinic.com'
  ]
  
  const exists = mockExistingEmails.includes(email.toLowerCase())
  
  if (exists) {
    return {
      exists: true,
      user: {
        uid: `mock-${email.replace('@', '-').replace('.', '-')}`,
        email: email,
        displayName: `Usuario ${email.split('@')[0]}`,
        disabled: false,
        metadata: {
          creationTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          lastSignInTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    }
  }
  
  return { exists: false }
}

/**
 * Wrapper para usar en el frontend como si fuera una llamada HTTP
 */
export class AuthAPI {
  static async checkEmail(email: string): Promise<AuthCheckResponse> {
    return checkEmailEndpoint(email)
  }
  
  static async checkMultipleEmails(emails: string[]): Promise<MultipleAuthCheckResponse> {
    return checkMultipleEmailsEndpoint(emails)
  }
  
  static async listUsers(maxResults?: number) {
    return listUsersEndpoint(maxResults)
  }
}
