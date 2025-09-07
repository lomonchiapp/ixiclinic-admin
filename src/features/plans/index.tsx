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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import {
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Settings,
  Edit,
  Save,
  X,
  Users,
  Building,
  Crown
} from 'lucide-react'
import { usePlansStore } from '@/stores/plans-store'
import { usePayPalStore } from '@/stores/paypal-store'
import type { PlanType, PlanTier } from 'ixiclinic-types/dist/admin-exports'
import { PLANS } from 'ixiclinic-types/dist/planConfigs'

// Función para obtener el icono según el tipo de plan
const getPlanIcon = (type: PlanType) => {
  switch (type) {
    case 'personal':
      return <Users className="h-5 w-5" />
    case 'clinic':
      return <Building className="h-5 w-5" />
    case 'hospital':
      return <Crown className="h-5 w-5" />
    default:
      return <Users className="h-5 w-5" />
  }
}

export function PlansManagement() {
  const {
    plans,
    pricingSync,
    pricingConfig,
    isLoading,
    syncPlansFromPayPal,
    syncPlansFromFirebase,
    updatePlanPricing,
    getPlansByType
  } = usePlansStore()

  const { paypalPlans, fetchPayPalPlans } = usePayPalStore()

  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<string>('')
  const [syncDialog, setSyncDialog] = useState(false)

  useEffect(() => {
    fetchPayPalPlans()
  }, [fetchPayPalPlans])

  const handlePriceEdit = (planName: string, currentPrice: number) => {
    setEditingPlan(planName)
    setEditPrice(currentPrice.toString())
  }

  const handlePriceSave = async (planName: string) => {
    try {
      const newPrice = parseFloat(editPrice)
      if (isNaN(newPrice) || newPrice <= 0) {
        alert('Por favor ingresa un precio válido')
        return
      }
      
      await updatePlanPricing(planName, newPrice)
      setEditingPlan(null)
      setEditPrice('')
    } catch (error) {
      console.error('Error updating price:', error)
      alert('Error al actualizar el precio')
    }
  }

  const handlePriceCancel = () => {
    setEditingPlan(null)
    setEditPrice('')
  }

  const getSyncStatusBadge = () => {
    const statusConfig = {
      'synced': { variant: 'default' as const, icon: CheckCircle, label: 'Sincronizado' },
      'out_of_sync': { variant: 'destructive' as const, icon: AlertTriangle, label: 'Desincronizado' },
      'error': { variant: 'destructive' as const, icon: X, label: 'Error' }
    }

    const config = statusConfig[pricingSync.status] || statusConfig.error
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPlanTypeIcon = (type: PlanType) => {
    const icons = {
      personal: Users,
      clinic: Building,
      hospital: Crown
    }
    return icons[type] || Users
  }

  const formatCurrency = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: pricingConfig.currency
    }).format(numPrice)
  }

  const formatBillingCycle = (billing: string) => {
    const cycles = {
      monthly: 'Mensual',
      quarterly: 'Trimestral', 
      annual: 'Anual',
      permanent: 'Permanente'
    }
    return cycles[billing as keyof typeof cycles] || billing
  }

  const formatTier = (tier: PlanTier) => {
    const tiers = {
      free: 'Gratuito',
      basic: 'Básico',
      professional: 'Profesional',
      enterprise: 'Empresarial'
    }
    return tiers[tier] || tier
  }

  const formatType = (type: PlanType) => {
    const types = {
      personal: 'Personal',
      clinic: 'Clínica',
      hospital: 'Hospital'
    }
    return types[type] || type
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
            <h1 className='text-2xl font-bold tracking-tight'>Gestión de Planes y Precios</h1>
            <p className='text-muted-foreground'>
              Administra los planes de suscripción y sincroniza precios con PayPal
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Dialog open={syncDialog} onOpenChange={setSyncDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Sincronizar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sincronizar Precios</DialogTitle>
                  <DialogDescription>
                    Elige la fuente desde la cual sincronizar los precios de los planes.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Button 
                    onClick={() => {
                      syncPlansFromPayPal()
                      setSyncDialog(false)
                    }}
                    className="w-full"
                    disabled={isLoading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizar desde PayPal
                  </Button>
                  <Button 
                    onClick={() => {
                      syncPlansFromFirebase()
                      setSyncDialog(false)
                    }}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizar desde Firebase
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estado de Sincronización */}
        <Alert className="mb-6">
          <Settings className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Estado de Sincronización
            {getSyncStatusBadge()}
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              <p><strong>Última sincronización:</strong> {
                pricingSync.lastSync 
                  ? new Date(pricingSync.lastSync).toLocaleString('es-ES')
                  : 'Nunca'
              }</p>
              <p><strong>Fuente:</strong> {
                pricingSync.source === 'paypal' ? 'PayPal' :
                pricingSync.source === 'firebase' ? 'Firebase' : 'Manual'
              }</p>
              <p><strong>Versión:</strong> {pricingSync.version}</p>
            </div>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList>
            <TabsTrigger value="plans">Planes Actuales</TabsTrigger>
            <TabsTrigger value="paypal">Planes PayPal</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            {/* Estadísticas */}
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total Planes</CardTitle>
                  <TrendingUp className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{plans.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Planes Personal</CardTitle>
                  <Users className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {getPlansByType('personal' as PlanType).length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Planes Clínica</CardTitle>
                  <Building className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {getPlansByType('clinic' as PlanType).length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Planes Hospital</CardTitle>
                  <Crown className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {getPlansByType('hospital' as PlanType).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuración Base de Planes */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración Base (ixiclinic-types)</CardTitle>
                <CardDescription>
                  Planes definidos en el paquete compartido - Fuente de verdad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(PLANS).map(([key, planConfig]) => (
                    <Card key={key} className={`relative ${'popular' in planConfig && planConfig.popular ? 'ring-2 ring-primary' : ''}`}>
                      {'popular' in planConfig && planConfig.popular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            Popular
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{planConfig.name}</CardTitle>
                          {getPlanIcon(planConfig.type)}
                        </div>
                        <div className="text-2xl font-bold">
                          {typeof planConfig.price === 'number' ? `$${planConfig.price.toFixed(2)}` : planConfig.price}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{planConfig.billing === 'monthly' ? 'mes' : 'año'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div>
                          <div className="text-sm font-medium mb-1">Límites:</div>
                          <div className="text-xs space-y-1">
                            <div>• Pacientes: {planConfig.limits.patients === -1 ? 'Ilimitados' : planConfig.limits.patients.toLocaleString()}</div>
                            <div>• Usuarios: {planConfig.limits.users === -1 ? 'Ilimitados' : planConfig.limits.users}</div>
                            <div>• Storage: {planConfig.limits.storage === -1 ? 'Ilimitado' : `${planConfig.limits.storage} GB`}</div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-1">Características:</div>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            <div className={planConfig.features.appointments ? 'text-green-600' : 'text-gray-400'}>
                              {planConfig.features.appointments ? '✓' : '✗'} Citas
                            </div>
                            <div className={planConfig.features.billing ? 'text-green-600' : 'text-gray-400'}>
                              {planConfig.features.billing ? '✓' : '✗'} Facturación
                            </div>
                            <div className={planConfig.features.insurance ? 'text-green-600' : 'text-gray-400'}>
                              {planConfig.features.insurance ? '✓' : '✗'} Seguros
                            </div>
                            <div className={planConfig.features.inventory ? 'text-green-600' : 'text-gray-400'}>
                              {planConfig.features.inventory ? '✓' : '✗'} Inventario
                            </div>
                            <div className={planConfig.features.reports ? 'text-green-600' : 'text-gray-400'}>
                              {planConfig.features.reports ? '✓' : '✗'} Reportes
                            </div>
                            <div className={planConfig.features.api ? 'text-green-600' : 'text-gray-400'}>
                              {planConfig.features.api ? '✓' : '✗'} API
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {planConfig.type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {planConfig.tier}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Planes */}
            <Card>
              <CardHeader>
                <CardTitle>Planes Generados (Todos los Ciclos)</CardTitle>
                <CardDescription>
                  Planes con diferentes ciclos de facturación y descuentos aplicados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Facturación</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Límites</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => {
                      const Icon = getPlanTypeIcon(plan.type)
                      return (
                        <TableRow key={plan.name}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{plan.name}</div>
                                {plan.popular && (
                                  <Badge variant="secondary" className="text-xs">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatType(plan.type)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{formatTier(plan.tier)}</Badge>
                          </TableCell>
                          <TableCell>{formatBillingCycle(plan.billing)}</TableCell>
                          <TableCell>
                            {editingPlan === plan.name ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-24"
                                  step="0.01"
                                />
                                <Button 
                                  size="sm" 
                                  onClick={() => handlePriceSave(plan.name)}
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={handlePriceCancel}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">
                                  {formatCurrency(plan.price)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handlePriceEdit(plan.name, typeof plan.price === 'number' ? plan.price : parseFloat(plan.price))}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div>Pacientes: {plan.limits.patients === -1 ? 'Ilimitados' : plan.limits.patients}</div>
                              <div>Usuarios: {plan.limits.users}</div>
                              <div>Almacenamiento: {plan.limits.storage}GB</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <Settings className="h-3 w-3 mr-1" />
                              Configurar
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paypal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Planes en PayPal</CardTitle>
                <CardDescription>
                  Planes configurados directamente en PayPal
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paypalPlans.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No se han cargado planes de PayPal</p>
                    <Button onClick={() => fetchPayPalPlans()} className="mt-4">
                      Cargar Planes de PayPal
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID PayPal</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Frecuencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paypalPlans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-mono text-sm">{plan.id}</TableCell>
                          <TableCell>{plan.name}</TableCell>
                          <TableCell>
                            <Badge variant={plan.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {plan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {plan.billing_cycles[0] && formatCurrency(plan.billing_cycles[0].pricing_scheme.fixed_price.value)}
                          </TableCell>
                          <TableCell>
                            {plan.billing_cycles[0] && 
                             `${plan.billing_cycles[0].frequency.interval_count} ${plan.billing_cycles[0].frequency.interval_unit.toLowerCase()}`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Precios</CardTitle>
                <CardDescription>
                  Ajusta la configuración global de precios y descuentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Moneda</Label>
                    <Input
                      id="currency"
                      value={pricingConfig.currency}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxRate">Tasa de Impuesto (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={pricingConfig.taxRate}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Descuento Anual (%)</Label>
                  <Input
                    type="number"
                    value={pricingConfig.discountRules.annual}
                    readOnly
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Descuento aplicado a planes anuales
                  </p>
                </div>

                <div>
                  <Label>Descuentos por Volumen</Label>
                  <div className="mt-2 space-y-2">
                    {pricingConfig.discountRules.volume.map((rule, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <span>Desde {rule.minUsers} usuarios:</span>
                        <span className="font-medium">{rule.discount}% de descuento</span>
                      </div>
                    ))}
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
    title: 'Planes Actuales',
    href: '/plans',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Configuración PayPal',
    href: '/plans/paypal',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Historial de Cambios',
    href: '/plans/history',
    isActive: false,
    disabled: true,
  },
]
