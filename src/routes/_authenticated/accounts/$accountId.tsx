import { createFileRoute } from '@tanstack/react-router'
import { AccountDetails } from '@/features/accounts/account-details'

export const Route = createFileRoute('/_authenticated/accounts/$accountId')({
  component: AccountDetails,
})