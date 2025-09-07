// Servicio para sincronizar precios entre diferentes fuentes
import { paypalService } from './paypal-service'
import { usePlansStore } from '@/stores/plans-store'

export interface PricingSource {
  name: string
  type: 'paypal' | 'firebase' | 'manual'
  lastSync: Date | null
  version: string
}

export interface PricingDifference {
  planId: string
  planName: string
  localPrice: number
  remotePrice: number
  source: PricingSource['type']
  action: 'update_local' | 'update_remote' | 'conflict'
}

class PricingSyncService {
  
  // ===== Sincronización desde PayPal =====
  
  async syncFromPayPal(): Promise<{
    success: boolean
    differences: PricingDifference[]
    errors: string[]
  }> {
    const errors: string[] = []
    const differences: PricingDifference[] = []
    
    try {
      console.log('🔄 Iniciando sincronización desde PayPal...')
      
      // Obtener planes de PayPal
      const paypalPlans = await paypalService.getPlans()
      
      if (!paypalPlans.plans || paypalPlans.plans.length === 0) {
        errors.push('No se encontraron planes en PayPal')
        return { success: false, differences, errors }
      }

      // Obtener planes locales
      const { plans: localPlans, paypalPlanMapping } = usePlansStore.getState()
      
      // Comparar precios
      for (const paypalPlan of paypalPlans.plans) {
        // Buscar el plan local correspondiente
        const localPlanId = Object.keys(paypalPlanMapping).find(
          key => paypalPlanMapping[key] === paypalPlan.id
        )
        
        if (!localPlanId) {
          console.warn(`Plan PayPal ${paypalPlan.id} no tiene mapeo local`)
          continue
        }
        
        const localPlan = localPlans.find(p => p.name === localPlanId)
        if (!localPlan) {
          errors.push(`Plan local ${localPlanId} no encontrado`)
          continue
        }
        
        // Obtener precio de PayPal (primer ciclo de facturación)
        const paypalPrice = paypalPlan.billing_cycles?.[0]?.pricing_scheme?.fixed_price?.value
        if (!paypalPrice) {
          errors.push(`No se pudo obtener precio de PayPal para ${paypalPlan.name}`)
          continue
        }
        
        const paypalPriceNumber = parseFloat(paypalPrice)
        const localPriceNumber = typeof localPlan.price === 'number' 
          ? localPlan.price 
          : parseFloat(localPlan.price)
        
        // Si hay diferencia en precios
        if (Math.abs(paypalPriceNumber - localPriceNumber) > 0.01) {
          differences.push({
            planId: localPlanId,
            planName: localPlan.name,
            localPrice: localPriceNumber,
            remotePrice: paypalPriceNumber,
            source: 'paypal',
            action: 'update_local' // Por defecto, PayPal es la fuente de verdad
          })
        }
      }
      
      console.log(`✅ Sincronización completada. ${differences.length} diferencias encontradas`)
      
      return {
        success: true,
        differences,
        errors
      }
      
    } catch (error) {
      console.error('❌ Error en sincronización desde PayPal:', error)
      errors.push(`Error de sincronización: ${error}`)
      return { success: false, differences, errors }
    }
  }
  
  // ===== Sincronización desde Firebase =====
  
  async syncFromFirebase(): Promise<{
    success: boolean
    differences: PricingDifference[]
    errors: string[]
  }> {
    const errors: string[] = []
    const differences: PricingDifference[] = []
    
    try {
      console.log('🔄 Iniciando sincronización desde Firebase...')
      
      // Aquí implementarías la lógica para obtener precios desde Firebase
      // Por ejemplo, si tienes una colección 'pricing' en Firestore
      
      // Ejemplo de implementación:
      /*
      const pricingDoc = await firebaseAdminService.getPricingConfig()
      if (!pricingDoc) {
        errors.push('No se encontró configuración de precios en Firebase')
        return { success: false, differences, errors }
      }
      
      const { plans: localPlans } = usePlansStore.getState()
      
      for (const localPlan of localPlans) {
        const firebasePrice = pricingDoc.plans?.[localPlan.name]?.price
        if (firebasePrice && firebasePrice !== localPlan.price) {
          differences.push({
            planId: localPlan.name,
            planName: localPlan.name,
            localPrice: typeof localPlan.price === 'number' ? localPlan.price : parseFloat(localPlan.price),
            remotePrice: firebasePrice,
            source: 'firebase',
            action: 'update_local'
          })
        }
      }
      */
      
      console.log('✅ Sincronización desde Firebase completada (simulada)')
      
      return {
        success: true,
        differences,
        errors
      }
      
    } catch (error) {
      console.error('❌ Error en sincronización desde Firebase:', error)
      errors.push(`Error de sincronización: ${error}`)
      return { success: false, differences, errors }
    }
  }
  
