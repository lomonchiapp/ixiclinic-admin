// Validador de variables de entorno para desarrollo y producción
import config, { configUtils } from './config'

export interface EnvValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  missingOptional: string[]
  summary: {
    totalVariables: number
    validVariables: number
    requiredMissing: number
    optionalMissing: number
  }
}

export class EnvironmentValidator {
  
  static validate(): EnvValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const missingOptional: string[] = []
    
    try {
      // Validar configuración básica
      
      // Verificar Firebase
      if (!config.firebase.apiKey) {
        errors.push('Firebase API Key no configurada')
      }
      if (!config.firebase.projectId) {
        errors.push('Firebase Project ID no configurado')
      }
      
      // Verificar PayPal
      if (!config.paypal.clientId) {
        errors.push('PayPal Client ID no configurado')
      }
      if (!config.paypal.clientSecret) {
        errors.push('PayPal Client Secret no configurado')
      }
      
      // Verificar mapeo de planes
      const planMappingErrors = this.validatePlanMapping()
      errors.push(...planMappingErrors)
      
      // Verificar variables opcionales
      if (!config.app.googleMapsApiKey) {
        missingOptional.push('Google Maps API Key (funcionalidad de mapas deshabilitada)')
      }
      
      if (!config.firebase.measurementId) {
        missingOptional.push('Firebase Analytics Measurement ID (analytics deshabilitado)')
      }
      
      // Advertencias para desarrollo
      if (configUtils.isDevelopment()) {
        warnings.push('Ejecutándose en modo SANDBOX de PayPal')
        warnings.push('Asegúrate de cambiar a producción para el despliegue final')
      }
      
      // Calcular resumen
      const totalVariables = 17 // Total de variables definidas
      const validVariables = totalVariables - errors.length - missingOptional.length
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        missingOptional,
        summary: {
          totalVariables,
          validVariables,
          requiredMissing: errors.length,
          optionalMissing: missingOptional.length
        }
      }
      
    } catch (error) {
      return {
        isValid: false,
        errors: [`Error crítico en validación: ${error}`],
        warnings: [],
        missingOptional: [],
        summary: {
          totalVariables: 0,
          validVariables: 0,
          requiredMissing: 1,
          optionalMissing: 0
        }
      }
    }
  }
  
  private static validatePlanMapping(): string[] {
    const errors: string[] = []
    
    try {
      // Usar la validación integrada del config
      configUtils.validatePlanMapping()
    } catch (error) {
      errors.push(`Error en mapeo de planes: ${error}`)
    }
    
    // Verificar que todos los planes tienen IDs únicos
    const planIds = Object.values(config.plans.mapping)
    const duplicates = planIds.filter((id, index) => planIds.indexOf(id) !== index)
    
    if (duplicates.length > 0) {
      errors.push(`IDs de planes PayPal duplicados: ${duplicates.join(', ')}`)
    }
    
    return errors
  }
  
  static validateAndReport(): boolean {
    const result = this.validate()
    
    console.log('\n🔍 === VALIDACIÓN DE VARIABLES DE ENTORNO ===')
    
    // Mostrar resumen
    console.log(`📊 Resumen:`)
    console.log(`   • Total de variables: ${result.summary.totalVariables}`)
    console.log(`   • Variables válidas: ${result.summary.validVariables}`)
    console.log(`   • Variables requeridas faltantes: ${result.summary.requiredMissing}`)
    console.log(`   • Variables opcionales faltantes: ${result.summary.optionalMissing}`)
    
    // Mostrar errores
    if (result.errors.length > 0) {
      console.log('\n❌ ERRORES CRÍTICOS:')
      result.errors.forEach(error => console.log(`   • ${error}`))
    }
    
    // Mostrar advertencias
    if (result.warnings.length > 0) {
      console.log('\n⚠️  ADVERTENCIAS:')
      result.warnings.forEach(warning => console.log(`   • ${warning}`))
    }
    
    // Mostrar variables opcionales faltantes
    if (result.missingOptional.length > 0) {
      console.log('\n💡 VARIABLES OPCIONALES FALTANTES:')
      result.missingOptional.forEach(missing => console.log(`   • ${missing}`))
    }
    
    // Resultado final
    if (result.isValid) {
      console.log('\n✅ CONFIGURACIÓN VÁLIDA - El dashboard puede ejecutarse correctamente')
    } else {
      console.log('\n❌ CONFIGURACIÓN INVÁLIDA - Corrige los errores antes de continuar')
      console.log('\n📖 Consulta ADMIN_SETUP.md para instrucciones detalladas')
    }
    
    console.log('='.repeat(50))
    
    return result.isValid
  }
  
  static createEnvTemplate(): string {
    return `# 🏥 IxiClinic Admin Dashboard - Variables de Entorno
# Copia este archivo como .env.local y completa los valores

# ===== FIREBASE CONFIGURATION =====
VITE_FIREBASE_API_KEY=tu_firebase_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ===== PAYPAL CONFIGURATION =====
VITE_PAYPAL_SANDBOX=true
VITE_PAYPAL_CLIENT_ID=tu_paypal_client_id
VITE_PAYPAL_CLIENT_SECRET_KEY=tu_paypal_client_secret

# ===== GOOGLE MAPS (OPCIONAL) =====
VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key

# ===== PAYPAL PLAN IDS =====
# Personal Plans - Basic
VITE_PAYPAL_PLAN_PERSONAL_BASIC_MONTHLY=P-XXXXXXXXXXXXXXXXX
VITE_PAYPAL_PLAN_PERSONAL_BASIC_QUARTERLY=P-XXXXXXXXXXXXXXXXX
VITE_PAYPAL_PLAN_PERSONAL_BASIC_ANNUAL=P-XXXXXXXXXXXXXXXXX

# Personal Plans - Pro
VITE_PAYPAL_PLAN_PERSONAL_PRO_MONTHLY=P-XXXXXXXXXXXXXXXXX
VITE_PAYPAL_PLAN_PERSONAL_PRO_QUARTERLY=P-XXXXXXXXXXXXXXXXX
VITE_PAYPAL_PLAN_PERSONAL_PRO_ANNUAL=P-XXXXXXXXXXXXXXXXX

# Clinic Plans - Pro
VITE_PAYPAL_PLAN_CLINIC_PRO_MONTHLY=P-XXXXXXXXXXXXXXXXX
VITE_PAYPAL_PLAN_CLINIC_PRO_QUARTERLY=P-XXXXXXXXXXXXXXXXX
VITE_PAYPAL_PLAN_CLINIC_PRO_ANNUAL=P-XXXXXXXXXXXXXXXXX

# Clinic Plans - Enterprise
VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_MONTHLY=P-XXXXXXXXXXXXXXXXX
VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_QUARTERLY=P-XXXXXXXXXXXXXXXXX
VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_ANNUAL=P-XXXXXXXXXXXXXXXXX

# Hospital Plans - Enterprise
VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_MONTHLY=P-XXXXXXXXXXXXXXXXX
VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_QUARTERLY=P-XXXXXXXXXXXXXXXXX
VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_ANNUAL=P-XXXXXXXXXXXXXXXXX`
  }
}

// Ejecutar validación automáticamente en desarrollo
if (configUtils.isDevelopment()) {
  // Dar tiempo a que se cargue el entorno
  setTimeout(() => {
    EnvironmentValidator.validateAndReport()
  }, 1000)
}
