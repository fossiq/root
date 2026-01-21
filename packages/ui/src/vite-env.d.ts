import "solid-js";

/// <reference types="vite/client" />

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
