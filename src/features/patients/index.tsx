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
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import {
  Users,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Filter,
  Download,
  Eye
} from 'lucide-react'
import { firebaseAdminService } from '@/lib/firebase-admin'
import { toast } from 'sonner'
import type { Patient, Account } from 'ixiclinic-types/dist/admin-exports'

interface PatientWithAccount extends Patient {
  accountInfo?: Account
}

export function PatientsManagement() {
  const [patients, setPatients] = useState<PatientWithAccount[]>([])
  const [filteredPatients, setFilteredPatients] = useState<PatientWithAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    filterPatients()
  }, [patients, searchTerm, accountFilter])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const patientsData = await firebaseAdminService.getAllPatientsWithAccountInfo()
      setPatients(patientsData)
      setFilteredPatients(patientsData)
      
      // Extraer cuentas únicas para el filtro
      const uniqueAccounts = Array.from(
        new Map(
          patientsData
            .filter(p => p.accountInfo)
            .map(p => [p.accountInfo!.id, p.accountInfo!])
        ).values()
      )
      setAccounts(uniqueAccounts)
      
      console.log(`✅ Cargados ${patientsData.length} pacientes de ${uniqueAccounts.length} cuentas`)
    } catch (error) {
      console.error('Error loading patients:', error)
      toast.error('Error al cargar los pacientes')
    } finally {
      setLoading(false)
    }
  }

  const filterPatients = () => {
    let filtered = patients

    // Filtro por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(term) ||
        patient.email?.toLowerCase().includes(term) ||
        patient.phone?.includes(term) ||
        patient.accountInfo?.email?.toLowerCase().includes(term) ||
        patient.accountInfo?.settings?.centerName?.toLowerCase().includes(term)
      )
    }

    // Filtro por cuenta
    if (accountFilter !== 'all') {
      filtered = filtered.filter(patient => patient.accountId === accountFilter)
    }

    setFilteredPatients(filtered)
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    try {
      const d = date.toDate ? date.toDate() : new Date(date)
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const getAccountBadge = (accountInfo?: Account) => {
    if (!accountInfo) {
      return <Badge variant="destructive">Sin Cuenta</Badge>
    }
    
    if (!accountInfo.isActive) {
      return <Badge variant="secondary">Cuenta Inactiva</Badge>
    }
    
    return (
      <Badge variant="outline">
        {accountInfo.settings?.centerName || accountInfo.email}
      </Badge>
    )
  }

  const exportPatients = () => {
    // Implementar exportación CSV
    const csvContent = [
      ['Nombre', 'Email', 'Teléfono', 'Cuenta', 'Fecha de Registro'].join(','),
      ...filteredPatients.map(patient => [
        `"${patient.firstName} ${patient.lastName}"`,
        `"${patient.email || ''}"`,
        `"${patient.phone || ''}"`,
        `"${patient.accountInfo?.settings?.centerName || patient.accountInfo?.email || 'Sin cuenta'}"`,
        `"${formatDate(patient.createdAt)}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `pacientes_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Pacientes exportados exitosamente')
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
            <h1 className='text-3xl font-bold tracking-tight'>Gestión de Pacientes</h1>
            <p className='text-muted-foreground'>
              Todos los pacientes registrados en el sistema
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant="outline" onClick={exportPatients}>
              <Download className='mr-2 h-4 w-4' />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Pacientes</CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{patients.length}</div>
              <p className='text-xs text-muted-foreground'>
                En {accounts.length} cuentas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Pacientes Filtrados</CardTitle>
              <Filter className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{filteredPatients.length}</div>
              <p className='text-xs text-muted-foreground'>
                Mostrando resultados actuales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Cuentas Activas</CardTitle>
              <Building2 className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {accounts.filter(a => a.isActive).length}
              </div>
              <p className='text-xs text-muted-foreground'>
                Con pacientes registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Este Mes</CardTitle>
              <Calendar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {patients.filter(p => {
                  const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt as any)
                  const thisMonth = new Date()
                  thisMonth.setDate(1)
                  return createdAt >= thisMonth
                }).length}
              </div>
              <p className='text-xs text-muted-foreground'>
                Pacientes nuevos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtra y busca pacientes en todo el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
              <div className='flex-1'>
                <Input
                  placeholder='Buscar por nombre, email, teléfono o cuenta...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className='w-[200px]'>
                  <SelectValue placeholder='Filtrar por cuenta' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todas las cuentas</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.settings?.centerName || account.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de pacientes */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Pacientes ({filteredPatients.length})</CardTitle>
            <CardDescription>
              Todos los pacientes registrados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-muted-foreground'>Cargando pacientes...</div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-muted-foreground'>
                  {searchTerm || accountFilter !== 'all' 
                    ? 'No se encontraron pacientes con los filtros aplicados'
                    : 'No hay pacientes registrados'
                  }
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {patient.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {patient.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="mr-1 h-3 w-3" />
                              {patient.email}
                            </div>
                          )}
                          {patient.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="mr-1 h-3 w-3" />
                              {patient.phone}
                            </div>
                          )}
                          {patient.address && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="mr-1 h-3 w-3" />
                              {patient.address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getAccountBadge(patient.accountInfo)}
                      </TableCell>
                      <TableCell>
                        {formatDate(patient.createdAt)}
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
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Pacientes',
    href: '/patients',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Estadísticas',
    href: '/patients/stats',
    isActive: false,
    disabled: true,
  },
]


