// This file holds all global type definitions for the project.
// By centralizing them, you avoid "Duplicate identifier" errors.

export {}; // Ensures this file is treated as a module.

declare global {
  // --- Google reCAPTCHA ---
  // This combined interface supports both v2 and v3 methods.
  interface ReCaptchaV2 {
    render: (container: string | HTMLElement, parameters: any) => number;
    reset: (widgetId?: number) => void;
  }

  const grecaptcha: {
    ready: (cb: () => void) => void;
    execute: (siteKeyOrWidgetId: string | number, options?: { action: string }) => Promise<string>;
  } & ReCaptchaV2; // Combines v3 and v2 interfaces

  // --- Bootstrap ---
  const bootstrap: {
    Modal: {
      getInstance: (element: HTMLElement | null) => {
        hide: () => void;
      } | null;
    };
    Collapse: new (element: HTMLElement) => {
      hide: () => void;
    };
  };
}