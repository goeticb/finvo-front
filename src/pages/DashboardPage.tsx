import { AccountInfo } from '@/components/wallet/AccountInfo'
import { BalanceDisplay } from '@/components/wallet/BalanceDisplay'
import { TempoActions } from '@/components/wallet/TempoActions'
import { DashboardLoader } from '@/components/ui/DashboardLoader'
import { useProfile } from '@/hooks/useProfile'

export function DashboardPage() {
  const { data, isLoading, isFetching, status } = useProfile()
  const isProfileLoading = !data && (isLoading || isFetching || status === 'pending')

  if (isProfileLoading) {
    return <DashboardLoader />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your Tempo wallet and interactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountInfo />
        <BalanceDisplay />
      </div>

      <TempoActions />
    </div>
  )
}
