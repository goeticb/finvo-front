import { useAccount } from 'wagmi'
import { Navigate, useNavigate } from 'react-router'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function KycRequiredPage() {
  const { isConnected } = useAccount()
  const navigate = useNavigate()

  if (!isConnected) {
    return <Navigate to="/connect" replace />
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-2">Registration Required</h1>
          <p className="text-gray-500 mb-6">
            To use Finvo's Web3 invoice platform, you need to complete your KYC and KYB verification.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              This one-time verification ensures the security and compliance of our platform
              for all users.
            </p>
          </div>

          <div className="text-left space-y-3 mb-8">
            <h3 className="font-medium text-gray-700">You'll need to provide:</h3>
            <ul className="text-sm text-gray-500 space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Personal identification (passport, ID card, or driver's license)
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Business registration details
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Company tax information
              </li>
            </ul>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/kyc')}
          >
            Start Verification
          </Button>
        </div>
      </Card>
    </div>
  )
}
