declare module '*.svg' {
  const content: string;
}

declare module '*.png' {
  const value: any;
}

declare global {
  interface Window {
    __frwBridgeUUID: string;
    __frwWalletUUID: string;
  }
}

export {};