  // ===== Aplicar diferencias =====
  
  async applyDifferences(differences: PricingDifference[]): Promise<{
    success: boolean
    applied: number
    errors: string[]
  }> {
    const errors: string[] = []
    let applied = 0
    
    try {
      const { updatePlanPricing } = usePlansStore.getState()
      
      for (const diff of differences) {
        try {
          if (diff.action === 'update_local') {
            // Actualizar precio local
            await updatePlanPricing(diff.planId, diff.remotePrice)
            applied++
            console.log(`✅ Precio actualizado para ${diff.planName}: ${diff.localPrice} → ${diff.remotePrice}`)
          } else if (diff.action === 'update_remote') {
            // Actualizar precio remoto (PayPal)
            if (diff.source === 'paypal') {
              const { paypalPlanMapping } = usePlansStore.getState()
              const paypalPlanId = paypalPlanMapping[diff.planId]
              
              if (paypalPlanId) {
                await paypalService.updatePlanPricing(paypalPlanId, diff.localPrice.toString())
                applied++
                console.log(`✅ Precio PayPal actualizado para ${diff.planName}`)
              }
            }
          }
        } catch (error) {
          errors.push(`Error aplicando diferencia para ${diff.planName}: ${error}`)
        }
      }
      
      return {
        success: errors.length === 0,
        applied,
        errors
      }
      
    } catch (error) {
      console.error('❌ Error aplicando diferencias:', error)
      return {
        success: false,
        applied,
        errors: [`Error general: ${error}`]
      }
    }
  }
  
  // ===== Validación de sincronización =====
  
  async validateSync(): Promise<{
    isValid: boolean
    issues: string[]
    lastValidation: Date
  }> {
    const issues: string[] = []
    
    try {
      // Verificar que todos los planes locales tengan mapeo a PayPal
      const { plans, paypalPlanMapping } = usePlansStore.getState()
      
      for (const plan of plans) {
        if (!paypalPlanMapping[plan.name]) {
          issues.push(`Plan ${plan.name} no tiene mapeo a PayPal`)
        }
      }
      
      // Verificar que los precios estén sincronizados
      const syncResult = await this.syncFromPayPal()
      if (syncResult.differences.length > 0) {
        issues.push(`${syncResult.differences.length} diferencias de precio encontradas`)
      }
      
      return {
        isValid: issues.length === 0,
        issues,
        lastValidation: new Date()
      }
      
    } catch (error) {
      console.error('❌ Error validando sincronización:', error)
      return {
        isValid: false,
        issues: [`Error de validación: ${error}`],
        lastValidation: new Date()
      }
    }
  }
  
  // ===== Configuración de mapeo =====
  
  async setupPlanMapping(localPlanId: string, paypalPlanId: string): Promise<boolean> {
    try {
      const { paypalPlanMapping, setPaypalPlanMapping } = usePlansStore.getState()
      
      const newMapping = {
        ...paypalPlanMapping,
        [localPlanId]: paypalPlanId
      }
      
      setPaypalPlanMapping(newMapping)
      
      console.log(`✅ Mapeo configurado: ${localPlanId} → ${paypalPlanId}`)
      return true
      
    } catch (error) {
      console.error('❌ Error configurando mapeo:', error)
      return false
    }
  }
  
  // ===== Utilidades =====
  
  formatPriceDifference(diff: PricingDifference): string {
    const direction = diff.localPrice > diff.remotePrice ? '↓' : '↑'
    const amount = Math.abs(diff.localPrice - diff.remotePrice)
    return `${diff.planName}: ${direction} $${amount.toFixed(2)}`
  }
  
  calculateSyncScore(differences: PricingDifference[]): number {
    const { plans } = usePlansStore.getState()
    if (plans.length === 0) return 100
    
    const syncedPlans = plans.length - differences.length
    return Math.round((syncedPlans / plans.length) * 100)
  }
}

// Instancia singleton
export const pricingSyncService = new PricingSyncService()

// Tipos para exportar
export { PricingSyncService }
