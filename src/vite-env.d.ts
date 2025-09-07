/// <reference types="vite/client" />


interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VITE_FIREBASE_APP_ID: string;
    readonly VITE_FIREBASE_MEASUREMENT_ID: string;
    readonly VITE_PAYPAL_SANDBOX: boolean;
    readonly VITE_PAYPAL_CLIENT_ID: string;
    readonly VITE_PAYPAL_CLIENT_SECRET_KEY: string;
    readonly VITE_GOOGLE_MAPS_API_KEY: string;
    readonly VITE_PAYPAL_PLAN_PERSONAL_BASIC_MONTHLY: string;
    readonly VITE_PAYPAL_PLAN_PERSONAL_BASIC_QUARTERLY: string;
    readonly VITE_PAYPAL_PLAN_PERSONAL_BASIC_ANNUAL: string;
    readonly VITE_PAYPAL_PLAN_PERSONAL_PRO_MONTHLY: string;
    readonly VITE_PAYPAL_PLAN_PERSONAL_PRO_QUARTERLY: string;
    readonly VITE_PAYPAL_PLAN_PERSONAL_PRO_ANNUAL: string;
    readonly VITE_PAYPAL_PLAN_CLINIC_PRO_MONTHLY: string;
    readonly VITE_PAYPAL_PLAN_CLINIC_PRO_QUARTERLY: string;
    readonly VITE_PAYPAL_PLAN_CLINIC_PRO_ANNUAL: string;
    readonly VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_MONTHLY: string;
    readonly VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_QUARTERLY: string;
    readonly VITE_PAYPAL_PLAN_CLINIC_ENTERPRISE_ANNUAL: string;
    readonly VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_MONTHLY: string;
    readonly VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_QUARTERLY: string;
    readonly VITE_PAYPAL_PLAN_HOSPITAL_ENTERPRISE_ANNUAL: string;
}

// Variables de entorno del servidor (Node.js)
declare namespace NodeJS {
  interface ProcessEnv {
    readonly FIREBASE_ADMIN_PROJECT_ID?: string;
    readonly FIREBASE_ADMIN_CLIENT_EMAIL?: string;
    readonly FIREBASE_ADMIN_PRIVATE_KEY?: string;
  }
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
