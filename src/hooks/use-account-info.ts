import { useQuery } from '@tanstack/react-query'
import { firebaseAdminService } from '@/lib/firebase-admin'
import type { Account, Patient, Appointment, User } from 'ixiclinic-types/dist/admin-exports'

export interface AccountInfo {
  account: Account | null
  patients: Patient[]
  appointments: Appointment[]
  users: User[]
  stats: {
    totalPatients: number
    totalAppointments: number
    totalUsers: number
    recentAppointments: number // últimos 30 días
  }
}

export function useAccountInfo(accountId: string) {
  return useQuery({
    queryKey: ['accountInfo', accountId],
    queryFn: async (): Promise<AccountInfo> => {
      if (!accountId) {
        throw new Error('Account ID is required')
      }

      try {
        console.log(`🔍 useAccountInfo: Obteniendo datos para accountId: ${accountId}`)
        
        // Obtener todos los datos en paralelo
        const [account, patients, appointments, users] = await Promise.all([
          firebaseAdminService.getAccountById(accountId),
          firebaseAdminService.getPatientsByAccount(accountId),
          firebaseAdminService.getAppointmentsByAccount(accountId),
          firebaseAdminService.getUsersByAccount(accountId)
        ])

        console.log(`📊 useAccountInfo resultados para ${accountId}:`)
        console.log(`  - Cuenta: ${account ? account.name : 'No encontrada'}`)
        console.log(`  - Pacientes: ${patients.length}`)
        console.log(`  - Citas: ${appointments.length}`)
        console.log(`  - Usuarios: ${users.length}`)

        // Calcular estadísticas
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
        
        const recentAppointments = appointments.filter(appointment => {
          const appointmentDate = appointment.date instanceof Date 
            ? appointment.date 
            : new Date(appointment.date)
          return appointmentDate >= thirtyDaysAgo
        }).length

        const stats = {
          totalPatients: patients.length,
          totalAppointments: appointments.length,
          totalUsers: users.length,
          recentAppointments
        }

        return {
          account,
          patients,
          appointments,
          users,
          stats
        }
      } catch (error) {
        console.error('Error fetching account info:', error)
        throw new Error(`Error al obtener información de la cuenta: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    },
    enabled: !!accountId, // Solo ejecutar si tenemos accountId
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
    retry: 2,
    refetchOnWindowFocus: false
  })
}

// Hook adicional para obtener solo estadísticas básicas (más rápido)
export function useAccountStats(accountId: string) {
  return useQuery({
    queryKey: ['accountStats', accountId],
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Account ID is required')
      }

      const [patients, appointments, users] = await Promise.all([
        firebaseAdminService.getPatientsByAccount(accountId),
        firebaseAdminService.getAppointmentsByAccount(accountId),
        firebaseAdminService.getUsersByAccount(accountId)
      ])

      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
      
      const recentAppointments = appointments.filter(appointment => {
        const appointmentDate = appointment.date instanceof Date 
          ? appointment.date 
          : new Date(appointment.date)
        return appointmentDate >= thirtyDaysAgo
      }).length

      return {
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        totalUsers: users.length,
        recentAppointments
      }
    },
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
    refetchOnWindowFocus: false
  })
}

// Hook para obtener solo pacientes de una cuenta
export function useAccountPatients(accountId: string) {
  return useQuery({
    queryKey: ['accountPatients', accountId],
    queryFn: () => firebaseAdminService.getPatientsByAccount(accountId),
    enabled: !!accountId,
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 8 * 60 * 1000, // 8 minutos
    retry: 2
  })
}

// Hook para obtener solo citas de una cuenta
export function useAccountAppointments(accountId: string) {
  return useQuery({
    queryKey: ['accountAppointments', accountId],
    queryFn: () => firebaseAdminService.getAppointmentsByAccount(accountId),
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 6 * 60 * 1000, // 6 minutos
    retry: 2
  })
}
