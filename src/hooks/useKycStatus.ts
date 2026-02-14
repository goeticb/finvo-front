import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { getKycStatus, KycStatusResponse } from '@/services/api'

export function useKycStatus() {
  const { address, isConnected } = useAccount()

  const query = useQuery<KycStatusResponse>({
    queryKey: ['kycStatus', address],
    queryFn: () => getKycStatus(address!),
    enabled: isConnected && !!address,
  })

  const isApproved = query.data?.status === 'approved'
  const isSubmitted = query.data?.status === 'submitted'
  const isRejected = query.data?.status === 'rejected'
  const isNotFound = query.data?.error === 'not_found'

  return {
    ...query,
    isApproved,
    isSubmitted,
    isRejected,
    isNotFound,
  }
}
