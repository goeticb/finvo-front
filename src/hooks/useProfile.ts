import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { getProfile, ProfileResponse } from '@/services/api'

export function useProfile() {
  const { address, isConnected } = useAccount()

  return useQuery<ProfileResponse>({
    queryKey: ['profile', address],
    queryFn: () => getProfile(address!),
    enabled: isConnected && !!address,
  })
}
