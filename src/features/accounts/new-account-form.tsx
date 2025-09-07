import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  CreditCard,
  Gift,
  Clock,
  Save
} from 'lucide-react'
import { firebaseAdminService } from '@/lib/firebase-admin'
import { usePlansStore } from '@/stores/plans-store'
import { toast } from 'sonner'
import type { PlanType } from 'ixiclinic-types/dist/admin-exports'
import { PLANS } from 'ixiclinic-types/dist/planConfigs'

const newAccountSchema = z.object({
  // Información básica
  email: z.string().email('Email inválido'),
  centerName: z.string().min(1, 'Nombre del centro es requerido'),
  doctorName: z.string().min(1, 'Nombre del doctor es requerido'),
  
  // Información de contacto
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string(),
  
  // Información fiscal
  rnc_cedula: z.string().optional(),
  
  // Tipo de cuenta
  accountType: z.enum(['personal', 'clinic', 'hospital']),
  
  // Configuración de membresía
  membershipType: z.enum(['trial', 'free', 'paid']),
  selectedPlan: z.string().optional(),
  trialDays: z.number().min(1).max(365),
  freeDays: z.number().min(1).max(365),
  
  // Firebase Auth
  assignFirebaseAuth: z.boolean(),
  firebaseEmail: z.string().optional(),
  
  // Configuración inicial
  createInitialUser: z.boolean(),
  initialUserEmail: z.string().optional(),
  initialUserName: z.string().optional(),
  
  // Notas administrativas
  adminNotes: z.string().optional(),
})

type NewAccountFormData = z.infer<typeof newAccountSchema>

