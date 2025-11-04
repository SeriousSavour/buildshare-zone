// src/lib/sw-register.ts
// Ensures the page is controlled by /sw.js before we navigate iframes.

export async function ensureServiceWorkerControl(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  // If already controlled, we're done
  if (navigator.serviceWorker.controller) return;

  // Register with root scope so /service/* is covered
  const reg = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "all",
  });

  // Wait until the SW is ready (installed+activated)
  await navigator.serviceWorker.ready;

  // Try to claim immediately
  try {
    reg.active?.postMessage({ type: "claim" });
  } catch {}

  // If still not controlled, listen for controllerchange and reload once
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) => {
      const onController = () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.removeEventListener("controllerchange", onController);
          resolve();
        }
      };
      navigator.serviceWorker.addEventListener("controllerchange", onController);

      // Safety timeout: if still not controlled in 1s, force a one-time reload
      setTimeout(() => {
        if (!navigator.serviceWorker.controller) {
          const key = "__sw_reloaded_once__";
          const didReload = sessionStorage.getItem(key) === "1";
          if (!didReload) {
            sessionStorage.setItem(key, "1");
            location.reload();
          } else {
            // Give up; resolve to avoid hanging
            resolve();
          }
        }
      }, 1000);
    });
  }
}
