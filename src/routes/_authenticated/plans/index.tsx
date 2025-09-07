import { createFileRoute } from '@tanstack/react-router'
import { PlansManagement } from '@/features/plans'

export const Route = createFileRoute('/_authenticated/plans/')({
  component: PlansManagement,
})