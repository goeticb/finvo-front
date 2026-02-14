import { useAccount, useDisconnect } from 'wagmi'
import { Navigate } from 'react-router'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function KycRejectedPage() {
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (!isConnected) {
    return <Navigate to="/connect" replace />
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-2">Verification Rejected</h1>
          <p className="text-gray-500 mb-6">
            Unfortunately, your KYC/KYB verification was not approved and you cannot use the Finvo platform at this time.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              If you believe this is an error, please contact our support team for assistance.
            </p>
          </div>

          <div className="text-left space-y-3 mb-8">
            <h3 className="font-medium text-gray-700">Common reasons for rejection:</h3>
            <ul className="text-sm text-gray-500 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">-</span>
                Invalid or expired identification documents
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">-</span>
                Incomplete or incorrect business information
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">-</span>
                Unable to verify provided information
              </li>
            </ul>
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => disconnect()}
          >
            Disconnect Wallet
          </Button>
        </div>
      </Card>
    </div>
  )
}
