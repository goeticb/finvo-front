import itip20Abi from '@/contracts/abi/ITIP20.json'

const normalizedAbi = Array.isArray(itip20Abi)
  ? itip20Abi
  : (itip20Abi as { abi?: unknown }).abi ??
    (itip20Abi as { default?: { abi?: unknown } }).default?.abi ??
    (itip20Abi as { default?: unknown }).default ??
    []

export const ITIP20_ABI = normalizedAbi as const
