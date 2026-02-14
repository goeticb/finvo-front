import { useState, useCallback } from 'react'
import type { KycState, PersonalKycData, CompanyKybData } from '@/types/kyc.types'

export function useKycForm() {
  const [state, setState] = useState<KycState>({
    currentStep: 'personal',
    personalData: null,
    companyData: null,
  })

  const submitPersonalKyc = useCallback((data: PersonalKycData) => {
    setState(prev => ({
      ...prev,
      personalData: data,
      currentStep: 'company',
    }))
  }, [])

  const submitCompanyKyb = useCallback((data: CompanyKybData) => {
    setState(prev => ({
      ...prev,
      companyData: data,
      currentStep: 'complete',
    }))
  }, [])

  const goBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep === 'company' ? 'personal' : prev.currentStep,
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      currentStep: 'personal',
      personalData: null,
      companyData: null,
    })
  }, [])

  return {
    ...state,
    submitPersonalKyc,
    submitCompanyKyb,
    goBack,
    reset,
  }
}
