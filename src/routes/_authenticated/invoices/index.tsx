import { createFileRoute } from '@tanstack/react-router'
import { InvoicesManagement } from '@/features/invoices'

export const Route = createFileRoute('/_authenticated/invoices/')({
  component: InvoicesManagement,
})
