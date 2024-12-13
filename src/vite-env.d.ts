/// <reference types="vite/client" />

interface Window {
  php: {
    serialize: (data: any) => string;
    unserialize: (data: string) => any;
  };
}
