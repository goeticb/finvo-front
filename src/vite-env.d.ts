/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TEMPO_RPC_URL: string
  readonly VITE_TEMPO_CHAIN_ID: string
  readonly VITE_TEMPO_EXPLORER_URL: string
  readonly VITE_REOWN_PROJECT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
