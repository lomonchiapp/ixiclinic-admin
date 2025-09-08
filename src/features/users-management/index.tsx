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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import {
  Users,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Building2,
  Mail,
  Phone,
  UserPlus,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { firebaseAdminService } from '@/lib/firebase-admin'
import { useTablePagination } from '@/hooks/use-table-pagination'
import { useTableSorting } from '@/hooks/use-table-sorting'
import type { User, Account } from 'ixiclinic-types/dist/admin-exports'
import { UserRole } from 'ixiclinic-types/dist/enums'
import { toast } from 'sonner'

interface UserWithAccount extends User {
  accountInfo?: Account
}

interface CreateUserForm {
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: UserRole
  accountId: string
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserWithAccount[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithAccount[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [createDialog, setCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: UserRole.USER,
    accountId: ''
  })

  // Hooks para paginación y ordenamiento
  const {
    sortedData: sortedUsers,
    requestSort,
    getSortIndicator
  } = useTableSorting({ 
    data: filteredUsers,
    initialSort: { key: 'createdAt', direction: 'desc' }
  })
  
  const {
    currentPage,
    pageSize,
    paginatedData: displayedUsers,
    setPage,
    setPageSize
  } = useTablePagination({ 
    data: sortedUsers,
    initialPageSize: 20
  })

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter, accountFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const [usersData, accountsData] = await Promise.all([
        firebaseAdminService.getAllUsersWithAccountInfo(),
        firebaseAdminService.getAllAccounts()
      ])
      
      setUsers(usersData)
      setAccounts(accountsData)
      setFilteredUsers(usersData)
      
      console.log(`✅ Cargados ${usersData.length} usuarios de ${accountsData.length} cuentas`)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.accountInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.accountInfo?.settings?.centerName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por rol
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Filtro por cuenta
    if (accountFilter !== 'all') {
      filtered = filtered.filter(user => user.accountId === accountFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleCreateUser = async () => {
    try {
      if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.accountId) {
        toast.error('Por favor completa todos los campos obligatorios')
        return
      }

      toast.loading('Creando usuario...', { id: 'create-user' })
      
      await firebaseAdminService.createUserInAccount(createForm.accountId, {
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        email: createForm.email,
        phone: createForm.phone,
        role: createForm.role
      })
      
      toast.success('Usuario creado exitosamente', { id: 'create-user' })
      setCreateDialog(false)
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: UserRole.USER,
        accountId: ''
      })
      
      // Recargar usuarios
      await loadUsers()
      
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Error al crear el usuario', { id: 'create-user' })
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      [UserRole.ADMIN]: { variant: 'destructive' as const, label: 'Administrador' },
      [UserRole.DOCTOR]: { variant: 'default' as const, label: 'Doctor' },
      [UserRole.ASSISTANT]: { variant: 'secondary' as const, label: 'Asistente' },
      [UserRole.USER]: { variant: 'outline' as const, label: 'Usuario' }
    }

    const config = roleConfig[role] || { variant: 'outline' as const, label: role }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge variant="default">Activo</Badge>
      : <Badge variant="destructive">Inactivo</Badge>
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
            <h1 className='text-2xl font-bold tracking-tight'>Gestión de Usuarios</h1>
            <p className='text-muted-foreground'>
              Administra todos los usuarios de las cuentas SaaS desde este panel
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant="outline" onClick={() => {}}>
              <Download className='mr-2 h-4 w-4' />
              Exportar
            </Button>
            <Dialog open={createDialog} onOpenChange={setCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='mr-2 h-4 w-4' />
                  Crear Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Crea un nuevo usuario para una cuenta específica
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="account" className="text-right">
                      Cuenta *
                    </Label>
                    <Select
                      value={createForm.accountId}
                      onValueChange={(value) => setCreateForm({ ...createForm, accountId: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Seleccionar cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.settings?.centerName || account.settings?.doctorName || account.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="firstName" className="text-right">
                      Nombre *
                    </Label>
                    <Input
                      id="firstName"
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lastName" className="text-right">
                      Apellido *
                    </Label>
                    <Input
                      id="lastName"
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Teléfono
                    </Label>
                    <Input
                      id="phone"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Rol
                    </Label>
                    <Select
                      value={createForm.role}
                      onValueChange={(value: UserRole) => setCreateForm({ ...createForm, role: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.USER}>Usuario</SelectItem>
                        <SelectItem value={UserRole.ASSISTANT}>Asistente</SelectItem>
                        <SelectItem value={UserRole.DOCTOR}>Doctor</SelectItem>
                        <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateUser}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear Usuario
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Usuarios</CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{users.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Activos</CardTitle>
              <Users className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {users.filter(u => u.isActive).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Doctores</CardTitle>
              <Users className='h-4 w-4 text-blue-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {users.filter(u => u.role === UserRole.DOCTOR).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Cuentas con Usuarios</CardTitle>
              <Building2 className='h-4 w-4 text-purple-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {new Set(users.map(u => u.accountId)).size}
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
                  placeholder='Buscar por nombre, email, cuenta...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Rol' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos los roles</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                  <SelectItem value={UserRole.DOCTOR}>Doctor</SelectItem>
                  <SelectItem value={UserRole.ASSISTANT}>Asistente</SelectItem>
                  <SelectItem value={UserRole.USER}>Usuario</SelectItem>
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

        {/* Tabla de usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              {filteredUsers.length} de {users.length} usuarios mostrados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-muted-foreground'>Cargando usuarios...</div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => requestSort('firstName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Usuario</span>
                          {getSortIndicator('firstName') === 'asc' && <ChevronUp className="h-4 w-4" />}
                          {getSortIndicator('firstName') === 'desc' && <ChevronDown className="h-4 w-4" />}
                          {!getSortIndicator('firstName') && <ArrowUpDown className="h-4 w-4" />}
                        </div>
                      </TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => requestSort('role')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Rol</span>
                          {getSortIndicator('role') === 'asc' && <ChevronUp className="h-4 w-4" />}
                          {getSortIndicator('role') === 'desc' && <ChevronDown className="h-4 w-4" />}
                          {!getSortIndicator('role') && <ArrowUpDown className="h-4 w-4" />}
                        </div>
                      </TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => requestSort('createdAt')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Fecha de Creación</span>
                          {getSortIndicator('createdAt') === 'asc' && <ChevronUp className="h-4 w-4" />}
                          {getSortIndicator('createdAt') === 'desc' && <ChevronDown className="h-4 w-4" />}
                          {!getSortIndicator('createdAt') && <ArrowUpDown className="h-4 w-4" />}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className='font-medium'>
                              {user.firstName} {user.lastName}
                            </div>
                            <div className='text-sm text-muted-foreground'>
                              ID: {user.id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="mr-1 h-3 w-3" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Phone className="mr-1 h-3 w-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          {user.accountInfo ? (
                            <div>
                              <Link 
                                to="/accounts/$accountId" 
                                params={{ accountId: user.accountId }}
                                className="font-medium hover:underline text-primary text-sm"
                              >
                                {user.accountInfo.settings?.centerName || user.accountInfo.settings?.doctorName || 'Sin nombre'}
                              </Link>
                              <div className='text-xs text-muted-foreground'>
                                {user.accountInfo.email}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Cuenta no encontrada
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.isActive)}
                        </TableCell>
                        <TableCell>
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginación */}
                <DataTablePagination
                  totalItems={filteredUsers.length}
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
    title: 'Todos los Usuarios',
    href: '/users',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Por Rol',
    href: '/users/by-role',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Por Cuenta',
    href: '/users/by-account',
    isActive: false,
    disabled: true,
  },
]
