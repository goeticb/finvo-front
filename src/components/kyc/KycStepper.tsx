import type { KycStep } from '@/types/kyc.types'

interface Props {
  currentStep: KycStep
}

const STEPS = [
  { id: 'personal', label: 'Personal KYC' },
  { id: 'company', label: 'Company KYB' },
  { id: 'complete', label: 'Complete' },
] as const

export function KycStepper({ currentStep }: Props) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm
                  transition-colors duration-200
                  ${index < currentIndex
                    ? 'bg-green-600 text-white'
                    : index === currentIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'}
                `}
              >
                {index < currentIndex ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`ml-3 text-sm font-medium hidden sm:block
                  ${index <= currentIndex ? 'text-gray-900' : 'text-gray-500'}`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 transition-colors duration-200
                  ${index < currentIndex ? 'bg-green-600' : 'bg-gray-200'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
