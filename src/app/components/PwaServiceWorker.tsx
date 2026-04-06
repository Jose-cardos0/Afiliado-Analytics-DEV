"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __pwaDeferredInstall?: Event & { prompt: () => Promise<void> };
  }
}

export function PwaServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.__pwaDeferredInstall = e as Window["__pwaDeferredInstall"];
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (process.env.NODE_ENV !== "production" && !isLocal) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
