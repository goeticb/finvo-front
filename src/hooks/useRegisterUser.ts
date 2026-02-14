import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { registerUser, RegisterUserPayload } from '@/services/api'
import type { PersonalKycData, CompanyKybData } from '@/types/kyc.types'

interface RegisterData {
  personalData: PersonalKycData
  companyData: CompanyKybData
}

export function useRegisterUser() {
  const { address } = useAccount()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ personalData, companyData }: RegisterData) => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      const payload: RegisterUserPayload = {
        onChainAddress: address,
        kyc: {
          firstName: personalData.firstName,
          lastName: personalData.lastName,
          email: personalData.email,
          dateOfBirth: personalData.dateOfBirth,
          countryOfResidence: personalData.country,
          nationality: personalData.nationality,
          idType: personalData.idType,
          idNumber: personalData.idNumber,
        },
        kyb: {
          companyName: companyData.companyName,
          registrationNumber: companyData.registrationNumber,
          taxId: companyData.taxId,
          country: companyData.country,
          companyType: companyData.companyType.toUpperCase(),
          incorporationDate: companyData.incorporationDate,
          businessAddress: companyData.businessAddress,
          website: companyData.website || undefined,
        },
      }

      return registerUser(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycStatus', address] })
    },
  })
}
