import { createFileRoute } from '@tanstack/react-router'
import { PatientsManagement } from '@/features/patients'

export const Route = createFileRoute('/_authenticated/patients/')({
  component: PatientsManagement,
})