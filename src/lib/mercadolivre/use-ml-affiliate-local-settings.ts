"use client";

import { useCallback, useEffect, useState } from "react";
import { ML_EXT_AFFILIATE_TAG_LS_KEY, ML_EXT_SESSION_LS_KEY } from "@/lib/mercadolivre/ml-session-cookie";

export const ML_AFFILIATE_SETTINGS_CHANGED_EVENT = "aa-ml-affiliate-settings-changed";

export function dispatchMlAffiliateSettingsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ML_AFFILIATE_SETTINGS_CHANGED_EVENT));
}

function readFromStorage(): { sessionToken: string; affiliateTag: string } {
  if (typeof window === "undefined") return { sessionToken: "", affiliateTag: "" };
  try {
    return {
      sessionToken: localStorage.getItem(ML_EXT_SESSION_LS_KEY) ?? "",
      affiliateTag: localStorage.getItem(ML_EXT_AFFILIATE_TAG_LS_KEY) ?? "",
    };
  } catch {
    return { sessionToken: "", affiliateTag: "" };
  }
}

/** Etiqueta + token salvos no navegador (mesmo localStorage em toda a app). */
export function useMlAffiliateLocalSettings(): {
  sessionToken: string;
  affiliateTag: string;
  reload: () => void;
} {
  const [state, setState] = useState({ sessionToken: "", affiliateTag: "" });

  const reload = useCallback(() => {
    setState(readFromStorage());
  }, []);

  useEffect(() => {
    const sync = () => setState(readFromStorage());
    sync();
    window.addEventListener(ML_AFFILIATE_SETTINGS_CHANGED_EVENT, sync);
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ML_AFFILIATE_SETTINGS_CHANGED_EVENT, sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { sessionToken: state.sessionToken, affiliateTag: state.affiliateTag, reload };
}
