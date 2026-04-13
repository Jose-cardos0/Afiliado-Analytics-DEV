declare global {
  interface Window {
    __pwaDeferredInstall?: Event & { prompt: () => Promise<void> };
  }
}

export type PwaInstallFlowResult = "standalone" | "browser" | "prompted";

/**
 * Tenta o prompt nativo de instalação (PWA). Retorna qual mensagem de apoio mostrar, se houver.
 */
export async function runPwaInstallFlow(): Promise<PwaInstallFlowResult> {
  if (typeof window === "undefined") return "browser";

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "standalone";

  const ev = window.__pwaDeferredInstall;
  if (ev) {
    try {
      await ev.prompt();
    } finally {
      window.__pwaDeferredInstall = undefined;
    }
    return "prompted";
  }

  return "browser";
}
