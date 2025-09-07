import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import {
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RefreshCw,
  DollarSign,
  Filter,
  Download,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePayPalStore } from '@/stores/paypal-store'

export function SubscriptionsManagement() {
  const {
    subscriptions,
    problemSubscriptions,
    isLoadingSubscriptions,
    fetchSubscriptions,
    fetchProblemSubscriptions,
    cancelSubscription,
    reactivateSubscription,
    suspendSubscription,
    retryFailedPayment
  } = usePayPalStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [filteredSubscriptions, setFilteredSubscriptions] = useState(subscriptions)
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    action: 'cancel' | 'suspend' | 'reactivate' | 'retry' | null
    reason: string
  }>({
    open: false,
    action: null,
    reason: ''
  })

  useEffect(() => {
    fetchSubscriptions()
    fetchProblemSubscriptions()
  }, [fetchSubscriptions, fetchProblemSubscriptions])

  useEffect(() => {
    filterSubscriptions()
  }, [subscriptions, searchTerm, statusFilter])

  const filterSubscriptions = () => {
    let filtered = subscriptions

    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.subscriber.email_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter)
    }

    setFilteredSubscriptions(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { variant: 'default' as const, icon: CheckCircle, label: 'Activa' },
      'SUSPENDED': { variant: 'destructive' as const, icon: Pause, label: 'Suspendida' },
      'CANCELLED': { variant: 'secondary' as const, icon: XCircle, label: 'Cancelada' },
      'EXPIRED': { variant: 'secondary' as const, icon: XCircle, label: 'Expirada' },
      'APPROVAL_PENDING': { variant: 'outline' as const, icon: AlertTriangle, label: 'Pendiente' },
      'APPROVED': { variant: 'default' as const, icon: CheckCircle, label: 'Aprobada' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      variant: 'secondary' as const, 
      icon: AlertTriangle, 
      label: status 
    }
    
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getProblemBadge = (subscription: any) => {
    const hasProblems = subscription.billing_info.failed_payments_count > 0 ||
                       parseFloat(subscription.billing_info.outstanding_balance.value) > 0

    if (!hasProblems) return null

    return (
      <Badge variant="destructive" className="ml-2">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Problemas de Pago
      </Badge>
    )
  }

  const handleAction = async (action: string, subscription: any, reason = '') => {
    try {
      let success = false
      
      switch (action) {
        case 'cancel':
          success = await cancelSubscription(subscription.id, reason)
          break
        case 'suspend':
          success = await suspendSubscription(subscription.id, reason)
          break
        case 'reactivate':
          success = await reactivateSubscription(subscription.id)
          break
        case 'retry':
          success = await retryFailedPayment(subscription.id)
          break
      }

      if (success) {
        fetchSubscriptions()
        fetchProblemSubscriptions()
        setActionDialog({ open: false, action: null, reason: '' })
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
    }
  }

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(parseFloat(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Gestión de Suscripciones</h1>
            <p className='text-muted-foreground'>
              Administra las suscripciones de PayPal y resuelve problemas de pago
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant="outline" onClick={() => fetchSubscriptions()}>
              <RefreshCw className='mr-2 h-4 w-4' />
              Actualizar
            </Button>
            <Button variant="outline">
              <Download className='mr-2 h-4 w-4' />
              Exportar
            </Button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Suscripciones</CardTitle>
              <CreditCard className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{subscriptions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Activas</CardTitle>
              <CheckCircle className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {subscriptions.filter(s => s.status === 'ACTIVE').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Con Problemas</CardTitle>
              <AlertTriangle className='h-4 w-4 text-red-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-600'>
                {problemSubscriptions.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Ingresos Mensuales</CardTitle>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>$24,580</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Filter className='mr-2 h-4 w-4' />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-4'>
              <div className='flex-1 min-w-[200px]'>
                <Input
                  placeholder='Buscar por email o ID de suscripción...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Estado' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos los estados</SelectItem>
                  <SelectItem value='ACTIVE'>Activa</SelectItem>
                  <SelectItem value='SUSPENDED'>Suspendida</SelectItem>
                  <SelectItem value='CANCELLED'>Cancelada</SelectItem>
                  <SelectItem value='EXPIRED'>Expirada</SelectItem>
                  <SelectItem value='APPROVAL_PENDING'>Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de suscripciones */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Suscripciones</CardTitle>
            <CardDescription>
              {filteredSubscriptions.length} de {subscriptions.length} suscripciones mostradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSubscriptions ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-muted-foreground'>Cargando suscripciones...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Suscripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Último Pago</TableHead>
                    <TableHead>Próximo Pago</TableHead>
                    <TableHead>Pagos Fallidos</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className='font-medium text-sm'>
                            {subscription.id}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            {subscription.subscriber.email_address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getStatusBadge(subscription.status)}
                          {getProblemBadge(subscription)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          ID: {subscription.plan_id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className='text-sm font-medium'>
                            {formatCurrency(
                              subscription.billing_info.last_payment?.amount.value || '0',
                              subscription.billing_info.last_payment?.amount.currency_code || 'USD'
                            )}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {subscription.billing_info.last_payment?.time && 
                             formatDate(subscription.billing_info.last_payment.time)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          {formatDate(subscription.billing_info.next_billing_time)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className={`text-sm ${
                            subscription.billing_info.failed_payments_count > 0 
                              ? 'text-red-600 font-medium' 
                              : 'text-muted-foreground'
                          }`}>
                            {subscription.billing_info.failed_payments_count}
                          </span>
                          {subscription.billing_info.failed_payments_count > 0 && (
                            <AlertTriangle className="h-4 w-4 text-red-500 ml-1" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedSubscription(subscription)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            
                            {subscription.status === 'ACTIVE' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedSubscription(subscription)
                                    setActionDialog({ open: true, action: 'suspend', reason: '' })
                                  }}
                                >
                                  <Pause className="mr-2 h-4 w-4" />
                                  Suspender
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedSubscription(subscription)
                                    setActionDialog({ open: true, action: 'cancel', reason: '' })
                                  }}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancelar
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {subscription.status === 'SUSPENDED' && (
                              <DropdownMenuItem 
                                onClick={() => handleAction('reactivate', subscription)}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Reactivar
                              </DropdownMenuItem>
                            )}
                            
                            {subscription.billing_info.failed_payments_count > 0 && (
                              <DropdownMenuItem 
                                onClick={() => handleAction('retry', subscription)}
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reintentar Pago
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog para acciones */}
        <Dialog 
          open={actionDialog.open} 
          onOpenChange={(open) => setActionDialog(prev => ({ ...prev, open }))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.action === 'cancel' && 'Cancelar Suscripción'}
                {actionDialog.action === 'suspend' && 'Suspender Suscripción'}
              </DialogTitle>
              <DialogDescription>
                Esta acción afectará la suscripción de PayPal. Por favor proporciona una razón.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Razón para esta acción..."
                value={actionDialog.reason}
                onChange={(e) => setActionDialog(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setActionDialog({ open: false, action: null, reason: '' })}
              >
                Cancelar
              </Button>
              <Button 
                variant={actionDialog.action === 'cancel' ? 'destructive' : 'default'}
                onClick={() => handleAction(actionDialog.action!, selectedSubscription, actionDialog.reason)}
                disabled={!actionDialog.reason.trim()}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Todas las Suscripciones',
    href: '/subscriptions',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Con Problemas',
    href: '/subscriptions/problems',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Canceladas',
    href: '/subscriptions/cancelled',
    isActive: false,
    disabled: true,
  },
]
