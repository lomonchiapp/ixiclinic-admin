import { create } from 'zustand'
import type { SubscriptionStatus } from 'ixiclinic-types/dist/admin-exports'

// Interfaces para PayPal
interface PayPalSubscription {
  id: string
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED'
  plan_id: string
  start_time: string
  billing_info: {
    outstanding_balance: {
      currency_code: string
      value: string
    }
    cycle_executions: Array<{
      tenure_type: string
      sequence: number
      cycles_completed: number
      cycles_remaining: number
      current_pricing_scheme_version: number
    }>
    last_payment: {
      amount: {
        currency_code: string
        value: string
      }
      time: string
    }
    next_billing_time: string
    failed_payments_count: number
  }
  subscriber: {
    email_address: string
    payer_id: string
  }
  create_time: string
  update_time: string
}

interface PayPalPlan {
  id: string
  product_id: string
  name: string
  description: string
  status: 'CREATED' | 'INACTIVE' | 'ACTIVE'
  billing_cycles: Array<{
    frequency: {
      interval_unit: 'MONTH' | 'YEAR'
      interval_count: number
    }
    tenure_type: 'REGULAR' | 'TRIAL'
    sequence: number
    total_cycles: number
    pricing_scheme: {
      fixed_price: {
        currency_code: string
        value: string
      }
    }
  }>
  payment_preferences: {
    auto_bill_outstanding: boolean
    setup_fee_failure_action: 'CONTINUE' | 'CANCEL'
    payment_failure_threshold: number
  }
  create_time: string
  update_time: string
}

interface PayPalWebhookEvent {
  id: string
  event_type: string
  resource_type: string
  summary: string
  resource: any
  create_time: string
}

interface PayPalStoreState {
  // PayPal Plans
  paypalPlans: PayPalPlan[]
  setPaypalPlans: (plans: PayPalPlan[]) => void
  
  // Subscriptions
  subscriptions: PayPalSubscription[]
  setSubscriptions: (subscriptions: PayPalSubscription[]) => void
  
  // Problem subscriptions
  problemSubscriptions: PayPalSubscription[]
  setProblemSubscriptions: (subscriptions: PayPalSubscription[]) => void
  
  // Webhook events
  webhookEvents: PayPalWebhookEvent[]
  setWebhookEvents: (events: PayPalWebhookEvent[]) => void
  
  // Loading states
  isLoadingPlans: boolean
  isLoadingSubscriptions: boolean
  setLoadingPlans: (loading: boolean) => void
  setLoadingSubscriptions: (loading: boolean) => void
  
  // Actions
  fetchPayPalPlans: () => Promise<void>
  fetchSubscriptions: () => Promise<void>
  fetchProblemSubscriptions: () => Promise<void>
  
  // Subscription management
  cancelSubscription: (subscriptionId: string, reason: string) => Promise<boolean>
  reactivateSubscription: (subscriptionId: string) => Promise<boolean>
  suspendSubscription: (subscriptionId: string, reason: string) => Promise<boolean>
  
  // Billing management
  retryFailedPayment: (subscriptionId: string) => Promise<boolean>
  updateSubscriptionPlan: (subscriptionId: string, newPlanId: string) => Promise<boolean>
  
  // Utilities
  getSubscriptionByAccountId: (accountId: string) => PayPalSubscription | null
  getAccountStatus: (subscription: PayPalSubscription) => SubscriptionStatus
  formatPayPalStatus: (status: string) => string
}

