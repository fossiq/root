import { Eta } from "eta";

export class TemplateManager {
  private eta = new Eta({ autoEscape: false });
  private templates = new Map<string, string>();

  /**
   * Load a template string under a given name.
   */
  load(name: string, template: string): void {
    this.templates.set(name, template);
  }

  /**
   * Render a loaded template with the provided data.
   */
  render<T>(name: string, data: T): string {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Template "${name}" not found`);
    }
    return this.eta.renderString(template, data) as string;
  }

  /**
   * Check if a template is loaded.
   */
  has(name: string): boolean {
    return this.templates.has(name);
  }
}
