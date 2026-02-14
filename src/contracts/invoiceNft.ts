import invoiceNftAbi from '@/contracts/abi/InvoiceNFT.json'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'

const normalizedAbi = Array.isArray(invoiceNftAbi)
  ? invoiceNftAbi
  : (invoiceNftAbi as { abi?: unknown }).abi ??
    (invoiceNftAbi as { default?: { abi?: unknown } }).default?.abi ??
    (invoiceNftAbi as { default?: unknown }).default ??
    []

export const INVOICE_NFT_ABI = normalizedAbi as const

export const invoiceNftAddress = CONTRACT_ADDRESSES.invoiceNft
