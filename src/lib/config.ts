// Configuración centralizada y validación de variables de entorno
import { z } from 'zod'

// Schema de validación para variables de entorno
const envSchema = z.object({
  // Firebase
  VITE_FIREBASE_API_KEY: z.string().min(1, 'Firebase API Key es requerida'),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase Auth Domain es requerido'),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase Project ID es requerido'),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase Storage Bucket es requerido'),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase Messaging Sender ID es requerido'),
  VITE_FIREBASE_APP_ID: z.string().min(1, 'Firebase App ID es requerido'),
  VITE_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  
  // PayPal
  VITE_PAYPAL_SANDBOX: z.string().transform(val => val === 'true'),
  VITE_PAYPAL_CLIENT_ID: z.string().min(1, 'PayPal Client ID es requerido'),
  VITE_PAYPAL_CLIENT_SECRET_KEY: z.string().min(1, 'PayPal Client Secret es requerido'),
  
  // Google Maps (opcional)
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // PayPal Plan IDs
  VITE_PAYPAL_PLAN_PERSONAL_BASIC_MONTHLY: z.string().min(1, 'Plan Personal Basic Monthly es requerido'),
  VITE_PAYPAL_PLAN_PERSONAL_BASIC_QUARTERLY: z.string().min(1, 'Plan Personal Basic Quarterly es requerido'),
  VITE_PAYPAL_PLAN_PERSONAL_BASIC_ANNUAL: z.string().min(1, 'Plan Personal Basic Annual es requerido'),
  VITE_PAYPAL_PLAN_PERSONAL_PRO_MONTHLY: z.string().min(1, 'Plan Personal Pro Monthly es requerido'),
  VITE_PAYPAL_PLAN_PERSONAL_PRO_QUARTERLY: z.string().min(1, 'Plan Personal Pro Quarterly es requerido'),
  VITE_PAYPAL_PLAN_PERSONAL_PRO_ANNUAL: z.string().min(1, 'Plan Personal Pro Annual es requerido'),
  VITE_PAYPAL_PLAN_CLINIC_PRO_MONTHLY: z.string().min(1, 'Plan Clinic Pro Monthly es requerido'),
  VITE_PAYPAL_PLAN_CLINIC_PRO_QUARTERLY: z.string().min(1, 'Plan Clinic Pro Quarterly es requerido'),
  VITE_PAYPAL_PLAN_CLINIC_PRO_ANNUAL: z.string().min(1, 'Plan Clinic Pro Annual es requerido'),
  VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_MONTHLY: z.string().min(1, 'Plan Clinic Enterprise Monthly es requerido'),
  VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_QUARTERLY: z.string().min(1, 'Plan Clinic Enterprise Quarterly es requerido'),
  VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_ANNUAL: z.string().min(1, 'Plan Clinic Enterprise Annual es requerido'),
  VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_MONTHLY: z.string().min(1, 'Plan Hospital Enterprise Monthly es requerido'),
  VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_QUARTERLY: z.string().min(1, 'Plan Hospital Enterprise Quarterly es requerido'),
  VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_ANNUAL: z.string().min(1, 'Plan Hospital Enterprise Annual es requerido'),
})

// Validar variables de entorno al inicializar
function validateEnv() {
  try {
    return envSchema.parse(import.meta.env)
  } catch (error) {
    console.error('❌ Error en variables de entorno:', error)
    throw new Error('Configuración de variables de entorno inválida. Revisa el archivo .env')
  }
}

// Configuración validada
const env = validateEnv()

// Configuración de Firebase
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Configuración de Firebase Admin (variables privadas sin VITE_)
export const firebaseAdminConfig = {
  projectId: typeof process !== 'undefined' ? process.env.FIREBASE_ADMIN_PROJECT_ID : undefined,
  clientEmail: typeof process !== 'undefined' ? process.env.FIREBASE_ADMIN_CLIENT_EMAIL : undefined,
  privateKey: typeof process !== 'undefined' ? process.env.FIREBASE_ADMIN_PRIVATE_KEY : undefined,
}

// Configuración de PayPal
export const paypalConfig = {
  clientId: env.VITE_PAYPAL_CLIENT_ID,
  clientSecret: env.VITE_PAYPAL_CLIENT_SECRET_KEY,
  sandbox: env.VITE_PAYPAL_SANDBOX,
  baseUrl: env.VITE_PAYPAL_SANDBOX 
    ? 'https://api.sandbox.paypal.com' 
    : 'https://api.paypal.com',
}

