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
  Receipt,
  Building2,
  DollarSign,
  User,
  CreditCard,
  Filter,
  Download,
  Eye,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { firebaseAdminService } from '@/lib/firebase-admin'
import { useTablePagination } from '@/hooks/use-table-pagination'
import { useTableSorting } from '@/hooks/use-table-sorting'
import { toast } from 'sonner'
import type { Account } from 'ixiclinic-types/dist/admin-exports'

interface Invoice {
  id: string
  accountId: string
  patientId?: string
  invoiceNumber: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  dueDate: any
  issueDate: any
  paidDate?: any
  description?: string
  items?: InvoiceItem[]
  createdAt: any
  updatedAt: any
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface InvoiceWithAccountInfo extends Invoice {
  accountInfo?: Account
}

export function InvoicesManagement() {
  const [invoices, setInvoices] = useState<InvoiceWithAccountInfo[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithAccountInfo[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [amountFilter, setAmountFilter] = useState<string>('all')

  // Hooks para paginación y ordenamiento
  const {
    sortedData: sortedInvoices,
    requestSort,
    getSortIndicator
  } = useTableSorting({ 
    data: filteredInvoices,
    initialSort: { key: 'issueDate', direction: 'desc' }
  })
  
  const {
    currentPage,
    pageSize,
    paginatedData: displayedInvoices,
    setPage,
    setPageSize
  } = useTablePagination({ 
    data: sortedInvoices,
    initialPageSize: 20
  })

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [invoices, searchTerm, statusFilter, accountFilter, amountFilter])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const [accountsData] = await Promise.all([
        firebaseAdminService.getAllAccounts()
      ])
      
      setAccounts(accountsData)
      
      // Obtener facturas de todas las cuentas
      const allInvoices: InvoiceWithAccountInfo[] = []
      
      for (const account of accountsData) {
        try {
          // Como no hay método específico para invoices, simulamos datos por ahora
          // En una implementación real, se usaría: 
          // const accountInvoices = await firebaseAdminService.getInvoicesByAccount(account.id)
          const mockInvoices = generateMockInvoices(account.id, account)
          allInvoices.push(...mockInvoices)
        } catch (error) {
          console.warn(`Error cargando facturas para cuenta ${account.id}:`, error)
        }
      }
      
      setInvoices(allInvoices)
      setFilteredInvoices(allInvoices)
      
      console.log(`✅ Cargadas ${allInvoices.length} facturas de ${accountsData.length} cuentas`)
    } catch (error) {
      console.error('Error loading invoices:', error)
      toast.error('Error al cargar las facturas')
    } finally {
      setLoading(false)
    }
  }

  const generateMockInvoices = (accountId: string, accountInfo: Account): InvoiceWithAccountInfo[] => {
    // Generar algunas facturas de ejemplo para demostración
    const mockInvoices: InvoiceWithAccountInfo[] = []
    const statuses: Array<Invoice['status']> = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
    const services = [
      'Consulta Médica General',
      'Consulta Especializada',
      'Exámenes de Laboratorio',
      'Procedimiento Menor',
      'Consulta de Control',
      'Radiografía',
      'Ecografía',
      'Terapia Física'
    ]

    for (let i = 0; i < Math.floor(Math.random() * 10) + 3; i++) {
      const issueDate = new Date()
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 180))
      
      const dueDate = new Date(issueDate)
      dueDate.setDate(dueDate.getDate() + 30)
      
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const amount = Math.floor(Math.random() * 500) + 50
      
