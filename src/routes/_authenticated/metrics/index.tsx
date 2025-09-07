import { createFileRoute } from '@tanstack/react-router'
import { MetricsDashboard } from '@/features/metrics'

export const Route = createFileRoute('/_authenticated/metrics/')({
  component: MetricsDashboard,
})

