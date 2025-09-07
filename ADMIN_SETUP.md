# 🏥 IxiClinic Admin Dashboard - Guía de Configuración

## 📋 Resumen

Este dashboard administrativo te permite gestionar todas las cuentas de IxiClinic, sus suscripciones de PayPal, precios de planes, y resolver problemas de pago desde una interfaz centralizada.

## 🚀 Configuración Inicial

### 1. Variables de Entorno

**⚠️ IMPORTANTE**: Crea un archivo `.env.local` en la raíz del proyecto con TODAS las variables requeridas.

#### Configuración Completa:

```bash
# ===== FIREBASE CONFIGURATION =====
VITE_FIREBASE_API_KEY=AIzaSyANTeBVegrsGt7wBG53x4ZBAc7nwSbEV1E
VITE_FIREBASE_AUTH_DOMAIN=ixiclinic-f8029.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ixiclinic-f8029
VITE_FIREBASE_STORAGE_BUCKET=ixiclinic-f8029.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=381215944887
VITE_FIREBASE_APP_ID=1:381215944887:web:3640dce85336bacf305d32
VITE_FIREBASE_MEASUREMENT_ID=G-WCEYKSMES3

# ===== PAYPAL CONFIGURATION =====
VITE_PAYPAL_SANDBOX=true
VITE_PAYPAL_CLIENT_ID=tu_paypal_client_id_aqui
VITE_PAYPAL_CLIENT_SECRET_KEY=tu_paypal_client_secret_aqui

# ===== GOOGLE MAPS (OPCIONAL) =====
VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key_aqui

# ===== PAYPAL PLAN IDS (REQUERIDOS) =====
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
VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_ANNUAL=P-XXXXXXXXXXXXXXXXX
```

#### ✅ Validación Automática:
El sistema incluye **validación automática** de todas las variables de entorno. Si falta alguna variable requerida, verás un error detallado en la consola al iniciar la aplicación.

### 2. Configuración de Firebase

1. **Roles de Administrador**: Crea una colección `admin_users` en Firestore con la estructura:
```json
{
  "uid": "firebase_user_uid",
  "email": "admin@ixiclinic.com",
  "role": "super_admin", // super_admin | admin | support
  "permissions": [
    "accounts.read",
    "accounts.write", 
    "subscriptions.manage",
    "plans.edit",
    "metrics.view"
  ],
  "createdAt": "timestamp",
  "lastLogin": "timestamp"
}
```

2. **Reglas de Seguridad**: Actualiza las reglas de Firestore para permitir acceso solo a administradores:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo administradores pueden acceder
    match /{document=**} {
      allow read, write: if isAdmin();
    }
    
    function isAdmin() {
      return exists(/databases/$(database)/documents/admin_users/$(request.auth.uid))
        && get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
    }
  }
}
```

### 3. Configuración de PayPal

1. **Crear App en PayPal Developer**:
   - Ve a [PayPal Developer](https://developer.paypal.com/)
   - Crea una nueva aplicación
   - Obtén el Client ID y Client Secret
   - Configura los webhooks (opcional)

2. **Configurar Webhooks** (Recomendado):
   - URL del webhook: `https://tu-dominio.com/api/webhooks/paypal`
   - Eventos a suscribir:
     - `BILLING.SUBSCRIPTION.ACTIVATED`
     - `BILLING.SUBSCRIPTION.CANCELLED`
     - `BILLING.SUBSCRIPTION.SUSPENDED`
     - `PAYMENT.SALE.COMPLETED`
     - `PAYMENT.SALE.DENIED`

## 🔧 Funcionalidades Principales

### 📊 Dashboard Principal
- **Métricas en tiempo real**: Total de cuentas, suscripciones activas, trials, ingresos
- **Alertas del sistema**: Notificaciones sobre cuentas con problemas
- **Gráficos de crecimiento**: Evolución mensual de métricas clave

### 🏢 Gestión de Cuentas
- **Lista completa de cuentas** con filtros avanzados
- **Estados de suscripción** en tiempo real
- **Información detallada** de cada cuenta
- **Acciones rápidas**: Ver, editar, suspender cuentas

### 💳 Gestión de Suscripciones PayPal
- **Monitor de suscripciones** activas y problemáticas
- **Gestión de pagos fallidos**: Reintentar, suspender, cancelar
- **Historial de transacciones** por suscripción
- **Alertas automáticas** para problemas de pago

### 💰 Gestión de Planes y Precios
- **Sincronización automática** entre PayPal y sistema local
- **Editor de precios** con validación
- **Mapeo de planes** PayPal ↔ Local
- **Historial de cambios** de precios

## 🔄 Sincronización de Precios

### Problema: Precios en Múltiples Lugares

Los precios de los planes están configurados en:
1. **PayPal**: Como planes de suscripción
2. **Proyecto Principal**: Archivo de configuración local
3. **Dashboard Admin**: Base de datos de precios

### Solución: Sistema de Sincronización Automática

#### ✨ **NUEVA FUNCIONALIDAD**: Mapeo Automático de Planes

El sistema ahora **mapea automáticamente** los planes locales con PayPal usando las variables de entorno:

```typescript
// ✅ AUTOMÁTICO - Ya configurado
// Los planes se mapean automáticamente al iniciar la aplicación
// usando las variables de entorno VITE_PAYPAL_PLAN_*

// Ejemplo de uso en el código:
import { configUtils } from '@/lib/config'

// Obtener PayPal Plan ID automáticamente
const paypalPlanId = configUtils.getPayPalPlanId('personal-basic-monthly')
// Resultado: P-XXXXXXXXXXXXXXXXX (tu ID real de PayPal)
```

