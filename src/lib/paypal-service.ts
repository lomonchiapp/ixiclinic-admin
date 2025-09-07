// Servicio para integrar con la API de PayPal
// Este archivo contiene las funciones para gestionar suscripciones, planes y pagos

interface PayPalConfig {
  clientId: string
  clientSecret: string
  baseUrl: string // sandbox: https://api.sandbox.paypal.com, production: https://api.paypal.com
}

interface PayPalAccessToken {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

class PayPalService {
  private config: PayPalConfig
  private accessToken: string | null = null
  private tokenExpiry: number = 0
  
  /**
   * Sincronizar precios de planes con PayPal
   */
  async syncPlansWithPayPal(): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const errors: string[] = []
      
      // Obtener todos los planes de PayPal
      const paypalPlans = await this.getPlans()
      
      // Comparar con los planes del paquete ixiclinic-types
      for (const [planKey, planConfig] of Object.entries(PLANS)) {
        if (typeof planConfig.price === 'number') {
          // Buscar plan correspondiente en PayPal
          const paypalPlan = paypalPlans.find((p: any) => 
            p.name.toLowerCase().includes(planConfig.name.toLowerCase()) &&
            p.name.toLowerCase().includes(planConfig.billing)
          )
          
          if (paypalPlan) {
            // Verificar si el precio coincide
            const paypalPrice = parseFloat(paypalPlan.billing_cycles?.[0]?.pricing_scheme?.fixed_price?.value || '0')
            
            if (Math.abs(paypalPrice - planConfig.price) > 0.01) {
              console.warn(`Precio desincronizado: ${planKey}`, {
                ixiclinic: planConfig.price,
                paypal: paypalPrice
              })
              
              // Aquí podrías implementar la actualización automática
              // await this.updatePlanPricing(paypalPlan.id, planConfig.price)
            }
          } else {
            errors.push(`Plan no encontrado en PayPal: ${planKey}`)
          }
        }
      }
      
