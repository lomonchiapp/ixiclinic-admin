import { createFileRoute } from '@tanstack/react-router'
import { PlansAnalytics } from '@/features/analytics/plans-analytics'

export const Route = createFileRoute('/_authenticated/analytics/')({
  component: PlansAnalytics,
})




