/// <reference types="vite/client" />

import "solid-js";

declare module "*?worker" {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

declare module "*?url" {
  const content: string;
  export default content;
}

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

// File System Access API extensions (not yet in standard TypeScript types)
declare global {
  interface FileSystemHandlePermissionDescriptor {
    mode?: "read" | "readwrite";
  }

  interface FileSystemFileHandle {
    queryPermission(
      descriptor?: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState>;
    requestPermission(
      descriptor?: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState>;
  }
}

declare module "solid-js" {
  namespace JSX {
    interface CSSProperties {
      "app-region"?: "drag" | "no-drag";
      "-webkit-app-region"?: "drag" | "no-drag";
    }
  }
}
