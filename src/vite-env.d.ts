/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FASTAPI_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 