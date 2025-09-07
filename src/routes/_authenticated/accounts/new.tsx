import { createFileRoute } from '@tanstack/react-router'
import { NewAccountForm } from '@/features/accounts/new-account-form'

export const Route = createFileRoute('/_authenticated/accounts/new')({
  component: NewAccountForm,
})