declare module "*.eta" {
  const content: string;
  export default content;
}

declare module "eta" {
  export interface EtaConfig {
    autoEscape?: boolean;
  }

  export class Eta {
    constructor(config?: EtaConfig);
    renderString<T>(template: string, data: T): string;
  }
}
