import { useAccount } from 'wagmi'
import { Navigate } from 'react-router'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import { Card } from '@/components/ui/Card'
import { useKycStatus } from '@/hooks/useKycStatus'

export function ConnectPage() {
  const { isConnected } = useAccount()
  const { isApproved, isSubmitted, isRejected, isNotFound, isLoading } = useKycStatus()

  if (isConnected) {
    if (isLoading) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center">
          <Card className="max-w-md w-full">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Checking verification status...</p>
            </div>
          </Card>
        </div>
      )
    }

    if (isApproved) {
      return <Navigate to="/dashboard" replace />
    }

    if (isSubmitted) {
      return <Navigate to="/kyc-pending" replace />
    }

    if (isRejected) {
      return <Navigate to="/kyc-rejected" replace />
    }

    if (isNotFound) {
      return <Navigate to="/kyc-required" replace />
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Finvo</h1>
          <p className="text-gray-500">
            Connect your wallet to access the Web3 invoice platform on Tempo blockchain.
          </p>
        </div>

        <ConnectButton />

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-sm text-gray-700 mb-3">Network Info</h3>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Network:</span>
              <span className="text-gray-700">Tempo Testnet (Moderato)</span>
            </div>
            <div className="flex justify-between">
              <span>Chain ID:</span>
              <span className="font-mono text-gray-700">42431</span>
            </div>
            <div className="flex justify-between">
              <span>RPC:</span>
              <span className="font-mono text-gray-700 text-xs">rpc.moderato.tempo.xyz</span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> If you don't have the Tempo network configured,
            your wallet will prompt you to add it automatically.
          </p>
        </div>
      </Card>
    </div>
  )
}
