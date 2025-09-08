import {
  LayoutDashboard,
  Monitor,
  Bell,
  Settings,
  Wrench,
  UserCog,
  Users,
  Building2,
  CreditCard,
  Calendar,
  BarChart3,
  AlertTriangle,
  Stethoscope,
  Shield,
  Database,
  Activity,
  TrendingUp,
  UserCheck,
  Clock,
  PieChart,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Admin IxiClinic',
    email: 'admin@ixiclinic.com',
    avatar: '/images/logo.png',
  },
  teams: [
    {
      name: 'IxiClinic Admin',
      logo: Stethoscope,
      plan: 'Panel Administrativo',
    },
  ],
  navGroups: [
    {
      title: 'Panel Principal',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Métricas',
          url: '/metrics',
          icon: BarChart3,
        },
        {
          title: 'Analíticas de Planes',
          url: '/analytics',
          icon: PieChart,
        },
        {
          title: 'Alertas del Sistema',
          url: '/alerts',
          icon: AlertTriangle,
          badge: '2',
        },
      ],
    },
    {
      title: 'Gestión de Cuentas',
      items: [
        {
          title: 'Cuentas',
          url: '/accounts',
          icon: Building2,
        },
        {
          title: 'Usuarios',
          url: '/users',
          icon: UserCheck,
        },
      ],
    },
    {
      title: 'Datos Médicos',
      items: [
        {
          title: 'Pacientes',
          url: '/patients',
          icon: Users,
        },
        {
          title: 'Citas',
          url: '/appointments',
          icon: Calendar,
        },
        {
          title: 'Facturas',
          url: '/invoices',
          icon: CreditCard,
        },
        {
          title: 'Actividad Médica',
          url: '/medical-activity',
          icon: Activity,
        },
      ],
    },
    {
      title: 'Administración',
      items: [
        {
          title: 'Planes y Límites',
          url: '/plans',
          icon: TrendingUp,
        },
        {
          title: 'Base de Datos',
          url: '/database',
          icon: Database,
        },
        {
          title: 'Configuración',
          icon: Settings,
          items: [
            {
              title: 'Perfil',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Sistema',
              url: '/settings/system',
              icon: Wrench,
            },
            {
              title: 'Notificaciones',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Apariencia',
              url: '/settings/appearance',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Seguridad',
          url: '/security',
          icon: Shield,
        },
      ],
    },
  ],
}
