"use client";

import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Next's development bundles are rebuilt frequently and must never be
    // served from the offline cache. Clear only Stockwise-owned caches and
    // unregister an older local worker while running the dev server.
    if (process.env.NODE_ENV !== "production") {
      const controlledByOldWorker = Boolean(navigator.serviceWorker.controller);
      const reloadKey = "stockwise.dev-worker-cleared";
      const shouldReload = controlledByOldWorker && !window.sessionStorage.getItem(reloadKey);
      if (shouldReload) window.sessionStorage.setItem(reloadKey, "1");
      else window.sessionStorage.removeItem(reloadKey);
      const unregister = navigator.serviceWorker.getRegistrations().then(registrations =>
        Promise.all(registrations.map(registration => registration.unregister())),
      );
      void caches.keys().then(keys =>
        Promise.all(keys.filter(key => key.startsWith("stockwise-")).map(key => caches.delete(key))),
      );
      if (shouldReload) void unregister.then(() => window.location.reload());
      return;
    }
    void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
      .then(registration => registration.update())
      .catch(() => {});
  }, []);
  return null;
}
