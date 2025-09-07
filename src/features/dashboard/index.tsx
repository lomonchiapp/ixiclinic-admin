import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Overview } from './components/overview'
import { RecentSales } from './components/recent-sales'
import { 
  Building2, 
  Users, 
  Activity, 
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react'

export function Dashboard() {
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
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Dashboard Administrativo</h1>
            <p className='text-muted-foreground'>Panel de control para la administración de IxiClinic</p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button>Exportar Reporte</Button>
          </div>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>Resumen General</TabsTrigger>
              <TabsTrigger value='analytics' disabled>
                Analíticas
              </TabsTrigger>
              <TabsTrigger value='reports' disabled>
                Reportes
              </TabsTrigger>
              <TabsTrigger value='notifications' disabled>
                Notificaciones
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total de Cuentas
                  </CardTitle>
                  <Building2 className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>1,247</div>
                  <p className='text-muted-foreground text-xs'>
                    +12% desde el mes pasado
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Suscripciones Activas
                  </CardTitle>
                  <TrendingUp className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>892</div>
                  <p className='text-muted-foreground text-xs'>
                    +8.2% desde el mes pasado
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Pacientes Totales
                  </CardTitle>
                  <Users className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>18,456</div>
                  <p className='text-muted-foreground text-xs'>
                    +24% desde el mes pasado
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Trials Activos
                  </CardTitle>
                  <Clock className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>156</div>
                  <p className='text-muted-foreground text-xs'>
                    +32 nuevos esta semana
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Crecimiento Mensual</CardTitle>
                  <CardDescription>
                    Evolución de cuentas y suscripciones en los últimos 12 meses
                  </CardDescription>
                </CardHeader>
                <CardContent className='ps-2'>
                  <Overview />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Nuevas Cuentas</CardTitle>
                  <CardDescription>
                    Se registraron 23 nuevas cuentas este mes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales />
                </CardContent>
              </Card>
            </div>
            
            {/* Alertas del Sistema */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <Card className='border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'>
                <CardHeader className='flex flex-row items-center space-y-0 pb-2'>
                  <AlertTriangle className='h-4 w-4 text-orange-600' />
                  <CardTitle className='ml-2 text-sm font-medium text-orange-800 dark:text-orange-200'>
                    Alertas del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='text-sm'>
                      <span className='font-medium'>2 cuentas</span> próximas a vencer su trial
                    </div>
                    <div className='text-sm'>
                      <span className='font-medium'>5 cuentas</span> excedieron el 90% de su límite de almacenamiento
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Actividad Reciente
                  </CardTitle>
                  <Activity className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='text-sm'>
                      <span className='font-medium'>3,247</span> citas programadas hoy
                    </div>
                    <div className='text-sm'>
                      <span className='font-medium'>89</span> nuevos pacientes registrados
                    </div>
                    <div className='text-sm'>
                      <span className='font-medium'>156</span> prescripciones emitidas
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Resumen',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Cuentas',
    href: 'dashboard/accounts',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Suscripciones',
    href: 'dashboard/subscriptions',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Configuración',
    href: 'dashboard/settings',
    isActive: false,
    disabled: true,
  },
]