// Mapeo de planes locales a PayPal IDs
export const paypalPlanMapping = {
  // Personal Plans
  'personal-basic-monthly': env.VITE_PAYPAL_PLAN_PERSONAL_BASIC_MONTHLY,
  'personal-basic-quarterly': env.VITE_PAYPAL_PLAN_PERSONAL_BASIC_QUARTERLY,
  'personal-basic-annual': env.VITE_PAYPAL_PLAN_PERSONAL_BASIC_ANNUAL,
  'personal-pro-monthly': env.VITE_PAYPAL_PLAN_PERSONAL_PRO_MONTHLY,
  'personal-pro-quarterly': env.VITE_PAYPAL_PLAN_PERSONAL_PRO_QUARTERLY,
  'personal-pro-annual': env.VITE_PAYPAL_PLAN_PERSONAL_PRO_ANNUAL,
  
  // Clinic Plans
  'clinic-pro-monthly': env.VITE_PAYPAL_PLAN_CLINIC_PRO_MONTHLY,
  'clinic-pro-quarterly': env.VITE_PAYPAL_PLAN_CLINIC_PRO_QUARTERLY,
  'clinic-pro-annual': env.VITE_PAYPAL_PLAN_CLINIC_PRO_ANNUAL,
  'clinic-enterprise-monthly': env.VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_MONTHLY,
  'clinic-enterprise-quarterly': env.VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_QUARTERLY,
  'clinic-enterprise-annual': env.VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_ANNUAL,
  
  // Hospital Plans
  'hospital-enterprise-monthly': env.VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_MONTHLY,
  'hospital-enterprise-quarterly': env.VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_QUARTERLY,
  'hospital-enterprise-annual': env.VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_ANNUAL,
}

// Mapeo inverso (PayPal ID a plan local)
export const localPlanMapping = Object.fromEntries(
  Object.entries(paypalPlanMapping).map(([local, paypal]) => [paypal, local])
)

// Configuración adicional
export const appConfig = {
  name: 'IxiClinic Admin',
  version: '1.0.0',
  environment: env.VITE_PAYPAL_SANDBOX ? 'development' : 'production',
  googleMapsApiKey: env.VITE_GOOGLE_MAPS_API_KEY,
  
  // Configuración de la aplicación
  features: {
    paypalIntegration: true,
    firebaseIntegration: true,
    googleMapsIntegration: !!env.VITE_GOOGLE_MAPS_API_KEY,
  },
  
  // Configuración de UI
  theme: {
    primaryColor: '#00a99d',
    brandName: 'IxiClinic',
  }
}

// Utilidades de configuración
export const configUtils = {
  // Verificar si estamos en modo desarrollo
  isDevelopment: () => env.VITE_PAYPAL_SANDBOX,
  
  // Verificar si una característica está habilitada
  isFeatureEnabled: (feature: keyof typeof appConfig.features) => {
    return appConfig.features[feature]
  },
  
  // Obtener PayPal Plan ID por nombre local
  getPayPalPlanId: (localPlanName: string) => {
    return paypalPlanMapping[localPlanName as keyof typeof paypalPlanMapping]
  },
  
  // Obtener nombre local por PayPal Plan ID
  getLocalPlanName: (paypalPlanId: string) => {
    return localPlanMapping[paypalPlanId]
  },
  
  // Validar que todos los planes requeridos estén configurados
  validatePlanMapping: () => {
    const missingPlans = []
    
    for (const [planName, planId] of Object.entries(paypalPlanMapping)) {
      if (!planId || planId.trim() === '') {
        missingPlans.push(planName)
      }
    }
    
    if (missingPlans.length > 0) {
      throw new Error(`Planes PayPal no configurados: ${missingPlans.join(', ')}`)
    }
    
    return true
  },
  
  // Obtener configuración completa para debugging
  getDebugInfo: () => ({
    environment: appConfig.environment,
    paypalSandbox: env.VITE_PAYPAL_SANDBOX,
    firebaseProjectId: env.VITE_FIREBASE_PROJECT_ID,
    totalPlansConfigured: Object.keys(paypalPlanMapping).length,
    featuresEnabled: Object.entries(appConfig.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature)
  })
}

// Validar configuración al cargar el módulo
try {
  configUtils.validatePlanMapping()
  console.log('✅ Configuración validada correctamente')
  
  if (configUtils.isDevelopment()) {
    console.log('🔧 Modo desarrollo activado')
    console.log('📊 Info de configuración:', configUtils.getDebugInfo())
  }
} catch (error) {
  console.error('❌ Error en la configuración:', error)
}

// Exportar la configuración validada
export { env }
export default {
  firebase: firebaseConfig,
  paypal: paypalConfig,
  app: appConfig,
  plans: {
    mapping: paypalPlanMapping,
    reverse: localPlanMapping
  },
  utils: configUtils
}
