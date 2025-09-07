import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import {
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  Crown,
  Building,
  User,
  Activity
} from 'lucide-react'
// import { Badge } from '@/components/ui/badge' // No se usa en este componente
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { paypalService } from '@/lib/paypal-service'
import { PLANS } from 'ixiclinic-types/dist/planConfigs'

interface PlansAnalyticsData {
  planUsage: Record<string, number>
  totalSubscriptions: number
  activeSubscriptions: number
  problemSubscriptions: number
  monthlyRevenue: number
  revenueByPlan: Array<{ name: string; revenue: number; color: string; subscriptions: number }>
  subscriptionTrends: Array<{ month: string; subscriptions: number; revenue: number }>
}

const COLORS = ['#00a99d', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

export function PlansAnalytics() {
  const [data, setData] = useState<PlansAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Obtener métricas de PayPal
      const metrics = await paypalService.getPlansUsageMetrics()
      
      // Procesar datos para gráficos
      const revenueByPlan = Object.entries(metrics.planUsage).map(([planId, count], index) => {
        // Buscar información del plan en ixiclinic-types
        const planInfo = Object.entries(PLANS).find(([_, config]) => 
          planId.includes(config.name.toLowerCase().replace(/\s+/g, '-'))
        )
        
        const planName = planInfo ? planInfo[1].name : planId
        const planPrice = planInfo && typeof planInfo[1].price === 'number' ? planInfo[1].price : 0
        
        return {
          name: planName,
          revenue: count * planPrice,
          color: COLORS[index % COLORS.length],
          subscriptions: count
        }
      })
      
      // Generar datos de tendencias (simulado para demo)
      const subscriptionTrends = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000)
        return {
          month: month.toLocaleDateString('es-ES', { month: 'short' }),
          subscriptions: Math.floor(Math.random() * 50) + 20,
          revenue: Math.floor(Math.random() * 5000) + 2000
        }
      })
      
      setData({
        ...metrics,
        revenueByPlan,
        subscriptionTrends
      })
      
      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('Error cargando analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analíticas de Planes</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Error cargando datos</h3>
          <p className="text-muted-foreground">No se pudieron cargar las analíticas</p>
          <Button onClick={loadAnalytics} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('personal')) return <User className="h-4 w-4" />
    if (planName.toLowerCase().includes('clinic')) return <Building className="h-4 w-4" />
    if (planName.toLowerCase().includes('hospital')) return <Crown className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analíticas de Planes</h1>
          <p className="text-muted-foreground">
            Métricas de uso y rendimiento de los planes de suscripción
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Actualizado: {lastUpdated.toLocaleTimeString('es-ES')}
            </p>
          )}
          <Button onClick={loadAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suscripciones</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Todas las suscripciones activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {((data.activeSubscriptions / data.totalSubscriptions) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Problemas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{data.problemSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresos recurrentes estimados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribución de Planes */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Planes</CardTitle>
            <CardDescription>
              Número de suscripciones por tipo de plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.revenueByPlan}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="subscriptions"
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                >
                  {data.revenueByPlan.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} suscripciones`, 'Cantidad']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ingresos por Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Plan</CardTitle>
            <CardDescription>
              Ingresos mensuales generados por cada plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueByPlan}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Ingresos']}
                />
                <Bar dataKey="revenue" fill="#00a99d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tendencias */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencias de Suscripciones</CardTitle>
          <CardDescription>
            Evolución de suscripciones e ingresos en los últimos 12 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data.subscriptionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="subscriptions" fill="#00a99d" name="Suscripciones" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="Ingresos ($)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detalles por Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles por Plan</CardTitle>
          <CardDescription>
            Información detallada de cada plan de suscripción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.revenueByPlan.map((plan, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getPlanIcon(plan.name)}
                  <div>
                    <h4 className="font-medium">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {plan.subscriptions} suscripciones activas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    ${plan.revenue.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">ingresos mensuales</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