      mockInvoices.push({
        id: `inv-${accountId}-${i}`,
        accountId,
        patientId: `patient-${i}`,
        invoiceNumber: `INV-${String(issueDate.getFullYear())}-${String(i + 1).padStart(4, '0')}`,
        amount,
        currency: 'USD',
        status,
        issueDate: { toDate: () => issueDate },
        dueDate: { toDate: () => dueDate },
        paidDate: status === 'paid' ? { toDate: () => new Date(issueDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) } : undefined,
        description: services[Math.floor(Math.random() * services.length)],
        createdAt: { toDate: () => issueDate },
        updatedAt: { toDate: () => issueDate },
        accountInfo
      })
    }

    return mockInvoices
  }

  const filterInvoices = () => {
    let filtered = invoices

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.accountInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.accountInfo?.settings?.centerName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    // Filtro por cuenta
    if (accountFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.accountId === accountFilter)
    }

    // Filtro por monto
    if (amountFilter !== 'all') {
      filtered = filtered.filter(invoice => {
        switch (amountFilter) {
          case 'low':
            return invoice.amount < 100
          case 'medium':
            return invoice.amount >= 100 && invoice.amount <= 500
          case 'high':
            return invoice.amount > 500
          default:
            return true
        }
      })
    }

    setFilteredInvoices(filtered)
  }

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      'draft': { variant: 'secondary' as const, label: 'Borrador', icon: FileText },
      'sent': { variant: 'outline' as const, label: 'Enviada', icon: FileText },
      'paid': { variant: 'default' as const, label: 'Pagada', icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
      'overdue': { variant: 'destructive' as const, label: 'Vencida', icon: AlertCircle },
      'cancelled': { variant: 'destructive' as const, label: 'Cancelada', icon: AlertCircle }
    }

    const config = statusConfig[status] || { 
      variant: 'secondary' as const, 
      label: status,
      icon: FileText
    }
    
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    )
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

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount)
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

  const calculateTotalRevenue = () => {
    return invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((total, invoice) => total + invoice.amount, 0)
  }

  const calculatePendingAmount = () => {
    return invoices
      .filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue')
      .reduce((total, invoice) => total + invoice.amount, 0)
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
            <h1 className='text-2xl font-bold tracking-tight'>Gestión de Facturas</h1>
            <p className='text-muted-foreground'>
              Administra todas las facturas del sistema desde este panel
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
              <CardTitle className='text-sm font-medium'>Total Facturas</CardTitle>
              <Receipt className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{invoices.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Ingresos Totales</CardTitle>
              <DollarSign className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatCurrency(calculateTotalRevenue())}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Pendientes</CardTitle>
              <AlertCircle className='h-4 w-4 text-yellow-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatCurrency(calculatePendingAmount())}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Cuentas Facturando</CardTitle>
              <Building2 className='h-4 w-4 text-purple-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {new Set(invoices.map(i => i.accountId)).size}
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
                  placeholder='Buscar por número, paciente, descripción...'
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
                  <SelectItem value='draft'>Borrador</SelectItem>
                  <SelectItem value='sent'>Enviada</SelectItem>
                  <SelectItem value='paid'>Pagada</SelectItem>
                  <SelectItem value='overdue'>Vencida</SelectItem>
                  <SelectItem value='cancelled'>Cancelada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={amountFilter} onValueChange={setAmountFilter}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Monto' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos los montos</SelectItem>
                  <SelectItem value='low'>Menos de $100</SelectItem>
                  <SelectItem value='medium'>$100 - $500</SelectItem>
                  <SelectItem value='high'>Más de $500</SelectItem>
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

        {/* Tabla de facturas */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Facturas</CardTitle>
            <CardDescription>
              {filteredInvoices.length} de {invoices.length} facturas mostradas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-muted-foreground'>Cargando facturas...</div>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-muted-foreground'>
                  {searchTerm || statusFilter !== 'all' || accountFilter !== 'all' || amountFilter !== 'all' 
                    ? 'No se encontraron facturas con los filtros aplicados'
                    : 'No hay facturas registradas'
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
                        onClick={() => requestSort('invoiceNumber')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Número</span>
                          {getSortIndicator('invoiceNumber') === 'asc' && <ChevronUp className="h-4 w-4" />}
                          {getSortIndicator('invoiceNumber') === 'desc' && <ChevronDown className="h-4 w-4" />}
                          {!getSortIndicator('invoiceNumber') && <ArrowUpDown className="h-4 w-4" />}
                        </div>
                      </TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => requestSort('amount')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Monto</span>
                          {getSortIndicator('amount') === 'asc' && <ChevronUp className="h-4 w-4" />}
                          {getSortIndicator('amount') === 'desc' && <ChevronDown className="h-4 w-4" />}
                          {!getSortIndicator('amount') && <ArrowUpDown className="h-4 w-4" />}
                        </div>
                      </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => requestSort('issueDate')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Fecha</span>
                          {getSortIndicator('issueDate') === 'asc' && <ChevronUp className="h-4 w-4" />}
                          {getSortIndicator('issueDate') === 'desc' && <ChevronDown className="h-4 w-4" />}
                          {!getSortIndicator('issueDate') && <ArrowUpDown className="h-4 w-4" />}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="font-medium">
                            {invoice.invoiceNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>
                              {invoice.patientId || 'No especificado'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {invoice.description || 'Sin descripción'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invoice.status)}
                        </TableCell>
                        <TableCell>
                          {getAccountBadge(invoice.accountInfo)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatDate(invoice.issueDate)}
                            </div>
                            {invoice.dueDate && (
                              <div className="text-sm text-muted-foreground">
                                Vence: {formatDate(invoice.dueDate)}
                              </div>
                            )}
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
                  totalItems={filteredInvoices.length}
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
    title: 'Todas las Facturas',
    href: '/invoices',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Pendientes',
    href: '/invoices/pending',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Vencidas',
    href: '/invoices/overdue',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Reportes',
    href: '/invoices/reports',
    isActive: false,
    disabled: true,
  },
]
