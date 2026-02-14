import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain } from 'viem'

// Define Tempo Testnet
export const tempoTestnet = defineChain({
  id: 42431,
  name: 'Tempo Testnet',
  nativeCurrency: {
    decimals: 6,
    name: 'USD',
    symbol: 'USD',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.moderato.tempo.xyz'],
      webSocket: ['wss://rpc.moderato.tempo.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Tempo Explorer',
      url: 'https://explore.tempo.xyz',
    },
  },
  testnet: true,
})

// Get project ID from environment or use a placeholder
// You need to get a project ID from https://cloud.reown.com
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'YOUR_PROJECT_ID'

// App metadata
const metadata = {
  name: 'Finvo',
  description: 'Web3 Invoice Platform on Tempo Blockchain',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://finvo.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

// Networks configuration - cast to mutable array for AppKit
const networks = [tempoTestnet]

// Create Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: networks as any,
  projectId,
})

// Create AppKit instance
createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as any,
  projectId,
  metadata,
  features: {
    analytics: false,
  },
  themeMode: 'light',
})

// Export wagmi config for use with WagmiProvider
export const config = wagmiAdapter.wagmiConfig
