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
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import {
  Calendar,
  Building2,
  Clock,
  User,
  Stethoscope,
  Filter,
  Download,
  Eye,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  CalendarDays
} from 'lucide-react'
import { firebaseAdminService } from '@/lib/firebase-admin'
import { useTablePagination } from '@/hooks/use-table-pagination'
import { useTableSorting } from '@/hooks/use-table-sorting'
import { toast } from 'sonner'
import type { Appointment, Account, Patient } from 'ixiclinic-types/dist/admin-exports'

interface AppointmentWithAccountInfo extends Appointment {
  accountInfo?: Account
  patientInfo?: Patient
}

export function AppointmentsManagement() {
  const [appointments, setAppointments] = useState<AppointmentWithAccountInfo[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithAccountInfo[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // Hooks para paginación y ordenamiento
  const {
    sortedData: sortedAppointments,
    requestSort,
    getSortIndicator
  } = useTableSorting({ 
    data: filteredAppointments,
    initialSort: { key: 'date', direction: 'desc' }
  })
  
  const {
    currentPage,
    pageSize,
    paginatedData: displayedAppointments,
    setPage,
    setPageSize
  } = useTablePagination({ 
    data: sortedAppointments,
    initialPageSize: 20
  })

  useEffect(() => {
    loadAppointments()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchTerm, statusFilter, accountFilter, dateFilter])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const [accountsData] = await Promise.all([
        firebaseAdminService.getAllAccounts()
      ])
      
      setAccounts(accountsData)
      
      // Obtener citas de todas las cuentas
      const allAppointments: AppointmentWithAccountInfo[] = []
      
      for (const account of accountsData) {
        try {
          const accountAppointments = await firebaseAdminService.getAppointmentsByAccount(account.id)
          
          const appointmentsWithInfo = accountAppointments.map(appointment => ({
            ...appointment,
            accountInfo: account
          }))
          
          allAppointments.push(...appointmentsWithInfo)
        } catch (error) {
          console.warn(`Error cargando citas para cuenta ${account.id}:`, error)
        }
      }
      
      setAppointments(allAppointments)
      setFilteredAppointments(allAppointments)
      
      console.log(`✅ Cargadas ${allAppointments.length} citas de ${accountsData.length} cuentas`)
    } catch (error) {
      console.error('Error loading appointments:', error)
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  const filterAppointments = () => {
    let filtered = appointments

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(appointment => 
        appointment.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.accountInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.accountInfo?.settings?.centerName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter)
    }

    // Filtro por cuenta
    if (accountFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.accountId === accountFilter)
    }

    // Filtro por fecha
    if (dateFilter !== 'all') {
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      
      filtered = filtered.filter(appointment => {
        if (!appointment.date) return false
        const appointmentDate = appointment.date.toDate ? appointment.date.toDate() : new Date(appointment.date)
        
        switch (dateFilter) {
          case 'today':
            return appointmentDate >= todayStart && appointmentDate < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
          case 'week':
            const weekStart = new Date(todayStart.getTime() - todayStart.getDay() * 24 * 60 * 60 * 1000)
            const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
            return appointmentDate >= weekStart && appointmentDate < weekEnd
          case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)
            return appointmentDate >= monthStart && appointmentDate < monthEnd
          default:
            return true
        }
      })
    }

    setFilteredAppointments(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'scheduled': { variant: 'default' as const, label: 'Programada' },
      'confirmed': { variant: 'secondary' as const, label: 'Confirmada' },
      'in-progress': { variant: 'outline' as const, label: 'En Curso' },
      'completed': { variant: 'default' as const, label: 'Completada', className: 'bg-green-100 text-green-800' },
      'cancelled': { variant: 'destructive' as const, label: 'Cancelada' },
      'no-show': { variant: 'destructive' as const, label: 'No Asistió' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      variant: 'secondary' as const, 
      label: status || 'Sin Estado' 
    }
    
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>
  }

  const getAccountBadge = (accountInfo?: Account) => {
    if (!accountInfo) {
      return <Badge variant="destructive">Sin cuenta</Badge>
    }

    return (
      <div>
        <Link 
          to="/accounts/$accountId" 
          params={{ accountId: accountInfo.id }}
          className="font-medium text-sm hover:underline text-primary"
        >
          {accountInfo.settings?.centerName || accountInfo.settings?.doctorName || 'Sin nombre'}
        </Link>
        <div className="text-xs text-muted-foreground">
          {accountInfo.email}
        </div>
      </div>
    )
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'N/A'
    }
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
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
            <h1 className='text-2xl font-bold tracking-tight'>Gestión de Citas</h1>
            <p className='text-muted-foreground'>
              Administra todas las citas médicas del sistema desde este panel
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant="outline" onClick={() => {}}>
              <Download className='mr-2 h-4 w-4' />
              Exportar
            </Button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Citas</CardTitle>
              <Calendar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{appointments.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Programadas</CardTitle>
              <CalendarDays className='h-4 w-4 text-blue-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {appointments.filter(a => a.status === 'scheduled').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Completadas</CardTitle>
              <CalendarDays className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {appointments.filter(a => a.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Cuentas con Citas</CardTitle>
              <Building2 className='h-4 w-4 text-purple-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {new Set(appointments.map(a => a.accountId)).size}
              </div>
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
                  placeholder='Buscar por paciente, doctor, cuenta...'
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
                  <SelectItem value='scheduled'>Programada</SelectItem>
                  <SelectItem value='confirmed'>Confirmada</SelectItem>
                  <SelectItem value='in-progress'>En Curso</SelectItem>
                  <SelectItem value='completed'>Completada</SelectItem>
                  <SelectItem value='cancelled'>Cancelada</SelectItem>
                  <SelectItem value='no-show'>No Asistió</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Fecha' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todas las fechas</SelectItem>
                  <SelectItem value='today'>Hoy</SelectItem>
                  <SelectItem value='week'>Esta semana</SelectItem>
                  <SelectItem value='month'>Este mes</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className='w-[200px]'>
                  <SelectValue placeholder='Cuenta' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todas las cuentas</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.settings?.centerName || account.settings?.doctorName || account.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de citas */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Citas</CardTitle>
            <CardDescription>
              {filteredAppointments.length} de {appointments.length} citas mostradas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-muted-foreground'>Cargando citas...</div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-muted-foreground'>
                  {searchTerm || statusFilter !== 'all' || accountFilter !== 'all' || dateFilter !== 'all' 
                    ? 'No se encontraron citas con los filtros aplicados'
                    : 'No hay citas registradas'
                  }
                </div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => requestSort('date')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Fecha y Hora</span>
                          {getSortIndicator('date') === 'asc' && <ChevronUp className="h-4 w-4" />}
                          {getSortIndicator('date') === 'desc' && <ChevronDown className="h-4 w-4" />}
                          {!getSortIndicator('date') && <ArrowUpDown className="h-4 w-4" />}
                        </div>
                      </TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedAppointments.map((appointment) => (
                      <TableRow key={appointment.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatDate(appointment.date)}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {formatTime(appointment.date)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {appointment.patientId || 'No especificado'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Stethoscope className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>
                              {appointment.doctorId || 'No asignado'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(appointment.status)}
                        </TableCell>
                        <TableCell>
                          {getAccountBadge(appointment.accountInfo)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {appointment.notes || 'Sin notas'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginación */}
                <DataTablePagination
                  totalItems={filteredAppointments.length}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  className="border-t pt-4"
                />
              </>
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Todas las Citas',
    href: '/appointments',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Hoy',
    href: '/appointments/today',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Esta Semana',
    href: '/appointments/week',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Reportes',
    href: '/appointments/reports',
    isActive: false,
    disabled: true,
  },
]
