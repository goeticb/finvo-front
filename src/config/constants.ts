export const TEMPO_CHAIN_ID = 42431
export const TEMPO_RPC_URL = 'https://rpc.moderato.tempo.xyz'
export const TEMPO_EXPLORER_URL = 'https://explore.tempo.xyz'

export const STABLECOINS = {
  alphaUSD: '0x20c0000000000000000000000000000000000001' as const,
  betaUSD: '0x20c0000000000000000000000000000000000002' as const,
  pathUSD: '0x20c0000000000000000000000000000000000003' as const,
}

export const COUNTRIES = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'es', label: 'Spain' },
  { value: 'it', label: 'Italy' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'ch', label: 'Switzerland' },
  { value: 'sg', label: 'Singapore' },
  { value: 'jp', label: 'Japan' },
  { value: 'au', label: 'Australia' },
  { value: 'ca', label: 'Canada' },
] as const
