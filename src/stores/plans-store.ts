import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Plan, PlanType, PlanTier, BillingCycle } from 'ixiclinic-types/dist/admin-exports'
import { PLANS } from 'ixiclinic-types/dist/planConfigs'
import { paypalPlanMapping } from '@/lib/config'

// Interfaz para sincronización de precios
interface PricingSync {
  lastSync: Date | null
  source: 'paypal' | 'firebase' | 'manual'
  version: string
  status: 'synced' | 'out_of_sync' | 'error'
}

// Interfaz para configuración de precios
interface PricingConfig {
  currency: string
  taxRate: number
  discountRules: {
    annual: number // porcentaje de descuento para pagos anuales
    volume: Array<{
      minUsers: number
      discount: number
    }>
  }
}

interface PlansStoreState {
  // Plans data
  plans: Plan[]
  setPlans: (plans: Plan[]) => void
  
  // PayPal plan mapping
  paypalPlanMapping: Record<string, string> // local plan id -> paypal plan id
  setPaypalPlanMapping: (mapping: Record<string, string>) => void
  
  // Pricing sync
  pricingSync: PricingSync
  setPricingSync: (sync: PricingSync) => void
  
  // Configuration
  pricingConfig: PricingConfig
  setPricingConfig: (config: PricingConfig) => void
  
  // Loading states
  isLoading: boolean
  setLoading: (loading: boolean) => void
  
  // Actions
  syncPlansFromPayPal: () => Promise<void>
  syncPlansFromFirebase: () => Promise<void>
  updatePlanPricing: (planId: string, newPrice: number) => Promise<void>
  createPlan: (plan: Omit<Plan, 'name'>) => Promise<string>
  updatePlan: (planId: string, updates: Partial<Plan>) => Promise<void>
  deletePlan: (planId: string) => Promise<void>
  
  // Utilities
  getPlanById: (planId: string) => Plan | null
  getPlansByType: (type: PlanType) => Plan[]
  getPlansByTier: (tier: PlanTier) => Plan[]
  calculatePrice: (planId: string, _billingCycle: BillingCycle, userCount?: number) => number
  getPayPalPlanId: (localPlanId: string) => string | null
  validatePriceSync: () => Promise<boolean>
}

// Convertir planes del paquete ixiclinic-types a formato compatible
function convertPlanConfigToStoreFormat(): Plan[] {
  const convertedPlans: Plan[] = []
  
  Object.entries(PLANS).forEach(([key, planConfig]) => {
    // Crear variantes para diferentes ciclos de facturación
    const billingCycles = ['monthly', 'quarterly', 'annual'] as const
    
    billingCycles.forEach(cycle => {
      // Calcular precio según el ciclo
      let price = typeof planConfig.price === 'number' ? planConfig.price : 0
      let popular = false
      
      if (cycle === 'quarterly') {
        price = price * 3 * 0.95 // 5% descuento trimestral
      } else if (cycle === 'annual') {
        price = price * 12 * 0.83 // 17% descuento anual
        popular = ('popular' in planConfig && planConfig.popular) || false
      }
      
      const planName = `${key.toLowerCase().replace(/_/g, '-')}-${cycle}`
      
      convertedPlans.push({
        name: planName,
        price: Math.round(price * 100) / 100, // Redondear a 2 decimales
        type: planConfig.type,
        tier: planConfig.tier,
        billing: cycle as BillingCycle,
        features: planConfig.features,
        limits: planConfig.limits,
        popular: popular
      })
    })
  })
  
  return convertedPlans
}

// Planes basados en la configuración del paquete ixiclinic-types
const defaultPlans: Plan[] = convertPlanConfigToStoreFormat()

// Configuración de precios por defecto
const defaultPricingConfig: PricingConfig = {
  currency: 'USD',
  taxRate: 0.16, // 16% IVA (República Dominicana)
  discountRules: {
    annual: 16.67, // 16.67% descuento anual (2 meses gratis)
    volume: [
      { minUsers: 5, discount: 5 },
      { minUsers: 10, discount: 10 },
      { minUsers: 25, discount: 15 },
      { minUsers: 50, discount: 20 }
    ]
  }
}

