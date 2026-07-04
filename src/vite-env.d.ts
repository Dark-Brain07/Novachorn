/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVY_APP_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "three";
declare module "vanta/dist/vanta.globe.min";