export function NewAccountForm() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { plans } = usePlansStore()
  
  // Obtener planes base del paquete para mostrar información detallada
  const basePlans = Object.entries(PLANS)

  const form = useForm<NewAccountFormData>({
    resolver: zodResolver(newAccountSchema),
    defaultValues: {
      email: '',
      centerName: '',
      doctorName: '',
      phone: '',
      address: '',
      city: '',
      country: 'República Dominicana',
      rnc_cedula: '',
      accountType: 'personal',
      membershipType: 'trial',
      selectedPlan: '',
      trialDays: 30,
      freeDays: 90,
      assignFirebaseAuth: false,
      firebaseEmail: '',
      createInitialUser: true,
      initialUserEmail: '',
      initialUserName: '',
      adminNotes: '',
    }
  })

  const watchMembershipType = form.watch('membershipType')
  const watchAssignFirebaseAuth = form.watch('assignFirebaseAuth')
  const watchCreateInitialUser = form.watch('createInitialUser')
  const watchAccountType = form.watch('accountType')

  const getAvailablePlans = () => {
    // Usar planes base del paquete ixiclinic-types
    return basePlans
      .filter(([_, planConfig]) => planConfig.type === watchAccountType)
      .map(([key, planConfig]) => ({
        key,
        name: planConfig.name,
        price: planConfig.price,
        billing: planConfig.billing,
        type: planConfig.type,
        tier: planConfig.tier,
        limits: planConfig.limits,
        features: planConfig.features
      }))
  }

  const onSubmit = async (data: NewAccountFormData) => {
    try {
      setIsSubmitting(true)

      // Validaciones adicionales
      if (data.membershipType === 'paid' && !data.selectedPlan) {
        form.setError('selectedPlan', { message: 'Selecciona un plan para membresía pagada' })
        return
      }

      if (data.assignFirebaseAuth && !data.firebaseEmail) {
        form.setError('firebaseEmail', { message: 'Email de Firebase Auth es requerido' })
        return
      }

      if (data.createInitialUser && !data.initialUserEmail) {
        form.setError('initialUserEmail', { message: 'Email del usuario inicial es requerido' })
        return
      }

      if (data.createInitialUser && !data.initialUserName) {
        form.setError('initialUserName', { message: 'Nombre del usuario inicial es requerido' })
        return
      }

      // Crear la cuenta con configuración completa
      const accountData = {
        email: data.email,
        type: data.accountType as PlanType,
        isActive: true,
        settings: {
          centerName: data.centerName,
          doctorName: data.doctorName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          country: data.country,
          rnc_cedula: data.rnc_cedula,
          currency: {
            code: 'USD',
            symbol: '$',
            symbolPosition: 'before',
            decimalSeparator: '.',
            thousandsSeparator: ',',
            decimalPlaces: 2
          }
        },
        billingInfo: {
          paymentMethod: null,
          subscriptionStatus: data.membershipType === 'trial' ? 'trial' : 
                             data.membershipType === 'free' ? 'active' : 'pending',
          ...(data.membershipType === 'trial' && {
            trialStartDate: new Date(),
            trialEndDate: new Date(Date.now() + data.trialDays * 24 * 60 * 60 * 1000)
          }),
          ...(data.membershipType === 'free' && {
            trialStartDate: new Date(),
            trialEndDate: new Date(Date.now() + data.freeDays * 24 * 60 * 60 * 1000)
          }),
          ...(data.membershipType === 'paid' && data.selectedPlan && {
            plan: plans.find(p => p.name === data.selectedPlan)
          }),
          adminNotes: data.adminNotes || `Cuenta creada vía admin dashboard - ${data.membershipType}`
        }
      }

      const setupOptions = {
        assignFirebaseAuth: data.assignFirebaseAuth,
        firebaseEmail: data.firebaseEmail,
        createInitialUser: data.createInitialUser,
        initialUserData: data.createInitialUser ? {
          email: data.initialUserEmail,
          firstName: data.initialUserName?.split(' ')[0] || '',
          lastName: data.initialUserName?.split(' ').slice(1).join(' ') || '',
          role: 'admin',
          isActive: true,
          permissions: ['full_access']
        } : undefined
      }

      // Crear la cuenta con configuración completa
      const accountId = await firebaseAdminService.createAccountWithSetup(accountData, setupOptions)

      toast.success('Cuenta creada exitosamente')
      navigate({ to: `/accounts/${accountId}` })

    } catch (error) {
      console.error('Error creating account:', error)
      toast.error('Error al crear la cuenta')
    } finally {
      setIsSubmitting(false)
    }
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
          <div className='flex items-center space-x-4'>
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/accounts' })}
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Volver a Cuentas
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>Nueva Cuenta</h1>
              <p className='text-muted-foreground'>
                Crea una nueva cuenta de IxiClinic con configuración personalizada
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Información Básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5" />
                    Información Básica
                  </CardTitle>
                  <CardDescription>
                    Datos principales de la cuenta y el centro médico
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de la Cuenta *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="cuenta@ejemplo.com" />
                        </FormControl>
                        <FormDescription>
                          Email principal para la cuenta de IxiClinic
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="centerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Centro *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Clínica San Rafael" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="doctorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Doctor Principal *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Dr. Juan Pérez" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Cuenta *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="personal">Personal - Consultorio Individual</SelectItem>
                            <SelectItem value="clinic">Clínica - Centro Médico</SelectItem>
                            <SelectItem value="hospital">Hospital - Institución Grande</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Información de Contacto */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="mr-2 h-5 w-5" />
                    Información de Contacto
                  </CardTitle>
                  <CardDescription>
                    Datos de contacto y ubicación
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+1 809-555-0123" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Calle Principal #123" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Santo Domingo" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>País</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="rnc_cedula"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RNC/Cédula</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123-45678-9" />
                        </FormControl>
                        <FormDescription>
                          Número de identificación fiscal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Configuración de Membresía */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="mr-2 h-5 w-5" />
                  Configuración de Membresía
                </CardTitle>
                <CardDescription>
                  Define el tipo de acceso y plan para esta cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="membershipType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Membresía *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="trial">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              Trial - Período de prueba
                            </div>
                          </SelectItem>
                          <SelectItem value="free">
                            <div className="flex items-center">
                              <Gift className="mr-2 h-4 w-4" />
                              Gratuita - Acceso sin costo
                            </div>
                          </SelectItem>
                          <SelectItem value="paid">
                            <div className="flex items-center">
                              <CreditCard className="mr-2 h-4 w-4" />
                              Pagada - Plan de suscripción
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchMembershipType === 'trial' && (
                  <FormField
                    control={form.control}
                    name="trialDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración del Trial (días)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1" 
                            max="365"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Número de días para el período de prueba
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchMembershipType === 'free' && (
                  <FormField
                    control={form.control}
                    name="freeDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración Gratuita (días)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1" 
                            max="365"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Número de días de acceso gratuito
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchMembershipType === 'paid' && (
                  <FormField
                    control={form.control}
                    name="selectedPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Seleccionado *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getAvailablePlans().map((plan) => (
                              <SelectItem key={plan.key} value={plan.key}>
                                {plan.name} - {typeof plan.price === 'number' ? `$${plan.price.toFixed(2)}` : plan.price}
                                {plan.billing === 'monthly' ? '/mes' : '/año'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Plan que se asignará a la cuenta (sin procesar pago)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Configuración de Usuario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Configuración de Usuario
                </CardTitle>
                <CardDescription>
                  Configuración de acceso y usuarios iniciales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="assignFirebaseAuth"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Asignar Firebase Auth
                        </FormLabel>
                        <FormDescription>
                          Conectar esta cuenta con una cuenta de Firebase Auth existente
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchAssignFirebaseAuth && (
                  <FormField
                    control={form.control}
                    name="firebaseEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de Firebase Auth *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="usuario@ejemplo.com" />
                        </FormControl>
                        <FormDescription>
                          Email de la cuenta de Firebase Auth existente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Separator />

                <FormField
                  control={form.control}
                  name="createInitialUser"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Crear Usuario Inicial
                        </FormLabel>
                        <FormDescription>
                          Crear automáticamente el primer usuario del sistema
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchCreateInitialUser && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="initialUserEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email del Usuario *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="doctor@ejemplo.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="initialUserName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Dr. Juan Pérez" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notas Administrativas */}
            <Card>
              <CardHeader>
                <CardTitle>Notas Administrativas</CardTitle>
                <CardDescription>
                  Información adicional para referencia administrativa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="adminNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Razón de creación, contacto especial, observaciones..."
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription>
                        Estas notas solo son visibles para administradores
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/accounts' })}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    Creando Cuenta...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Crear Cuenta
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Nueva Cuenta',
    href: '/accounts/new',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Importar',
    href: '/accounts/import',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Plantillas',
    href: '/accounts/templates',
    isActive: false,
    disabled: true,
  },
]
