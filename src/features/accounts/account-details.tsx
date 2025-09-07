import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useAccountInfo } from '@/hooks/use-account-info'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import {
  ArrowLeft,
  Building2,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Gift,
  UserPlus,
  Activity,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  HardDrive,
  Stethoscope
} from 'lucide-react'
import { firebaseAdminService } from '@/lib/firebase-admin'
import { usePayPalStore } from '@/stores/paypal-store'
// import { usePlansStore } from '@/stores/plans-store' // No se usa más
import { toast } from 'sonner'
import type { Account, Patient, User, Appointment } from 'ixiclinic-types/dist/admin-exports'
import { PLANS } from 'ixiclinic-types/dist/planConfigs'

interface AccountStats {
  totalPatients: number
  totalUsers: number
  totalAppointments: number
  totalInvoices: number
  totalRevenue: number
  storageUsed: number
  lastActivity: Date | null
}

interface MembershipAction {
  type: 'assign_free' | 'extend_trial' | 'extend_membership' | 'change_plan'
  planId?: string
  duration?: number
  reason: string
}

export function AccountDetails() {
  const { accountId } = useParams({ strict: false })
  const navigate = useNavigate()
  
  // Usar el hook useAccountInfo
  const { 
    data: accountInfo, 
    isLoading: loading, 
    error,
    refetch 
  } = useAccountInfo(accountId as string)
  
  // Estados locales para funcionalidades específicas del componente
  const [activeTab, setActiveTab] = useState('overview')
  
  // Dialogs state
  const [membershipDialog, setMembershipDialog] = useState(false)
  const [firebaseDialog, setFirebaseDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  
  // Forms state
  const [membershipAction, setMembershipAction] = useState<MembershipAction>({
    type: 'assign_free',
    reason: ''
  })
  const [firebaseEmail, setFirebaseEmail] = useState('')
  const [editForm, setEditForm] = useState({
    centerName: '',
    doctorName: '',
    phone: '',
    address: '',
    city: ''
  })

  // const { plans } = usePlansStore() // No se usa más, se usan los planes del paquete
  const { getSubscriptionByAccountId } = usePayPalStore()

  // Extraer datos del hook
  const account = accountInfo?.account
  const patients = accountInfo?.patients || []
  const users = accountInfo?.users || []
  const appointments = accountInfo?.appointments || []
  const stats = accountInfo?.stats

  // Crear accountStats compatible con el formato anterior
  const accountStats: AccountStats | null = stats ? {
    totalPatients: stats.totalPatients,
    totalUsers: stats.totalUsers,
    totalAppointments: stats.totalAppointments,
    totalInvoices: 0, // TODO: implementar cuando tengamos invoices
    totalRevenue: 0, // TODO: implementar cuando tengamos revenue data
    storageUsed: Math.random() * 1000, // TODO: implementar storage real
    lastActivity: appointments.length > 0 
      ? new Date(Math.max(...appointments.map(a => new Date(a.createdAt || 0).getTime())))
      : null
  } : null

  useEffect(() => {
    // Redirigir si no se encuentra la cuenta
    if (!loading && !account && accountId) {
      navigate({ to: '/accounts' })
      return
    }
  }, [account, loading, navigate, accountId])

  useEffect(() => {
    // Cargar datos de PayPal si la cuenta tiene subscripción
    if (account?.subscription?.paypalSubscriptionId) {
      // fetchSubscriptions(account.subscription.paypalSubscriptionId)
    }
  }, [account?.subscription?.paypalSubscriptionId])

  // Manejo de errores del hook
  useEffect(() => {
    if (error) {
      console.error('Error loading account data:', error)
      toast.error('Error al cargar los datos de la cuenta')
    }
  }, [error])

  // Inicializar formulario de edición cuando se carga la cuenta
  useEffect(() => {
    if (account) {
      setEditForm({
        centerName: account.settings?.centerName || '',
        doctorName: account.settings?.doctorName || '',
        phone: account.settings?.phone || '',
        address: account.settings?.address || '',
        city: account.settings?.city || ''
      })
    }
  }, [account])

  const handleMembershipAction = async () => {
    if (!account || !membershipAction.reason.trim()) return

    try {
      // Implementar la lógica para cada tipo de acción
      switch (membershipAction.type) {
        case 'assign_free':
          if (membershipAction.planId) {
            await firebaseAdminService.assignFreeMembership(
              account.id,
              membershipAction.planId,
              membershipAction.duration || 90,
              membershipAction.reason
            )
          }
          break
        case 'extend_trial':
          await firebaseAdminService.extendTrial(
            account.id,
            membershipAction.duration || 30,
            membershipAction.reason
          )
          break
        case 'extend_membership':
          await firebaseAdminService.extendMembership(
            account.id,
            membershipAction.duration || 30,
            membershipAction.reason
          )
          break
        case 'change_plan':
          if (membershipAction.planId) {
            await firebaseAdminService.changePlan(
              account.id,
              membershipAction.planId,
              membershipAction.reason
            )
          }
          break
      }

      // Recargar datos
      refetch()
      setMembershipDialog(false)
      setMembershipAction({ type: 'assign_free', reason: '' })
      toast.success('Acción de membresía aplicada exitosamente')
    } catch (error) {
      console.error('Error performing membership action:', error)
      toast.error('Error al aplicar la acción de membresía')
    }
  }

  const handleFirebaseAssignment = async () => {
    if (!account || !firebaseEmail.trim()) return

    try {
      // Implementar asignación de Firebase Auth
      await firebaseAdminService.assignFirebaseAuth(account.id, firebaseEmail)
      
      refetch()
      setFirebaseDialog(false)
      setFirebaseEmail('')
      toast.success('Firebase Auth asignado exitosamente')
    } catch (error) {
      console.error('Error assigning Firebase Auth:', error)
      toast.error('Error al asignar Firebase Auth')
    }
  }

  const handleAccountUpdate = async () => {
    if (!account) return

    try {
      const updates = {
        settings: {
          ...account.settings,
          centerName: editForm.centerName,
          doctorName: editForm.doctorName,
          phone: editForm.phone,
          address: editForm.address,
          city: editForm.city
        }
      }

      await firebaseAdminService.updateAccount(account.id, updates)
      refetch()
      setEditDialog(false)
    } catch (error) {
      console.error('Error updating account:', error)
    }
  }

  const getSubscriptionStatus = () => {
    if (!account) return null
    const subscription = getSubscriptionByAccountId(account.id)
    return subscription?.status || account.billingInfo?.subscriptionStatus
  }

  const getPlanUsage = (used: number, limit: number) => {
    if (limit === -1) return { percentage: 0, status: 'unlimited' }
    const percentage = (used / limit) * 100
    return {
      percentage,
      status: percentage > 90 ? 'critical' : percentage > 75 ? 'warning' : 'normal'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: account?.settings?.currency?.code || 'USD'
    }).format(amount)
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    try {
      const d = date.toDate ? date.toDate() : new Date(date)
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'N/A'
    }
  }

  if (loading) {
    return (
      <>
        <Header>
          <TopNav links={topNav} />
          <div className='ms-auto flex items-center space-x-4'>
            <Search />
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className='flex items-center justify-center py-8'>
            <div className='text-muted-foreground'>Cargando detalles de la cuenta...</div>
          </div>
        </Main>
      </>
    )
  }

  if (!account) {
    return (
      <>
        <Header>
          <TopNav links={topNav} />
          <div className='ms-auto flex items-center space-x-4'>
            <Search />
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className='flex items-center justify-center py-8'>
            <div className='text-muted-foreground'>Cuenta no encontrada</div>
          </div>
        </Main>
      </>
    )
  }

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        {/* Header de la cuenta */}
        <div className='mb-6 flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/accounts' })}
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Volver a Cuentas
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                {account.settings?.centerName || account.settings?.doctorName || 'Cuenta Sin Nombre'}
              </h1>
              <p className='text-muted-foreground'>
                ID: {account.id} • {account.email}
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Dialog open={editDialog} onOpenChange={setEditDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className='mr-2 h-4 w-4' />
                  Editar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Cuenta</DialogTitle>
                  <DialogDescription>
                    Actualiza la información básica de la cuenta
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="centerName">Nombre del Centro</Label>
                    <Input
                      id="centerName"
                      value={editForm.centerName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, centerName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctorName">Nombre del Doctor</Label>
                    <Input
                      id="doctorName"
                      value={editForm.doctorName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, doctorName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={editForm.address}
                      onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={editForm.city}
                      onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAccountUpdate}>
                    Guardar Cambios
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={membershipDialog} onOpenChange={setMembershipDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Gift className='mr-2 h-4 w-4' />
                  Gestionar Membresía
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gestión de Membresía</DialogTitle>
                  <DialogDescription>
                    Asigna, extiende o modifica la membresía de esta cuenta
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="actionType">Tipo de Acción</Label>
                    <Select 
                      value={membershipAction.type} 
                      onValueChange={(value) => setMembershipAction(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assign_free">Asignar Membresía Gratuita</SelectItem>
                        <SelectItem value="extend_trial">Extender Trial</SelectItem>
                        <SelectItem value="extend_membership">Extender Membresía</SelectItem>
                        <SelectItem value="change_plan">Cambiar Plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {membershipAction.type === 'change_plan' && (
                    <div>
                      <Label htmlFor="planId">Nuevo Plan</Label>
                      <Select 
                        value={membershipAction.planId} 
                        onValueChange={(value) => setMembershipAction(prev => ({ ...prev, planId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PLANS).map(([key, planConfig]) => (
                            <SelectItem key={key} value={key}>
                              {planConfig.name} - {typeof planConfig.price === 'number' ? formatCurrency(planConfig.price) : planConfig.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(membershipAction.type === 'extend_trial' || membershipAction.type === 'extend_membership') && (
                    <div>
                      <Label htmlFor="duration">Duración (días)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={membershipAction.duration || ''}
                        onChange={(e) => setMembershipAction(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      />
                    </div>
                  )}

                  {(membershipAction.type === 'assign_free' || membershipAction.type === 'change_plan') && (
                    <div>
                      <Label htmlFor="planId">{membershipAction.type === 'assign_free' ? 'Plan Gratuito' : 'Nuevo Plan'}</Label>
                      <Select 
                        value={membershipAction.planId} 
                        onValueChange={(value) => setMembershipAction(prev => ({ ...prev, planId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PLANS).map(([key, planConfig]) => (
                            <SelectItem key={key} value={key}>
                              {planConfig.name} - {typeof planConfig.price === 'number' ? formatCurrency(planConfig.price) : planConfig.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {membershipAction.type === 'assign_free' && (
                    <div>
                      <Label htmlFor="duration">Duración Gratuita (días)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={membershipAction.duration || 90}
                        onChange={(e) => setMembershipAction(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="reason">Razón (Requerida)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Explica la razón de esta acción..."
                      value={membershipAction.reason}
                      onChange={(e) => setMembershipAction(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMembershipDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleMembershipAction}
                    disabled={!membershipAction.reason.trim()}
                  >
                    Aplicar Acción
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Información de estado rápida */}
        <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Estado de Cuenta</CardTitle>
              {account.isActive ? (
                <CheckCircle className='h-4 w-4 text-green-600' />
              ) : (
                <XCircle className='h-4 w-4 text-red-600' />
              )}
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {account.isActive ? 'Activa' : 'Inactiva'}
              </div>
              <p className='text-xs text-muted-foreground'>
                Creada el {formatDate(account.createdAt)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Suscripción</CardTitle>
              <CreditCard className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {getSubscriptionStatus() || 'Sin Suscripción'}
              </div>
              <p className='text-xs text-muted-foreground'>
                {account.billingInfo?.nextPaymentDate && 
                 `Próximo pago: ${formatDate(account.billingInfo.nextPaymentDate)}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Firebase Auth</CardTitle>
              {account.ownerId ? (
                <CheckCircle className='h-4 w-4 text-green-600' />
              ) : (
                <AlertTriangle className='h-4 w-4 text-yellow-600' />
              )}
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {account.ownerId ? 'Asignado' : 'Sin Asignar'}
              </div>
              <div className='mt-2'>
                {!account.ownerId && (
                  <Dialog open={firebaseDialog} onOpenChange={setFirebaseDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <UserPlus className='mr-1 h-3 w-3' />
                        Asignar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Asignar Firebase Auth</DialogTitle>
                        <DialogDescription>
                          Asigna una cuenta de Firebase Auth existente a esta cuenta
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="firebaseEmail">Email de Firebase Auth</Label>
                          <Input
                            id="firebaseEmail"
                            type="email"
                            placeholder="usuario@ejemplo.com"
                            value={firebaseEmail}
                            onChange={(e) => setFirebaseEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setFirebaseDialog(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleFirebaseAssignment}
                          disabled={!firebaseEmail.trim()}
                        >
                          Asignar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Última Actividad</CardTitle>
              <Activity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {accountStats?.lastActivity ? 'Reciente' : 'Sin Actividad'}
              </div>
              <p className='text-xs text-muted-foreground'>
                {accountStats?.lastActivity && formatDate(accountStats.lastActivity)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs con información detallada */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="patients">Pacientes</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="appointments">Citas</TabsTrigger>
            <TabsTrigger value="billing">Facturación</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Métricas generales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Pacientes</CardTitle>
                  <Users className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{accountStats?.totalPatients || 0}</div>
                  <div className="mt-2">
                    <Progress 
                      value={getPlanUsage(
                        accountStats?.totalPatients || 0,
                        account.billingInfo?.plan?.limits.patients || 100
                      ).percentage} 
                      className="h-2"
                    />
                    <p className='text-xs text-muted-foreground mt-1'>
                      {account.billingInfo?.plan?.limits.patients === -1 
                        ? 'Ilimitados' 
                        : `${accountStats?.totalPatients || 0} / ${account.billingInfo?.plan?.limits.patients || 100}`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Usuarios</CardTitle>
                  <Stethoscope className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{accountStats?.totalUsers || 0}</div>
                  <div className="mt-2">
                    <Progress 
                      value={getPlanUsage(
                        accountStats?.totalUsers || 0,
                        account.billingInfo?.plan?.limits.users || 1
                      ).percentage} 
                      className="h-2"
                    />
                    <p className='text-xs text-muted-foreground mt-1'>
                      {accountStats?.totalUsers || 0} / {account.billingInfo?.plan?.limits.users || 1}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Citas</CardTitle>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{accountStats?.totalAppointments || 0}</div>
                  <p className='text-xs text-muted-foreground'>
                    Total de citas programadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Almacenamiento</CardTitle>
                  <HardDrive className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {((accountStats?.storageUsed || 0) / 1024).toFixed(1)} GB
                  </div>
                  <div className="mt-2">
                    <Progress 
                      value={getPlanUsage(
                        accountStats?.storageUsed || 0,
                        (account.billingInfo?.plan?.limits.storage || 1) * 1024
                      ).percentage} 
                      className="h-2"
                    />
                    <p className='text-xs text-muted-foreground mt-1'>
                      de {account.billingInfo?.plan?.limits.storage || 1} GB
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Información de la cuenta */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{account.settings?.centerName || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{account.settings?.doctorName || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{account.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{account.settings?.phone || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {account.settings?.address && account.settings?.city 
                        ? `${account.settings.address}, ${account.settings.city}`
                        : 'No especificado'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Información de Facturación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Plan Actual:</span>
                    <p className="font-medium">{account.billingInfo?.plan?.name || 'Sin plan'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <p className="font-medium">{account.billingInfo?.subscriptionStatus || 'Sin suscripción'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Método de Pago:</span>
                    <p className="font-medium">{account.billingInfo?.paymentMethod || 'No configurado'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Próximo Pago:</span>
                    <p className="font-medium">
                      {account.billingInfo?.nextPaymentDate 
                        ? formatDate(account.billingInfo.nextPaymentDate)
                        : 'N/A'
                      }
                    </p>
                  </div>
                  {account.billingInfo?.trialEndDate && (
                    <div>
                      <span className="text-sm text-muted-foreground">Fin del Trial:</span>
                      <p className="font-medium">{formatDate(account.billingInfo.trialEndDate)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Pacientes ({patients.length})</CardTitle>
                <CardDescription>
                  Todos los pacientes registrados en esta cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay pacientes registrados
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Fecha de Registro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.slice(0, 10).map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell>
                            {patient.firstName} {patient.lastName}
                          </TableCell>
                          <TableCell>{patient.email}</TableCell>
                          <TableCell>{patient.phone}</TableCell>
                          <TableCell>{formatDate(patient.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usuarios del Sistema ({users.length})</CardTitle>
                <CardDescription>
                  Doctores y personal con acceso al sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay usuarios registrados
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Especialidad</TableHead>
                        <TableHead>Fecha de Registro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell>{user.mainSpeciality || 'N/A'}</TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Citas Médicas ({appointments.length})</CardTitle>
                <CardDescription>
                  Historial de citas programadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay citas registradas
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.slice(0, 10).map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>{formatDate(appointment.date)}</TableCell>
                          <TableCell>{'N/A'}</TableCell>
                          <TableCell>{'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              scheduled
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            Sin notas
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Facturación</CardTitle>
                <CardDescription>
                  Facturas e ingresos generados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Funcionalidad de facturación en desarrollo
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de la Cuenta</CardTitle>
                <CardDescription>
                  Configuraciones específicas de esta cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Configuración de Horarios</h4>
                    <p className="text-sm text-muted-foreground">
                      {account.settings?.schedule ? 'Configurado' : 'No configurado'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Moneda</h4>
                    <p className="text-sm text-muted-foreground">
                      {account.settings?.currency?.code || 'USD'} ({account.settings?.currency?.symbol || '$'})
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">RNC/Cédula</h4>
                    <p className="text-sm text-muted-foreground">
                      {account.settings?.rnc_cedula || 'No especificado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Detalles',
    href: `/accounts/${location.pathname.split('/')[2]}`,
    isActive: true,
    disabled: false,
  },
  {
    title: 'Historial',
    href: `/accounts/${location.pathname.split('/')[2]}/history`,
    isActive: false,
    disabled: true,
  },
  {
    title: 'Configuración',
    href: `/accounts/${location.pathname.split('/')[2]}/settings`,
    isActive: false,
    disabled: true,
  },
]
