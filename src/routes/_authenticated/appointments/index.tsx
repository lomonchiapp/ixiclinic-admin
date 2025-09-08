import { createFileRoute } from '@tanstack/react-router'
import { AppointmentsManagement } from '@/features/appointments'

export const Route = createFileRoute('/_authenticated/appointments/')({
  component: AppointmentsManagement,
})
