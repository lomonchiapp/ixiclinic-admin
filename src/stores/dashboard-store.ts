import { create } from 'zustand'
import type { 
  Account, 
  AdminMetrics, 
  SystemAlert
} from 'ixiclinic-types/dist/admin-exports'

interface DashboardState {
  // Metrics
  metrics: AdminMetrics | null
  setMetrics: (metrics: AdminMetrics) => void
  
  // Accounts
  accounts: Account[]
  setAccounts: (accounts: Account[]) => void
  selectedAccount: Account | null
  setSelectedAccount: (account: Account | null) => void
  
  // Alerts
  systemAlerts: SystemAlert[]
  setSystemAlerts: (alerts: SystemAlert[]) => void
  unreadAlertsCount: number
  
  // UI State
  isLoading: boolean
  setLoading: (loading: boolean) => void
  
  // Filters
  filters: {
    searchTerm: string
    statusFilter: string
    typeFilter: string
    dateRange?: {
      start: Date
      end: Date
    }
  }
  setFilters: (filters: Partial<DashboardState['filters']>) => void
  resetFilters: () => void
  
  // Actions
  refreshData: () => Promise<void>
  markAlertAsRead: (alertId: string) => void
}

const initialFilters = {
  searchTerm: '',
  statusFilter: 'all',
  typeFilter: 'all'
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  // State
  metrics: null,
  accounts: [],
  selectedAccount: null,
  systemAlerts: [],
  unreadAlertsCount: 0,
  isLoading: false,
  filters: initialFilters,
  
  // Setters
  setMetrics: (metrics) => set({ metrics }),
  
  setAccounts: (accounts) => set({ accounts }),
  
  setSelectedAccount: (selectedAccount) => set({ selectedAccount }),
  
  setSystemAlerts: (systemAlerts) => 
    set({ 
      systemAlerts,
      unreadAlertsCount: systemAlerts.filter(alert => !alert.resolved).length
    }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setFilters: (newFilters) => 
    set((state) => ({ 
      filters: { ...state.filters, ...newFilters }
    })),
  
  resetFilters: () => set({ filters: initialFilters }),
  
  // Actions
  refreshData: async () => {
    const { setLoading } = get()
    setLoading(true)
    try {
      // Aquí iría la lógica para refrescar todos los datos
      // Por ahora solo simulamos la carga
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setLoading(false)
    }
  },
  
  markAlertAsRead: (alertId) => 
    set((state) => ({
      systemAlerts: state.systemAlerts.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ),
      unreadAlertsCount: Math.max(0, state.unreadAlertsCount - 1)
    }))
}))
