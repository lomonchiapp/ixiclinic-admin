import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download
} from 'lucide-react'
import { firebaseAdminService } from '@/lib/firebase-admin'
import type { AdminMetrics, SystemAlert } from 'ixiclinic-types/dist/admin-exports'

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
    loadAlerts()
  }, [])

  const loadMetrics = async () => {
    try {
      const metricsData = await firebaseAdminService.getAdminMetrics()
      setMetrics(metricsData)
    } catch (error) {
      console.error('Error loading metrics:', error)
    }
  }

  const loadAlerts = async () => {
    try {
      const alertsData = await firebaseAdminService.getSystemAlerts()
      setAlerts(alertsData)
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className='h-5 w-5 text-green-500' />
      case 'warning':
        return <AlertTriangle className='h-5 w-5 text-yellow-500' />
      case 'critical':
        return <XCircle className='h-5 w-5 text-red-500' />
      default:
        return <Activity className='h-5 w-5 text-gray-500' />
    }
  }

  const getAlertIcon = (_type: string, severity: string) => {
    const severityColors = {
      low: 'text-blue-500',
      medium: 'text-yellow-500',
      high: 'text-orange-500',
      critical: 'text-red-500'
    }

    return (
      <AlertTriangle 
        className={`h-4 w-4 ${severityColors[severity as keyof typeof severityColors] || 'text-gray-500'}`} 
      />
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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
            <div className='text-muted-foreground'>Cargando métricas...</div>
          </div>
        </Main>
      </>
    )
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
            <h1 className='text-2xl font-bold tracking-tight'>Métricas del Sistema</h1>
            <p className='text-muted-foreground'>
              Monitoreo en tiempo real del estado de IxiClinic
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant="outline">
              <Download className='mr-2 h-4 w-4' />
              Exportar Reporte
            </Button>
          </div>
        </div>

        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Resumen General</TabsTrigger>
            <TabsTrigger value='performance'>Rendimiento</TabsTrigger>
            <TabsTrigger value='alerts'>Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-4'>
            {/* Estado del Sistema */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-lg font-semibold'>Estado del Sistema</CardTitle>
                <div className='flex items-center space-x-2'>
                  {getHealthIcon(metrics?.systemHealth || 'healthy')}
                  <span className='text-sm font-medium capitalize'>
                    {metrics?.systemHealth === 'healthy' ? 'Saludable' : 
                     metrics?.systemHealth === 'warning' ? 'Advertencia' : 'Crítico'}
                  </span>
                </div>
              </CardHeader>
            </Card>

            {/* Métricas Principales */}
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total de Cuentas</CardTitle>
                  <Building2 className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{metrics?.totalAccounts || 0}</div>
                  <p className='text-xs text-muted-foreground'>
                    <TrendingUp className='mr-1 inline h-3 w-3' />
                    +12% desde el mes pasado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Suscripciones Activas</CardTitle>
                  <TrendingUp className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{metrics?.activeSubscriptions || 0}</div>
                  <p className='text-xs text-muted-foreground'>
                    <TrendingUp className='mr-1 inline h-3 w-3' />
                    +8% desde el mes pasado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Ingresos Mensuales</CardTitle>
                  <DollarSign className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{formatCurrency(metrics?.monthlyRevenue || 0)}</div>
                  <p className='text-xs text-muted-foreground'>
                    <TrendingUp className='mr-1 inline h-3 w-3' />
                    +15% desde el mes pasado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Trials Activos</CardTitle>
                  <Clock className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{metrics?.trialAccounts || 0}</div>
                  <p className='text-xs text-muted-foreground'>
                    <TrendingDown className='mr-1 inline h-3 w-3' />
                    -5% desde el mes pasado
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Métricas de Actividad */}
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total de Pacientes</CardTitle>
                  <Users className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{metrics?.totalPatients || 0}</div>
                  <p className='text-xs text-muted-foreground'>
                    Registrados en todas las cuentas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total de Citas</CardTitle>
                  <Activity className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{metrics?.totalAppointments || 0}</div>
                  <p className='text-xs text-muted-foreground'>
                    Programadas este mes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Prescripciones</CardTitle>
                  <Activity className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{metrics?.totalPrescriptions || 0}</div>
                  <p className='text-xs text-muted-foreground'>
                    Emitidas este mes
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='alerts' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Alertas del Sistema</CardTitle>
                <CardDescription>
                  {alerts.length} alertas activas requieren atención
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-8 text-center'>
                    <CheckCircle className='h-12 w-12 text-green-500 mb-4' />
                    <h3 className='text-lg font-medium'>¡Todo está funcionando bien!</h3>
                    <p className='text-muted-foreground'>No hay alertas activas en este momento.</p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className='flex items-start space-x-3 rounded-lg border p-4'
                      >
                        {getAlertIcon(alert.type, alert.severity)}
                        <div className='flex-1 space-y-1'>
                          <div className='flex items-center justify-between'>
                            <h4 className='text-sm font-medium'>{alert.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              alert.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                              alert.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                              alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            }`}>
                              {alert.severity === 'critical' ? 'Crítica' :
                               alert.severity === 'high' ? 'Alta' :
                               alert.severity === 'medium' ? 'Media' : 'Baja'}
                            </span>
                          </div>
                          <p className='text-sm text-muted-foreground'>{alert.description}</p>
                          <div className='flex items-center justify-between text-xs text-muted-foreground'>
                            <span>Tipo: {alert.type}</span>
                            <span>{new Date(alert.createdAt).toLocaleString('es-ES')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
    title: 'Resumen General',
    href: '/metrics',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Rendimiento',
    href: '/metrics/performance',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Reportes',
    href: '/metrics/reports',
    isActive: false,
    disabled: true,
  },
]