#### Opción 1: Sincronización Automática desde PayPal (Recomendada)
```typescript
// Usar el servicio de sincronización
import { pricingSyncService } from '@/lib/pricing-sync'

// Sincronizar desde PayPal (ya incluye mapeo automático)
const result = await pricingSyncService.syncFromPayPal()
if (result.success) {
  // Aplicar diferencias encontradas
  await pricingSyncService.applyDifferences(result.differences)
}
```

#### Opción 2: Copia Manual del Archivo de Precios
1. Copia el archivo de precios del proyecto principal
2. Colócalo en `src/config/pricing.ts`
3. Actualiza el store de planes:
```typescript
import { pricingConfig } from '@/config/pricing'
import { usePlansStore } from '@/stores/plans-store'

// Actualizar precios desde archivo
usePlansStore.getState().setPlans(pricingConfig.plans)
```

#### Opción 3: Sincronización Bidireccional
- **PayPal → Local**: Para precios actualizados en PayPal
- **Local → PayPal**: Para nuevos planes creados localmente
- **Validación automática**: Detecta inconsistencias

### ✅ Mapeo Automático de Planes

**¡YA NO NECESITAS CONFIGURAR MAPEOS MANUALMENTE!**

El sistema usa las variables de entorno para mapear automáticamente:

| Plan Local | Variable de Entorno | PayPal Plan ID |
|------------|---------------------|----------------|
| `personal-basic-monthly` | `VITE_PAYPAL_PLAN_PERSONAL_BASIC_MONTHLY` | Tu ID real |
| `clinic-pro-annual` | `VITE_PAYPAL_PLAN_CLINIC_PRO_ANNUAL` | Tu ID real |
| `hospital-enterprise-monthly` | `VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_MONTHLY` | Tu ID real |

#### Verificación del Mapeo:
```typescript
import { configUtils } from '@/lib/config'

// Verificar que todos los planes estén mapeados
configUtils.validatePlanMapping() // ✅ o ❌ con detalles del error
```

## 🛠️ Gestión de Problemas de Pago

### Identificación Automática
El sistema identifica automáticamente suscripciones con problemas:
- **Pagos fallidos** (failed_payments_count > 0)
- **Saldo pendiente** (outstanding_balance > 0)
- **Estado suspendido** (status = SUSPENDED)

### Acciones Disponibles
1. **Reintentar Pago**: Fuerza un nuevo intento de cobro
2. **Suspender Suscripción**: Pausa temporalmente el servicio
3. **Cancelar Suscripción**: Termina definitivamente la suscripción
4. **Cambiar Plan**: Migra a un plan diferente

### Flujo Recomendado para Problemas
1. **Identificar** la suscripción problemática
2. **Contactar** al cliente (fuera del sistema)
3. **Intentar solución**:
   - Reintentar pago si es problema temporal
   - Cambiar método de pago (requiere acción del cliente)
   - Cambiar a plan más barato si es problema económico
4. **Suspender** si no se resuelve en 7 días
5. **Cancelar** si no se resuelve en 30 días

## 📈 Métricas y Reportes

### Métricas Disponibles
- **Cuentas**: Total, activas, trials, canceladas
- **Ingresos**: Mensuales, anuales, por plan
- **Actividad**: Nuevos pacientes, citas, prescripciones
- **Rendimiento**: Uptime del sistema, errores

### Exportación de Datos
- **Formato CSV/Excel**: Para análisis externo
- **Reportes PDF**: Para presentaciones
- **API endpoints**: Para integraciones

## 🔐 Seguridad y Permisos

### Roles de Usuario
- **Super Admin**: Acceso completo, gestión de otros admins
- **Admin**: Gestión de cuentas y suscripciones
- **Support**: Solo lectura y acciones básicas de soporte

### Permisos Granulares
```typescript
const permissions = [
  'accounts.read',      // Ver cuentas
  'accounts.write',     // Crear/editar cuentas
  'accounts.delete',    // Eliminar cuentas
  'subscriptions.read', // Ver suscripciones
  'subscriptions.manage', // Gestionar suscripciones
  'plans.read',         // Ver planes
  'plans.edit',         // Editar precios de planes
  'metrics.view',       // Ver métricas
  'users.manage'        // Gestionar usuarios admin
]
```

### Auditoría
Todas las acciones administrativas se registran automáticamente:
- **Quién** realizó la acción
- **Qué** acción se realizó
- **Cuándo** se realizó
- **Detalles** adicionales (IDs, valores anteriores/nuevos)

## 🚀 Despliegue

### Desarrollo
```bash
pnpm install
pnpm run dev
```

### Producción
```bash
pnpm run build
pnpm run preview
```

### Variables de Producción
Asegúrate de configurar todas las variables de entorno en tu plataforma de hosting:
- Vercel: En el dashboard del proyecto
- Netlify: En Site settings > Environment variables
- AWS/Azure: En la configuración del servicio

## 📞 Soporte

### Logs y Debugging
- Los errores se registran en la consola del navegador
- Los logs de PayPal se muestran en la pestaña Network
- Los errores de Firebase aparecen en la consola de Firebase

### Problemas Comunes
1. **Error de autenticación PayPal**: Verificar credenciales y permisos
2. **Datos no sincronizados**: Ejecutar sincronización manual
3. **Permisos insuficientes**: Verificar rol de usuario en Firestore
4. **Webhooks no funcionan**: Verificar URL y certificados SSL

### Contacto
Para soporte técnico, contacta al equipo de desarrollo de IxiClinic.

---

## 🔄 Actualización del Sistema

Para mantener el dashboard actualizado:
1. Revisar releases en GitHub
2. Actualizar dependencias: `pnpm update`
3. Probar en desarrollo antes de desplegar
4. Hacer backup de la configuración antes de actualizaciones mayores
