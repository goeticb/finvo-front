import { useAccount } from 'wagmi'
import { Navigate } from 'react-router'
import { Card } from '@/components/ui/Card'

export function KycPendingPage() {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return <Navigate to="/connect" replace />
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-2">Verification in Progress</h1>
          <p className="text-gray-500 mb-6">
            Your KYC and KYB documents have been submitted and are currently under review.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              This process typically takes 1-2 business days. We'll notify you once your
              verification is complete.
            </p>
          </div>

          <div className="text-left space-y-3">
            <h3 className="font-medium text-gray-700">What happens next?</h3>
            <ul className="text-sm text-gray-500 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">1.</span>
                Our team reviews your submitted documents
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">2.</span>
                We verify your identity and business information
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">3.</span>
                Once approved, you'll have full access to Finvo
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
