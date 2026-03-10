"use client";

import { useEffect } from "react";

/** Registers the service worker. Import in root layout. */
export function SWRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
