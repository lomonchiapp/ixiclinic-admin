import { createFileRoute } from '@tanstack/react-router'
import { SubscriptionsManagement } from '@/features/subscriptions'

export const Route = createFileRoute('/_authenticated/subscriptions/')({
  component: SubscriptionsManagement,
})