      return { 
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      }
      
    } catch (error) {
      console.error('Error sincronizando planes con PayPal:', error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      }
    }
  }
  
  /**
   * Obtener métricas de uso de planes
   */
  async getPlansUsageMetrics(): Promise<{
    planUsage: Record<string, number>
    totalSubscriptions: number
    activeSubscriptions: number
    problemSubscriptions: number
    monthlyRevenue: number
  }> {
    try {
      const subscriptions = await this.getSubscriptions()
      
      const planUsage: Record<string, number> = {}
      let activeCount = 0
      let problemCount = 0
      let monthlyRevenue = 0
      
      for (const subscription of subscriptions) {
        // Contar por plan
        const planId = subscription.plan_id
        planUsage[planId] = (planUsage[planId] || 0) + 1
        
        // Contar estados
        if (subscription.status === 'ACTIVE') {
          activeCount++
          
          // Calcular ingresos mensuales
          const lastPayment = subscription.billing_info?.last_payment
          if (lastPayment) {
            monthlyRevenue += parseFloat(lastPayment.amount.value)
          }
        }
        
        if (this.hasPaymentIssues(subscription)) {
          problemCount++
        }
      }
      
      return {
        planUsage,
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeCount,
        problemSubscriptions: problemCount,
        monthlyRevenue
      }
      
    } catch (error) {
      console.error('Error obteniendo métricas de planes:', error)
      return {
        planUsage: {},
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        problemSubscriptions: 0,
        monthlyRevenue: 0
      }
    }
  }

  constructor(config: PayPalConfig) {
    this.config = config
  }

  // ===== Autenticación =====
  
  private async getAccessToken(): Promise<string> {
    // Verificar si el token actual sigue siendo válido
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const credentials = btoa(`${this.config.clientId}:${this.config.clientSecret}`)
      
      const response = await fetch(`${this.config.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      })

      if (!response.ok) {
        throw new Error(`PayPal auth failed: ${response.status}`)
      }

      const tokenData: PayPalAccessToken = await response.json()
      
      this.accessToken = tokenData.access_token
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000 // 1 minuto antes de expirar
      
      return this.accessToken
    } catch (error) {
      console.error('Error getting PayPal access token:', error)
      throw new Error('Failed to authenticate with PayPal')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAccessToken()
    
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'PayPal-Request-Id': `${Date.now()}-${Math.random()}`, // Para idempotencia
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`PayPal API error: ${response.status} - ${JSON.stringify(error)}`)
    }

    return response.json()
  }

  // ===== Gestión de Planes =====
  
  async getPlans() {
    try {
      return await this.makeRequest('/v1/billing/plans?page_size=20')
    } catch (error) {
      console.error('Error fetching PayPal plans:', error)
      throw error
    }
  }

  async getPlan(planId: string) {
    try {
      return await this.makeRequest(`/v1/billing/plans/${planId}`)
    } catch (error) {
      console.error(`Error fetching PayPal plan ${planId}:`, error)
      throw error
    }
  }

  async updatePlanPricing(planId: string, newPrice: string, currencyCode = 'USD') {
    try {
      const updateData = [{
        op: 'replace',
        path: '/billing_cycles/@sequence==1/pricing_scheme/fixed_price',
        value: {
          currency_code: currencyCode,
          value: newPrice
        }
      }]

      return await this.makeRequest(`/v1/billing/plans/${planId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      })
    } catch (error) {
      console.error(`Error updating PayPal plan pricing ${planId}:`, error)
      throw error
    }
  }

  async activatePlan(planId: string) {
    try {
      return await this.makeRequest(`/v1/billing/plans/${planId}/activate`, {
        method: 'POST'
      })
    } catch (error) {
      console.error(`Error activating PayPal plan ${planId}:`, error)
      throw error
    }
  }

  async deactivatePlan(planId: string) {
    try {
      return await this.makeRequest(`/v1/billing/plans/${planId}/deactivate`, {
        method: 'POST'
      })
    } catch (error) {
      console.error(`Error deactivating PayPal plan ${planId}:`, error)
      throw error
    }
  }

  // ===== Gestión de Suscripciones =====
  
  async getSubscriptions(status?: string) {
    try {
      let endpoint = '/v1/billing/subscriptions?page_size=20'
      if (status) {
        endpoint += `&status=${status}`
      }
      return await this.makeRequest(endpoint)
    } catch (error) {
      console.error('Error fetching PayPal subscriptions:', error)
      throw error
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      return await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}`)
    } catch (error) {
      console.error(`Error fetching PayPal subscription ${subscriptionId}:`, error)
      throw error
    }
  }

  async cancelSubscription(subscriptionId: string, reason: string) {
    try {
      return await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reason
        })
      })
    } catch (error) {
      console.error(`Error cancelling PayPal subscription ${subscriptionId}:`, error)
      throw error
    }
  }

  async suspendSubscription(subscriptionId: string, reason: string) {
    try {
      return await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}/suspend`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reason
        })
      })
    } catch (error) {
      console.error(`Error suspending PayPal subscription ${subscriptionId}:`, error)
      throw error
    }
  }

  async activateSubscription(subscriptionId: string, reason: string) {
    try {
      return await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}/activate`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reason
        })
      })
    } catch (error) {
      console.error(`Error activating PayPal subscription ${subscriptionId}:`, error)
      throw error
    }
  }

  async reviseSubscription(subscriptionId: string, planId: string) {
    try {
      return await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}/revise`, {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          application_context: {
            user_action: 'SUBSCRIBE_NOW',
            payment_method: {
              payer_selected: 'PAYPAL',
              payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
            }
          }
        })
      })
    } catch (error) {
      console.error(`Error revising PayPal subscription ${subscriptionId}:`, error)
      throw error
    }
  }

  // ===== Gestión de Transacciones =====
  
  async getSubscriptionTransactions(subscriptionId: string, startDate: string, endDate: string) {
    try {
      const endpoint = `/v1/billing/subscriptions/${subscriptionId}/transactions?start_time=${startDate}&end_time=${endDate}`
      return await this.makeRequest(endpoint)
    } catch (error) {
      console.error(`Error fetching subscription transactions ${subscriptionId}:`, error)
      throw error
    }
  }

  // ===== Webhooks =====
  
  async getWebhookEvents(pageSize = 10) {
    try {
      return await this.makeRequest(`/v1/notifications/webhooks-events?page_size=${pageSize}`)
    } catch (error) {
      console.error('Error fetching webhook events:', error)
      throw error
    }
  }

  async getWebhookEvent(eventId: string) {
    try {
      return await this.makeRequest(`/v1/notifications/webhooks-events/${eventId}`)
    } catch (error) {
      console.error(`Error fetching webhook event ${eventId}:`, error)
      throw error
    }
  }

  async verifyWebhookSignature(headers: Record<string, string>, body: string, webhookId: string) {
    try {
      return await this.makeRequest('/v1/notifications/verify-webhook-signature', {
        method: 'POST',
        body: JSON.stringify({
          transmission_id: headers['paypal-transmission-id'],
          cert_id: headers['paypal-cert-id'],
          auth_algo: headers['paypal-auth-algo'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: JSON.parse(body)
        })
      })
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      throw error
    }
  }

  // ===== Utilidades =====
  
  formatPayPalDate(dateString: string): Date {
    return new Date(dateString)
  }

  formatCurrency(amount: string, currencyCode: string): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currencyCode
    }).format(parseFloat(amount))
  }

  isSubscriptionActive(subscription: any): boolean {
    return subscription.status === 'ACTIVE'
  }

  hasPaymentIssues(subscription: any): boolean {
    return subscription.billing_info?.failed_payments_count > 0 ||
           parseFloat(subscription.billing_info?.outstanding_balance?.value || '0') > 0
  }
}

import { paypalConfig } from './config'
import { PLANS } from 'ixiclinic-types/dist/planConfigs'

// Instancia singleton del servicio usando configuración centralizada
export const paypalService = new PayPalService({
  clientId: paypalConfig.clientId,
  clientSecret: paypalConfig.clientSecret,
  baseUrl: paypalConfig.baseUrl
})

// Tipos para TypeScript
export type { PayPalConfig, PayPalAccessToken }
export { PayPalService }
