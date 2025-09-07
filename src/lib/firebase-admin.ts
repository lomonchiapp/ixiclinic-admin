import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/firebase';
import type { 
  Account, 
  AccountSummary, 
  AdminMetrics, 
  SystemAlert,
  Patient,
  User,
  Appointment,
  SubscriptionStatus 
} from 'ixiclinic-types/dist/admin-exports';
import { UserRole } from 'ixiclinic-types/dist/enums';

export class FirebaseAdminService {
  
  // ===== Métodos para Cuentas =====
  
  async getAllAccounts(): Promise<Account[]> {
    try {
      const accountsRef = collection(db, 'accounts');
      const q = query(accountsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Account));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw new Error('Error al obtener las cuentas');
    }
  }

  async getAccountById(accountId: string): Promise<Account | null> {
    try {
      const accountRef = doc(db, 'accounts', accountId);
      const accountSnap = await getDoc(accountRef);
      
      if (accountSnap.exists()) {
        return {
          id: accountSnap.id,
          ...accountSnap.data()
        } as Account;
      }
      return null;
    } catch (error) {
      console.error('Error fetching account:', error);
      throw new Error('Error al obtener la cuenta');
    }
  }

  async getAccountsByStatus(status: SubscriptionStatus): Promise<Account[]> {
    try {
      const accountsRef = collection(db, 'accounts');
      const q = query(
        accountsRef, 
        where('billingInfo.subscriptionStatus', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Account));
    } catch (error) {
      console.error('Error fetching accounts by status:', error);
      throw new Error('Error al obtener las cuentas por estado');
    }
  }

  async getTrialAccounts(): Promise<Account[]> {
    return this.getAccountsByStatus('trial' as SubscriptionStatus);
  }

  async getActiveAccounts(): Promise<Account[]> {
    return this.getAccountsByStatus('active' as SubscriptionStatus);
  }

  // ===== Métodos para Usuarios =====
  
  async getUsersByAccount(accountId: string): Promise<User[]> {
    try {
      // Primero intentar obtener de la subcolección (estructura nueva)
      const usersSubRef = collection(db, `accounts/${accountId}/users`);
      const subQuery = query(usersSubRef, orderBy('createdAt', 'desc'));
      const subQuerySnapshot = await getDocs(subQuery);
      
      if (subQuerySnapshot.docs.length > 0) {
        console.log(`📁 Encontrados ${subQuerySnapshot.docs.length} usuarios en subcolección para cuenta ${accountId}`);
        return subQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
      }
      
      // Si no hay datos en subcolección, buscar en colección global (estructura anterior)
      const usersGlobalRef = collection(db, 'users');
      const globalQuery = query(
        usersGlobalRef, 
        where('accountId', '==', accountId),
        orderBy('createdAt', 'desc')
      );
      const globalQuerySnapshot = await getDocs(globalQuery);
      
      console.log(`🌐 Encontrados ${globalQuerySnapshot.docs.length} usuarios en colección global para cuenta ${accountId}`);
      
      return globalQuerySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      
    } catch (error) {
      console.error('Error fetching users by account:', error);
      throw new Error('Error al obtener los usuarios de la cuenta');
    }
  }

  // ===== Métodos para Pacientes =====
  
  async getPatientsByAccount(accountId: string): Promise<Patient[]> {
    try {
      // Primero intentar obtener de la subcolección (estructura nueva)
      const patientsSubRef = collection(db, `accounts/${accountId}/patients`);
      const subQuery = query(patientsSubRef, orderBy('createdAt', 'desc'));
      const subQuerySnapshot = await getDocs(subQuery);
      
      if (subQuerySnapshot.docs.length > 0) {
        console.log(`📁 Encontrados ${subQuerySnapshot.docs.length} pacientes en subcolección para cuenta ${accountId}`);
        return subQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Patient));
      }
      
      // Si no hay datos en subcolección, buscar en colección global (estructura anterior)
      const patientsGlobalRef = collection(db, 'patients');
      const globalQuery = query(
        patientsGlobalRef, 
        where('accountId', '==', accountId),
        orderBy('createdAt', 'desc')
      );
      const globalQuerySnapshot = await getDocs(globalQuery);
      
      console.log(`🌐 Encontrados ${globalQuerySnapshot.docs.length} pacientes en colección global para cuenta ${accountId}`);
      
      return globalQuerySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient));
      
    } catch (error) {
      console.error('Error fetching patients by account:', error);
      throw new Error('Error al obtener los pacientes de la cuenta');
    }
  }

  async getTotalPatients(): Promise<number> {
    try {
      const accounts = await this.getAllAccounts();
      let totalPatients = 0;
      
      for (const account of accounts) {
        const patients = await this.getPatientsByAccount(account.id);
        totalPatients += patients.length;
      }
      
      return totalPatients;
    } catch (error) {
      console.error('Error getting total patients:', error);
      return 0;
    }
  }

  // ===== Métodos para Citas =====
  
  async getAppointmentsByAccount(accountId: string): Promise<Appointment[]> {
    try {
      // Primero intentar obtener de la subcolección (estructura nueva)
      const appointmentsSubRef = collection(db, `accounts/${accountId}/appointments`);
      const subQuery = query(appointmentsSubRef, orderBy('date', 'desc'), limit(100));
      const subQuerySnapshot = await getDocs(subQuery);
      
      if (subQuerySnapshot.docs.length > 0) {
        console.log(`📁 Encontradas ${subQuerySnapshot.docs.length} citas en subcolección para cuenta ${accountId}`);
        return subQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Appointment));
      }
      
      // Si no hay datos en subcolección, buscar en colección global (estructura anterior)
      const appointmentsGlobalRef = collection(db, 'appointments');
      const globalQuery = query(
        appointmentsGlobalRef, 
        where('accountId', '==', accountId),
        orderBy('date', 'desc'),
        limit(100)
      );
      const globalQuerySnapshot = await getDocs(globalQuery);
      
      console.log(`🌐 Encontradas ${globalQuerySnapshot.docs.length} citas en colección global para cuenta ${accountId}`);
      
      return globalQuerySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
      
    } catch (error) {
      console.error('Error fetching appointments by account:', error);
      throw new Error('Error al obtener las citas de la cuenta');
    }
  }

  // ===== Métodos para Métricas Administrativas =====
  
  async getAdminMetrics(): Promise<AdminMetrics> {
    try {
      const accounts = await this.getAllAccounts();
      const activeAccounts = accounts.filter(acc => 
        acc.billingInfo?.subscriptionStatus === 'active'
      );
      const trialAccounts = accounts.filter(acc => 
        acc.billingInfo?.subscriptionStatus === 'trial'
      );
      
      const totalPatients = await this.getTotalPatients();
      
      return {
        totalAccounts: accounts.length,
        activeSubscriptions: activeAccounts.length,
        trialAccounts: trialAccounts.length,
        monthlyRevenue: 0, // Calcular basado en los planes activos
        totalPatients,
        totalAppointments: 0, // Calcular sumando todas las citas
        totalInvoices: 0, // Calcular sumando todas las facturas
        totalPrescriptions: 0, // Calcular sumando todas las prescripciones
        systemHealth: 'healthy'
      };
    } catch (error) {
      console.error('Error getting admin metrics:', error);
      throw new Error('Error al obtener las métricas administrativas');
    }
  }

  async getAccountSummary(accountId: string): Promise<AccountSummary | null> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account) return null;
      
      const patients = await this.getPatientsByAccount(accountId);
      const users = await this.getUsersByAccount(accountId);
      const appointments = await this.getAppointmentsByAccount(accountId);
      
      return {
        account,
        stats: {
          totalPatients: patients.length,
          totalAppointments: appointments.length,
          totalRevenue: 0, // Calcular basado en las facturas
          lastActivity: new Date(), // Calcular basado en la última actividad
          storageUsed: 0, // Calcular basado en el almacenamiento usado
          planUsage: {
            patients: {
              used: patients.length,
              limit: account.billingInfo?.plan?.limits.patients || 0
            },
            users: {
              used: users.length,
              limit: account.billingInfo?.plan?.limits.users || 0
            },
            storage: {
              used: 0, // Calcular
              limit: account.billingInfo?.plan?.limits.storage || 0
            }
          }
        }
      };
    } catch (error) {
      console.error('Error getting account summary:', error);
      throw new Error('Error al obtener el resumen de la cuenta');
    }
  }

  // ===== Métodos para Alertas del Sistema =====
  
  async getSystemAlerts(): Promise<SystemAlert[]> {
    try {
      const alertsRef = collection(db, 'system_alerts');
      const q = query(
        alertsRef, 
        where('resolved', '==', false),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SystemAlert));
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      return [];
    }
  }

  // ===== Métodos CRUD Generales =====
  
  async createAccount(accountData: Partial<Account>): Promise<string> {
    try {
      const accountsRef = collection(db, 'accounts');
      const docRef = await addDoc(accountsRef, {
        ...accountData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isActive: true
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating account:', error);
      throw new Error('Error al crear la cuenta');
    }
  }

  async updateAccount(accountId: string, updates: Partial<Account>): Promise<void> {
    try {
      const accountRef = doc(db, 'accounts', accountId);
      await updateDoc(accountRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating account:', error);
      throw new Error('Error al actualizar la cuenta');
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    try {
      const accountRef = doc(db, 'accounts', accountId);
      await deleteDoc(accountRef);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error('Error al eliminar la cuenta');
    }
  }

  // ===== MEMBERSHIP MANAGEMENT =====
  async assignFreeMembership(accountId: string, planName: string, durationDays: number, reason: string): Promise<void> {
    try {
      const accountRef = doc(db, 'accounts', accountId)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + durationDays)

      await updateDoc(accountRef, {
        'billingInfo.subscriptionStatus': 'active',
        'billingInfo.membershipType': 'free',
        'billingInfo.plan.name': planName,
        'billingInfo.nextPaymentDate': null,
        'billingInfo.trialEndDate': endDate,
        'billingInfo.adminNotes': `Membresía gratuita asignada: ${reason}`,
        'updatedAt': new Date()
      })

      // Registrar acción administrativa
      await this.logAdminAction({
        action: 'assign_free_membership',
        accountId,
        details: { planName, durationDays, reason },
        timestamp: new Date()
      })

    } catch (error) {
      console.error('Error assigning free membership:', error)
      throw error
    }
  }

  async extendTrial(accountId: string, extensionDays: number, reason: string): Promise<void> {
    try {
      const accountRef = doc(db, 'accounts', accountId)
      const accountDoc = await getDoc(accountRef)
      
      if (!accountDoc.exists()) {
        throw new Error('Account not found')
      }

      const accountData = accountDoc.data() as Account
      const currentEndDate = accountData.billingInfo?.trialEndDate?.toDate?.() || new Date()
      const newEndDate = new Date(currentEndDate)
      newEndDate.setDate(newEndDate.getDate() + extensionDays)

      await updateDoc(accountRef, {
        'billingInfo.trialEndDate': newEndDate,
        'billingInfo.adminNotes': `Trial extendido ${extensionDays} días: ${reason}`,
        'updatedAt': new Date()
      })

      // Registrar acción administrativa
      await this.logAdminAction({
        action: 'extend_trial',
        accountId,
        details: { extensionDays, reason, newEndDate },
        timestamp: new Date()
      })

    } catch (error) {
      console.error('Error extending trial:', error)
      throw error
    }
  }

  async extendMembership(accountId: string, extensionDays: number, reason: string): Promise<void> {
    try {
      const accountRef = doc(db, 'accounts', accountId)
      const accountDoc = await getDoc(accountRef)
      
      if (!accountDoc.exists()) {
        throw new Error('Account not found')
      }

      const accountData = accountDoc.data() as Account
      const currentEndDate = accountData.billingInfo?.nextPaymentDate?.toDate?.() || new Date()
      const newEndDate = new Date(currentEndDate)
      newEndDate.setDate(newEndDate.getDate() + extensionDays)

      await updateDoc(accountRef, {
        'billingInfo.nextPaymentDate': newEndDate,
        'billingInfo.adminNotes': `Membresía extendida ${extensionDays} días: ${reason}`,
        'updatedAt': new Date()
      })

      // Registrar acción administrativa
      await this.logAdminAction({
        action: 'extend_membership',
        accountId,
        details: { extensionDays, reason, newEndDate },
        timestamp: new Date()
      })

    } catch (error) {
      console.error('Error extending membership:', error)
      throw error
    }
  }

  async changePlan(accountId: string, newPlanName: string, reason: string): Promise<void> {
    try {
      const accountRef = doc(db, 'accounts', accountId)
      
      await updateDoc(accountRef, {
        'billingInfo.plan.name': newPlanName,
        'billingInfo.adminNotes': `Plan cambiado a ${newPlanName}: ${reason}`,
        'updatedAt': new Date()
      })

      // Registrar acción administrativa
      await this.logAdminAction({
        action: 'change_plan',
        accountId,
        details: { newPlanName, reason },
        timestamp: new Date()
      })

    } catch (error) {
      console.error('Error changing plan:', error)
      throw error
    }
  }

  // ===== FIREBASE AUTH MANAGEMENT =====
  async assignFirebaseAuth(accountId: string, firebaseEmail: string): Promise<void> {
    try {
      // Primero verificar que el email de Firebase Auth existe
      // En un entorno real, aquí verificarías con Firebase Auth Admin SDK
      
      const accountRef = doc(db, 'accounts', accountId)
      await updateDoc(accountRef, {
        'ownerId': firebaseEmail, // En la implementación real, usarías el UID
        'firebaseAuthEmail': firebaseEmail,
        'updatedAt': new Date()
      })

      // Registrar acción administrativa
      await this.logAdminAction({
        action: 'assign_firebase_auth',
        accountId,
        details: { firebaseEmail },
        timestamp: new Date()
      })

    } catch (error) {
      console.error('Error assigning Firebase Auth:', error)
      throw error
    }
  }

  async unassignFirebaseAuth(accountId: string, reason: string): Promise<void> {
    try {
      const accountRef = doc(db, 'accounts', accountId)
      await updateDoc(accountRef, {
        'ownerId': null,
        'firebaseAuthEmail': null,
        'adminNotes': `Firebase Auth desasignado: ${reason}`,
        'updatedAt': new Date()
      })

      // Registrar acción administrativa
      await this.logAdminAction({
        action: 'unassign_firebase_auth',
        accountId,
        details: { reason },
        timestamp: new Date()
      })

    } catch (error) {
      console.error('Error unassigning Firebase Auth:', error)
      throw error
    }
  }

  // ===== ADMIN ACTIONS LOG =====
  private async logAdminAction(action: {
    action: string
    accountId: string
    details: any
    timestamp: Date
  }): Promise<void> {
    try {
      const actionsRef = collection(db, 'admin_actions')
      await addDoc(actionsRef, {
        ...action,
        adminId: 'current_admin', // En la implementación real, obtener del contexto
        createdAt: new Date()
      })
    } catch (error) {
      console.error('Error logging admin action:', error)
      // No lanzar error para no interrumpir la acción principal
    }
  }

  async getAdminActionsByAccount(accountId: string): Promise<any[]> {
    try {
      const actionsRef = collection(db, 'admin_actions')
      const q = query(actionsRef, where('accountId', '==', accountId), orderBy('timestamp', 'desc'))
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching admin actions:', error)
      return []
    }
  }

  // ===== ACCOUNT CREATION WITH FULL SETUP =====
  async createAccountWithSetup(accountData: any, options: {
    assignFirebaseAuth?: boolean
    firebaseEmail?: string
    createInitialUser?: boolean
    initialUserData?: any
  }): Promise<string> {
    try {
      // Crear la cuenta principal
      const accountId = await this.createAccount(accountData)

      // Asignar Firebase Auth si se especificó
      if (options.assignFirebaseAuth && options.firebaseEmail) {
        await this.assignFirebaseAuth(accountId, options.firebaseEmail)
      }

      // Crear usuario inicial si se especificó
      if (options.createInitialUser && options.initialUserData) {
        const usersRef = collection(db, 'users')
        await addDoc(usersRef, {
          ...options.initialUserData,
          accountId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }

      return accountId
    } catch (error) {
      console.error('Error creating account with setup:', error)
      throw error
    }
  }

  // ===== BULK DATA LOADING FOR ADMIN PANEL =====
  /**
   * Cargar todos los datos del sistema de manera optimizada para el panel administrativo
   */
  async loadAllSystemData(): Promise<{
    accounts: Account[]
    patients: Patient[]
    users: User[]
    appointments: Appointment[]
    totalStats: {
      totalAccounts: number
      totalPatients: number
      totalUsers: number
      totalAppointments: number
      activeAccounts: number
      inactiveAccounts: number
    }
  }> {
    try {
      console.log('🔄 Cargando todos los datos del sistema...')
      
      // Cargar todos los datos en paralelo para máxima eficiencia
      const [
        accountsSnapshot,
        patientsSnapshot,
        usersSnapshot,
        appointmentsSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'accounts')),
        getDocs(collection(db, 'patients')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'appointments'))
      ])

      // Procesar cuentas
      const accounts: Account[] = accountsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Account))

      // Procesar pacientes
      const patients: Patient[] = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient))

      // Procesar usuarios
      const users: User[] = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User))

      // Procesar citas
      const appointments: Appointment[] = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment))

      // Calcular estadísticas
      const activeAccounts = accounts.filter(a => a.isActive).length
      const inactiveAccounts = accounts.length - activeAccounts

      const totalStats = {
        totalAccounts: accounts.length,
        totalPatients: patients.length,
        totalUsers: users.length,
        totalAppointments: appointments.length,
        activeAccounts,
        inactiveAccounts
      }

      console.log(`✅ Datos cargados: ${accounts.length} cuentas, ${patients.length} pacientes, ${users.length} usuarios, ${appointments.length} citas`)

      return {
        accounts,
        patients,
        users,
        appointments,
        totalStats
      }
    } catch (error) {
      console.error('Error cargando datos del sistema:', error)
      throw error
    }
  }

  /**
   * Obtener todos los pacientes de todas las cuentas con información de cuenta
   */
  async getAllPatientsWithAccountInfo(): Promise<(Patient & { accountInfo?: Account })[]> {
    try {
      const [patientsSnapshot, accountsSnapshot] = await Promise.all([
        getDocs(collection(db, 'patients')),
        getDocs(collection(db, 'accounts'))
      ])

      const accounts = new Map<string, Account>()
      accountsSnapshot.docs.forEach(doc => {
        accounts.set(doc.id, { id: doc.id, ...doc.data() } as Account)
      })

      const patients: (Patient & { accountInfo?: Account })[] = patientsSnapshot.docs.map(doc => {
        const patient = { id: doc.id, ...doc.data() } as Patient
        return {
          ...patient,
          accountInfo: accounts.get(patient.accountId)
        }
      })

      return patients
    } catch (error) {
      console.error('Error obteniendo pacientes con info de cuenta:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas rápidas del sistema
   */
  async getSystemQuickStats(): Promise<{
    accounts: { total: number, active: number, inactive: number }
    patients: { total: number, thisMonth: number }
    users: { total: number, doctors: number, staff: number }
    appointments: { total: number, today: number, thisWeek: number }
  }> {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      const [
        accountsSnapshot,
        patientsSnapshot,
        patientsThisMonthSnapshot,
        usersSnapshot,
        appointmentsSnapshot,
        appointmentsTodaySnapshot,
        appointmentsThisWeekSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'accounts')),
        getDocs(collection(db, 'patients')),
        getDocs(query(collection(db, 'patients'), where('createdAt', '>=', startOfMonth))),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'appointments')),
        getDocs(query(collection(db, 'appointments'), where('date', '>=', startOfDay))),
        getDocs(query(collection(db, 'appointments'), where('date', '>=', startOfWeek)))
      ])

      const accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account))
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User))

      return {
        accounts: {
          total: accounts.length,
          active: accounts.filter(a => a.isActive).length,
          inactive: accounts.filter(a => !a.isActive).length
        },
        patients: {
          total: patientsSnapshot.size,
          thisMonth: patientsThisMonthSnapshot.size
        },
        users: {
          total: users.length,
          doctors: users.filter(u => u.role === UserRole.DOCTOR).length,
          staff: users.filter(u => u.role !== UserRole.DOCTOR).length
        },
        appointments: {
          total: appointmentsSnapshot.size,
          today: appointmentsTodaySnapshot.size,
          thisWeek: appointmentsThisWeekSnapshot.size
        }
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas rápidas:', error)
      throw error
    }
  }

  // ===== ACCOUNT DELETION =====
  /**
   * Eliminar cuenta completamente con todos sus datos relacionados
   */
  async deleteAccountCompletely(accountId: string, _adminId: string = 'system'): Promise<boolean> {
    try {
      console.log(`🗑️ Iniciando eliminación completa de cuenta: ${accountId}`)

      // 1. Obtener la cuenta para obtener el ownerId (Firebase Auth UID)
      const account = await this.getAccountById(accountId)
      if (!account) {
        throw new Error('Cuenta no encontrada')
      }

      const batch = writeBatch(db)
      let deletedItems = 0

      // 2. Eliminar pacientes de la cuenta
      const patientsQuery = query(
        collection(db, 'patients'),
        where('accountId', '==', accountId)
      )
      const patientsSnapshot = await getDocs(patientsQuery)
      
      console.log(`👥 Eliminando ${patientsSnapshot.size} pacientes...`)
      patientsSnapshot.forEach((doc) => {
        batch.delete(doc.ref)
        deletedItems++
      })

      // 3. Eliminar citas de la cuenta
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('accountId', '==', accountId)
      )
      const appointmentsSnapshot = await getDocs(appointmentsQuery)
      
      console.log(`📅 Eliminando ${appointmentsSnapshot.size} citas...`)
      appointmentsSnapshot.forEach((doc) => {
        batch.delete(doc.ref)
        deletedItems++
      })

      // 4. Eliminar usuarios de la cuenta
      const usersQuery = query(
        collection(db, 'users'),
        where('accountId', '==', accountId)
      )
      const usersSnapshot = await getDocs(usersQuery)
      
      console.log(`👤 Eliminando ${usersSnapshot.size} usuarios...`)
      usersSnapshot.forEach((doc) => {
        batch.delete(doc.ref)
        deletedItems++
      })

      // 5. Eliminar facturas de la cuenta
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('accountId', '==', accountId)
      )
      const invoicesSnapshot = await getDocs(invoicesQuery)
      
      console.log(`🧾 Eliminando ${invoicesSnapshot.size} facturas...`)
      invoicesSnapshot.forEach((doc) => {
        batch.delete(doc.ref)
        deletedItems++
      })

      // 6. Eliminar archivos/documentos de la cuenta
      const filesQuery = query(
        collection(db, 'files'),
        where('accountId', '==', accountId)
      )
      const filesSnapshot = await getDocs(filesQuery)
      
      console.log(`📁 Eliminando ${filesSnapshot.size} archivos...`)
      filesSnapshot.forEach((doc) => {
        batch.delete(doc.ref)
        deletedItems++
      })

      // 7. Eliminar la cuenta principal
      const accountRef = doc(db, 'accounts', accountId)
      batch.delete(accountRef)
      deletedItems++

      // 8. Ejecutar todas las eliminaciones en lote
      await batch.commit()
      console.log(`✅ Eliminados ${deletedItems} documentos de Firestore`)

      // 9. Eliminar usuario de Firebase Auth si existe ownerId
      if (account.ownerId) {
        try {
          const { FirebaseAuthService } = await import('./firebase-auth-service')
          const authDeleted = await FirebaseAuthService.deleteUserByUid(account.ownerId)
          if (authDeleted) {
            console.log(`✅ Usuario ${account.ownerId} eliminado de Firebase Auth`)
          }
        } catch (authError) {
          console.warn('Error eliminando usuario de Firebase Auth:', authError)
          // No fallar si no se puede eliminar de Auth
        }
      }

      // 10. Registrar acción administrativa
      await this.logAdminAction({
        action: 'delete_account_complete',
        accountId,
        details: {
          email: account.email,
          deletedItems,
          ownerId: account.ownerId
        },
        timestamp: new Date()
      })

      console.log(`🎉 Cuenta ${accountId} eliminada completamente`)
      return true

    } catch (error) {
      console.error('Error eliminando cuenta completamente:', error)
      throw error
    }
  }
}

// Instancia singleton del servicio
export const firebaseAdminService = new FirebaseAdminService();
