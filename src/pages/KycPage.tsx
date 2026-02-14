import { useNavigate } from 'react-router'
import { Card } from '@/components/ui/Card'
import { KycStepper } from '@/components/kyc/KycStepper'
import { PersonalKycForm } from '@/components/kyc/PersonalKycForm'
import { CompanyKybForm } from '@/components/kyc/CompanyKybForm'
import { useKycForm } from '@/hooks/useKycForm'
import { useRegisterUser } from '@/hooks/useRegisterUser'
import type { CompanyKybData } from '@/types/kyc.types'

export function KycPage() {
  const navigate = useNavigate()
  const {
    currentStep,
    personalData,
    companyData,
    submitPersonalKyc,
    goBack,
  } = useKycForm()

  const registerMutation = useRegisterUser()

  const handleCompanySubmit = async (data: CompanyKybData) => {
    if (!personalData) return

    try {
      await registerMutation.mutateAsync({
        personalData,
        companyData: data,
      })
      navigate('/kyc-pending', { replace: true })
    } catch (error) {
      console.error('Registration failed:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Identity Verification</h1>
        <p className="text-gray-500 mt-1">
          Complete the KYC/KYB process to access all platform features.
        </p>
      </div>

      <Card>
        <KycStepper currentStep={currentStep} />

        {currentStep === 'personal' && (
          <PersonalKycForm
            onSubmit={submitPersonalKyc}
            defaultValues={personalData ?? undefined}
          />
        )}

        {currentStep === 'company' && (
          <CompanyKybForm
            onSubmit={handleCompanySubmit}
            onBack={goBack}
            defaultValues={companyData ?? undefined}
            isSubmitting={registerMutation.isPending}
          />
        )}

        {registerMutation.isError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Registration failed. Please try again.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