export const usePlansStore = create<PlansStoreState>()(
  persist(
    (set, get) => ({
      // State inicial
      plans: defaultPlans,
      paypalPlanMapping: paypalPlanMapping,
      pricingSync: {
        lastSync: null,
        source: 'manual',
        version: '1.0.0',
        status: 'synced'
      },
      pricingConfig: defaultPricingConfig,
      isLoading: false,

      // Setters
      setPlans: (plans) => set({ plans }),
      setPaypalPlanMapping: (mapping) => set({ paypalPlanMapping: mapping }),
      setPricingSync: (sync) => set((prev) => ({ 
        pricingSync: { ...prev.pricingSync, ...sync } 
      })),
      setPricingConfig: (config) => set({ pricingConfig: config }),
      setLoading: (loading) => set({ isLoading: loading }),

      // Actions
      syncPlansFromPayPal: async () => {
        set({ isLoading: true })
        try {
          // TODO: Implementar sincronización con PayPal API
          console.log('Sincronizando planes desde PayPal...')
          
          set({ 
            pricingSync: {
              lastSync: new Date(),
              source: 'paypal',
              version: '1.0.0',
              status: 'synced'
            }
          })
        } catch (error) {
          console.error('Error sincronizando desde PayPal:', error)
          set({ 
            pricingSync: {
              lastSync: new Date(),
              source: 'paypal',
              version: '1.0.0',
              status: 'error'
            }
          })
        } finally {
          set({ isLoading: false })
        }
      },

      syncPlansFromFirebase: async () => {
        set({ isLoading: true })
        try {
          // TODO: Implementar sincronización con Firebase
          console.log('Sincronizando planes desde Firebase...')
          
          set({ 
            pricingSync: {
              lastSync: new Date(),
              source: 'firebase',
              version: '1.0.0',
              status: 'synced'
            }
          })
        } catch (error) {
          console.error('Error sincronizando desde Firebase:', error)
          set({ 
            pricingSync: {
              lastSync: new Date(),
              source: 'firebase',
              version: '1.0.0',
              status: 'error'
            }
          })
        } finally {
          set({ isLoading: false })
        }
      },

      updatePlanPricing: async (planId: string, newPrice: number) => {
        const { plans } = get()
        const updatedPlans = plans.map(plan => 
          plan.name === planId ? { ...plan, price: newPrice } : plan
        )
        set({ plans: updatedPlans })
        
        // TODO: Sincronizar con PayPal y Firebase
        console.log(`Precio actualizado para ${planId}: $${newPrice}`)
      },

      createPlan: async (planData) => {
        const newPlan: Plan = {
          ...planData,
          name: `custom-${Date.now()}`
        }
        
        const { plans } = get()
        set({ plans: [...plans, newPlan] })
        
        return newPlan.name
      },

      updatePlan: async (planId: string, updates: Partial<Plan>) => {
        const { plans } = get()
        const updatedPlans = plans.map(plan => 
          plan.name === planId ? { ...plan, ...updates } : plan
        )
        set({ plans: updatedPlans })
      },

      deletePlan: async (planId: string) => {
        const { plans } = get()
        const filteredPlans = plans.filter(plan => plan.name !== planId)
        set({ plans: filteredPlans })
      },

      // Utilities
      getPlanById: (planId: string) => {
        const { plans } = get()
        return plans.find(plan => plan.name === planId) || null
      },

      getPlansByType: (type: PlanType) => {
        const { plans } = get()
        return plans.filter(plan => plan.type === type)
      },

      getPlansByTier: (tier: PlanTier) => {
        const { plans } = get()
        return plans.filter(plan => plan.tier === tier)
      },

      calculatePrice: (planId: string, _billingCycle: BillingCycle, userCount?: number) => {
        const plan = get().getPlanById(planId)
        if (!plan || typeof plan.price !== 'number') return 0
        
        let finalPrice = plan.price
        
        // Aplicar descuentos por volumen si se especifica userCount
        if (userCount && userCount > 1) {
          const { pricingConfig } = get()
          const volumeDiscount = pricingConfig.discountRules.volume
            .reverse()
            .find(rule => userCount >= rule.minUsers)
          
          if (volumeDiscount) {
            finalPrice = finalPrice * (1 - volumeDiscount.discount / 100)
          }
        }
        
        return Math.round(finalPrice * 100) / 100
      },

      getPayPalPlanId: (localPlanId: string) => {
        const { paypalPlanMapping } = get()
        return paypalPlanMapping[localPlanId] || null
      },

      validatePriceSync: async () => {
        try {
          // TODO: Implementar validación real
          console.log('Validando sincronización de precios...')
          return true
        } catch (error) {
          console.error('Error validando sincronización:', error)
          return false
        }
      }
    }),
    {
      name: 'ixiclinic-plans-store',
      version: 1
    }
  )
)