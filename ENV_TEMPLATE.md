# 🔐 Variables de Entorno Requeridas para IxiClinic Admin

## 📂 Archivo: `.env` (o `.env.local`)

Crea este archivo en la raíz del proyecto (`C:\Users\elvio\Desktop\ixiclinic-admin\.env`)

```bash
# ===== FIREBASE CLIENT SDK =====
# Estas son las credenciales del frontend (ya las tienes configuradas)
VITE_FIREBASE_API_KEY=AIzaSyANTeBV1E
VITE_FIREBASE_AUTH_DOMAIN=ixiclinic-f8029.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ixiclinic-f8029
VITE_FIREBASE_STORAGE_BUCKET=ixiclinic-f8029.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=381215944887
VITE_FIREBASE_APP_ID=1:381215944887:web:3640dce85336bacf305d32
VITE_FIREBASE_MEASUREMENT_ID=G-WCEYKSMES3

# ===== FIREBASE ADMIN SDK (Opcional - para verificación real) =====
# Estas son para el backend/servidor. Si no las tienes, el sistema usa simulación
FIREBASE_ADMIN_PROJECT_ID=ixiclinic-f8029
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@ixiclinic-f8029.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----\n"

# ===== PAYPAL CONFIGURATION =====
# Configura estas con tus credenciales reales de PayPal
VITE_PAYPAL_SANDBOX=true
VITE_PAYPAL_CLIENT_ID=tu_paypal_client_id_aqui
VITE_PAYPAL_CLIENT_SECRET_KEY=tu_paypal_client_secret_aqui

# ===== GOOGLE MAPS (Opcional) =====
VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key_aqui

# ===== PAYPAL PLAN IDS =====
# Configura estos con los IDs reales de tus planes en PayPal

# Personal Plans - Basic
VITE_PAYPAL_PLAN_PERSONAL_BASIC_MONTHLY=P-5ML4271244454362WXNWU5NQ
VITE_PAYPAL_PLAN_PERSONAL_BASIC_QUARTERLY=P-1GJ4271244454362WXNWU5NQ
VITE_PAYPAL_PLAN_PERSONAL_BASIC_ANNUAL=P-2AB4271244454362WXNWU5NQ

# Personal Plans - Pro
VITE_PAYPAL_PLAN_PERSONAL_PRO_MONTHLY=P-3CD4271244454362WXNWU5NQ
VITE_PAYPAL_PLAN_PERSONAL_PRO_QUARTERLY=P-4EF4271244454362WXNWU5NQ
VITE_PAYPAL_PLAN_PERSONAL_PRO_ANNUAL=P-5GH4271244454362WXNWU5NQ

# Clinic Plans - Pro
VITE_PAYPAL_PLAN_CLINIC_PRO_MONTHLY=P-6IJ4271244454362WXNWU5NQ
VITE_PAYPAL_PLAN_CLINIC_PRO_QUARTERLY=P-7KL4271244454362WXNWU5NQ
VITE_PAYPAL_PLAN_CLINIC_PRO_ANNUAL=P-8MN4271244454362WXNWU5NQ

# Clinic Plans - Enterprise
VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_MONTHLY=P-9OP4271244454362WXNWU5NQ
VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_QUARTERLY=P-0QR4271244454362WXNWU5NQ
VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_ANNUAL=P-1ST4271244454362WXNWU5NQ

# Hospital Plans - Enterprise
VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_MONTHLY=P-2UV4271244454362WXNWU5NQ
VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_QUARTERLY=P-3WX4271244454362WXNWU5NQ
VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_ANNUAL=P-4YZ4271244454362WXNWU5NQ
```

## 🔧 **Configuraciones Importantes:**

### 1. **Firebase Admin SDK (Para verificación real de usuarios)**
Para obtener estas credenciales:
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto `ixiclinic-f8029`
3. Ve a **Configuración del proyecto** > **Cuentas de servicio**
4. Haz clic en **Generar nueva clave privada**
5. Descarga el archivo JSON y usa sus valores:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

### 2. **PayPal Configuration**
1. Ve a [PayPal Developer](https://developer.paypal.com)
2. Crea una aplicación
3. Obtén el `Client ID` y `Client Secret`
4. Para **sandbox**: `VITE_PAYPAL_SANDBOX=true`
5. Para **producción**: `VITE_PAYPAL_SANDBOX=false`

### 3. **PayPal Plan IDs**
Estos son los IDs reales de tus planes creados en PayPal. Reemplaza los valores de ejemplo con los IDs reales de tus planes.

## ⚠️ **Notas de Seguridad:**

1. **NUNCA** subas el archivo `.env` a Git (ya está en `.gitignore`)
2. Las variables `VITE_*` son **públicas** (visibles en el frontend)
3. Las variables sin `VITE_` son **privadas** (solo servidor)
4. Para producción, usa variables de entorno del servidor hosting

## 🚀 **Modo de Funcionamiento:**

### **Con Firebase Admin configurado:**
- ✅ Verificación real de emails en Firebase Auth
- ✅ Gestión completa de usuarios
- ✅ Operaciones administrativas avanzadas

### **Sin Firebase Admin (modo simulación):**
- ✅ Funcionalidad básica del dashboard
- ✅ Simulación de verificación de emails
- ✅ Todas las funciones UI funcionan
- ⚠️ Sin verificación real de Firebase Auth

### **Con PayPal configurado:**
- ✅ Sincronización real de precios
- ✅ Gestión de suscripciones
- ✅ Métricas de ingresos reales

### **Sin PayPal (modo simulación):**
- ✅ Dashboard funcional
- ✅ Gestión de planes
- ⚠️ Datos simulados para métricas