export const usePayPalStore = create<PayPalStoreState>()((set, get) => ({
  // State
  paypalPlans: [],
  subscriptions: [],
  problemSubscriptions: [],
  webhookEvents: [],
  isLoadingPlans: false,
  isLoadingSubscriptions: false,
  
  // Setters
  setPaypalPlans: (paypalPlans) => set({ paypalPlans }),
  setSubscriptions: (subscriptions) => set({ subscriptions }),
  setProblemSubscriptions: (problemSubscriptions) => set({ problemSubscriptions }),
  setWebhookEvents: (webhookEvents) => set({ webhookEvents }),
  setLoadingPlans: (isLoadingPlans) => set({ isLoadingPlans }),
  setLoadingSubscriptions: (isLoadingSubscriptions) => set({ isLoadingSubscriptions }),
  
  // Actions
  fetchPayPalPlans: async () => {
    const { setLoadingPlans, setPaypalPlans } = get()
    setLoadingPlans(true)
    try {
      // Aquí iría la llamada real a la API de PayPal
      // const response = await paypalApi.getPlans()
      // setPaypalPlans(response.plans)
      
      // Por ahora simulamos datos
      await new Promise(resolve => setTimeout(resolve, 1000))
      const mockPlans: PayPalPlan[] = [
        {
          id: 'P-123456789',
          product_id: 'PROD-123',
          name: 'Plan Personal Mensual',
          description: 'Plan personal para consultorios individuales',
          status: 'ACTIVE',
          billing_cycles: [{
            frequency: { interval_unit: 'MONTH', interval_count: 1 },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { currency_code: 'USD', value: '29.99' }
            }
          }],
          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee_failure_action: 'CONTINUE',
            payment_failure_threshold: 3
          },
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString()
        }
      ]
      setPaypalPlans(mockPlans)
    } catch (error) {
      console.error('Error fetching PayPal plans:', error)
    } finally {
      setLoadingPlans(false)
    }
  },
  
  fetchSubscriptions: async () => {
    const { setLoadingSubscriptions, setSubscriptions } = get()
    setLoadingSubscriptions(true)
    try {
      // Llamada real a PayPal API
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Mock data por ahora
      setSubscriptions([])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoadingSubscriptions(false)
    }
  },
  
  fetchProblemSubscriptions: async () => {
    try {
      // Obtener suscripciones con problemas de pago
      const { subscriptions } = get()
      const problemSubs = subscriptions.filter(sub => 
        sub.status === 'SUSPENDED' || 
        sub.billing_info.failed_payments_count > 0 ||
        sub.billing_info.outstanding_balance.value !== '0.00'
      )
      get().setProblemSubscriptions(problemSubs)
    } catch (error) {
      console.error('Error fetching problem subscriptions:', error)
    }
  },
  
  // Subscription management
  cancelSubscription: async (subscriptionId: string, reason: string) => {
    try {
      // Llamada a PayPal API para cancelar suscripción
      console.log(`Cancelling subscription ${subscriptionId} with reason: ${reason}`)
      return true
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      return false
    }
  },
  
  reactivateSubscription: async (subscriptionId: string) => {
    try {
      // Llamada a PayPal API para reactivar suscripción
      console.log(`Reactivating subscription ${subscriptionId}`)
      return true
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      return false
    }
  },
  
  suspendSubscription: async (subscriptionId: string, reason: string) => {
    try {
      // Llamada a PayPal API para suspender suscripción
      console.log(`Suspending subscription ${subscriptionId} with reason: ${reason}`)
      return true
    } catch (error) {
      console.error('Error suspending subscription:', error)
      return false
    }
  },
  
  retryFailedPayment: async (subscriptionId: string) => {
    try {
      // Intentar reintentar el pago fallido
      console.log(`Retrying failed payment for subscription ${subscriptionId}`)
      return true
    } catch (error) {
      console.error('Error retrying payment:', error)
      return false
    }
  },
  
  updateSubscriptionPlan: async (subscriptionId: string, newPlanId: string) => {
    try {
      // Actualizar el plan de la suscripción
      console.log(`Updating subscription ${subscriptionId} to plan ${newPlanId}`)
      return true
    } catch (error) {
      console.error('Error updating subscription plan:', error)
      return false
    }
  },
  
  // Utilities
  getSubscriptionByAccountId: (accountId: string) => {
    const { subscriptions } = get()
    return subscriptions.find(sub => sub.subscriber.payer_id === accountId) || null
  },
  
  getAccountStatus: (subscription: PayPalSubscription): SubscriptionStatus => {
    switch (subscription.status) {
      case 'ACTIVE':
        return 'active' as SubscriptionStatus
      case 'SUSPENDED':
        return 'inactive' as SubscriptionStatus
      case 'CANCELLED':
      case 'EXPIRED':
        return 'cancelled' as SubscriptionStatus
      case 'APPROVAL_PENDING':
        return 'pending' as SubscriptionStatus
      default:
        return 'inactive' as SubscriptionStatus
    }
  },
  
  formatPayPalStatus: (status: string) => {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'Activa',
      'SUSPENDED': 'Suspendida',
      'CANCELLED': 'Cancelada',
      'EXPIRED': 'Expirada',
      'APPROVAL_PENDING': 'Pendiente de Aprobación',
      'APPROVED': 'Aprobada'
    }
    return statusMap[status] || status
  }
}))
