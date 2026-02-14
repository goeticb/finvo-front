import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import type { PersonalKycData, CompanyKybData } from '@/types/kyc.types'

interface Props {
  personalData: PersonalKycData | null
  companyData: CompanyKybData | null
  onReset: () => void
}

export function KycComplete({ personalData, companyData, onReset }: Props) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold mb-2">KYC/KYB Complete!</h2>
      <p className="text-gray-500 mb-8">
        Your verification information has been submitted successfully.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <p className="text-amber-800 text-sm">
          <strong>Note:</strong> This is a mock KYC flow for hackathon demonstration purposes.
          No actual verification is performed.
        </p>
      </div>

      {personalData && (
        <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-2">Personal Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="text-gray-400">Name:</span> {personalData.firstName} {personalData.lastName}</p>
            <p><span className="text-gray-400">Email:</span> {personalData.email}</p>
            <p><span className="text-gray-400">ID Type:</span> {personalData.idType.replace('_', ' ')}</p>
          </div>
        </div>
      )}

      {companyData && (
        <div className="text-left bg-gray-50 rounded-lg p-4 mb-8">
          <h3 className="font-semibold mb-2">Company Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="text-gray-400">Company:</span> {companyData.companyName}</p>
            <p><span className="text-gray-400">Type:</span> {companyData.companyType.toUpperCase()}</p>
            <p><span className="text-gray-400">Tax ID:</span> {companyData.taxId}</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <Button variant="secondary" onClick={onReset}>
          Start Over
        </Button>
        <Link to="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
