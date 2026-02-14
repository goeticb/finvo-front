import invoiceFactoringAbi from '@/contracts/abi/InvoiceFactoringNew.json'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'

const normalizedAbi = Array.isArray(invoiceFactoringAbi)
  ? invoiceFactoringAbi
  : (invoiceFactoringAbi as { abi?: unknown }).abi ??
    (invoiceFactoringAbi as { default?: { abi?: unknown } }).default?.abi ??
    (invoiceFactoringAbi as { default?: unknown }).default ??
    []

export const INVOICE_FACTORING_ABI = normalizedAbi as const

export const invoiceFactoringAddress = CONTRACT_ADDRESSES.invoiceFactoring
