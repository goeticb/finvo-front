import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { getInvoicesByAddress, type InvoicesByAddressData } from '@/services/api'

export function useInvoicesByAddress() {
  const { address, isConnected } = useAccount()

  return useQuery<InvoicesByAddressData>({
    queryKey: ['invoicesByAddress', address],
    queryFn: ({ signal }) => getInvoicesByAddress(address!, signal),
    enabled: isConnected && !!address,
  })
}
