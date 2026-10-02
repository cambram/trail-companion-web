/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly FEATURE_REGISTRATION_ENABLED?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
