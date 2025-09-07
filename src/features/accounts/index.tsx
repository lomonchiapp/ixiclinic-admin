import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import {
  Building2,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  UserPlus,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  MoreVertical
} from 'lucide-react'
import { firebaseAdminService } from '@/lib/firebase-admin'
import type { Account, SubscriptionStatus } from 'ixiclinic-types/dist/admin-exports'
// Firebase Auth service ya no es necesario
import { toast } from 'sonner'

export function AccountsManagement() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  // Estado de Firebase Auth eliminado - ya no es necesario
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    filterAccounts()
  }, [accounts, searchTerm, statusFilter, typeFilter])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const accountsData = await firebaseAdminService.getAllAccounts()
      setAccounts(accountsData)
      setFilteredAccounts(accountsData)
      
      // Ya no verificamos Firebase Auth - todas las cuentas son válidas
      console.log('✅ Cuentas cargadas correctamente')
    } catch (error) {
      console.error('Error loading accounts:', error)
      toast.error('Error al cargar las cuentas')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async (accountId: string, accountName: string) => {
    const confirmed = window.confirm(
      `⚠️ ¿Estás seguro de que quieres eliminar la cuenta "${accountName}"?\n\n` +
      `Esta acción eliminará PERMANENTEMENTE:\n` +
      `• La cuenta y toda su configuración\n` +
      `• Todos los pacientes asociados\n` +
      `• Todas las citas médicas\n` +
      `• Todos los usuarios de la cuenta\n` +
      `• Todas las facturas e historial\n` +
      `• El usuario de Firebase Auth (si existe)\n\n` +
      `Esta acción NO se puede deshacer.`
    )

    if (!confirmed) return

    try {
      console.log(`🗑️ Eliminando cuenta: ${accountId}`)
      toast.loading('Eliminando cuenta...', { id: 'delete-account' })
      
      const success = await firebaseAdminService.deleteAccountCompletely(accountId)
      
      if (success) {
        toast.success('Cuenta eliminada completamente', { id: 'delete-account' })
        
        // Actualizar la lista de cuentas
        await loadAccounts()
      } else {
        toast.error('Error al eliminar la cuenta', { id: 'delete-account' })
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Error al eliminar la cuenta', { id: 'delete-account' })
    }
  }

  const filterAccounts = () => {
    let filtered = accounts

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(account => 
        account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.settings?.centerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.settings?.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por estado de suscripción
    if (statusFilter !== 'all') {
      filtered = filtered.filter(account => 
        account.billingInfo?.subscriptionStatus === statusFilter
      )
    }

    // Filtro por tipo de cuenta
    if (typeFilter !== 'all') {
      filtered = filtered.filter(account => account.type === typeFilter)
    }

    setFilteredAccounts(filtered)
  }

  const getStatusBadge = (status: SubscriptionStatus | null | undefined) => {
    if (!status) return <Badge variant="secondary">Sin estado</Badge>

    const statusConfig = {
      active: { variant: 'default' as const, label: 'Activo' },
      trial: { variant: 'secondary' as const, label: 'Trial' },
      inactive: { variant: 'destructive' as const, label: 'Inactivo' },
      pending: { variant: 'outline' as const, label: 'Pendiente' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelado' }
    }

    const config = statusConfig[status] || { variant: 'secondary' as const, label: status }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      personal: { label: 'Personal', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      clinic: { label: 'Clínica', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      hospital: { label: 'Hospital', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
    }

    const config = typeConfig[type as keyof typeof typeConfig] || { label: type, className: '' }
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Gestión de Cuentas</h1>
            <p className='text-muted-foreground'>
              Administra todas las cuentas de IxiClinic desde este panel
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant="outline" onClick={() => {}}>
              <Download className='mr-2 h-4 w-4' />
              Exportar
            </Button>
            <Link to="/accounts/new">
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                Nueva Cuenta
              </Button>
            </Link>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Cuentas</CardTitle>
              <Building2 className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{accounts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Activas</CardTitle>
              <CheckCircle className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {accounts.filter(a => a.billingInfo?.subscriptionStatus === 'active').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>En Trial</CardTitle>
              <Calendar className='h-4 w-4 text-yellow-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {accounts.filter(a => a.billingInfo?.subscriptionStatus === 'trial').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Sin Firebase Auth</CardTitle>
              <AlertTriangle className='h-4 w-4 text-yellow-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {accounts.filter(a => !a.ownerId).length}
              </div>
              <p className='text-xs text-muted-foreground'>
                Sin autenticación verificada
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
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
                  placeholder='Buscar por email, centro médico o doctor...'
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
                  <SelectItem value='active'>Activo</SelectItem>
                  <SelectItem value='trial'>Trial</SelectItem>
                  <SelectItem value='inactive'>Inactivo</SelectItem>
                  <SelectItem value='pending'>Pendiente</SelectItem>
                  <SelectItem value='cancelled'>Cancelado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Tipo' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos los tipos</SelectItem>
                  <SelectItem value='personal'>Personal</SelectItem>
                  <SelectItem value='clinic'>Clínica</SelectItem>
                  <SelectItem value='hospital'>Hospital</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de cuentas */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Cuentas</CardTitle>
            <CardDescription>
              {filteredAccounts.length} de {accounts.length} cuentas mostradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-muted-foreground'>Cargando cuentas...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div>
                          <div className='font-medium'>
                            {account.settings?.centerName || account.settings?.doctorName || 'Sin nombre'}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            {account.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(account.type)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(account.billingInfo?.subscriptionStatus)}
                      </TableCell>
                      <TableCell>
                        {formatDate(account.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.location.href = `/accounts/${account.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Información
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Gestionar Membresía
                            </DropdownMenuItem>
                            {!account.ownerId && (
                              <DropdownMenuItem>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Asignar Firebase Auth
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteAccount(account.id, account.email || 'Cuenta sin nombre')}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar Cuenta
                            </DropdownMenuItem>
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
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Todas las Cuentas',
    href: '/accounts',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Cuentas Activas',
    href: '/accounts/active',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Trials',
    href: '/accounts/trials',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Vencidas',
    href: '/accounts/expired',
    isActive: false,
    disabled: true,
  },
]
