// src/lib/sw-register.ts
export async function ensureServiceWorkerControl(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  // Already controlled? done.
  if (navigator.serviceWorker.controller) return;

  // Register at this origin with root scope
  const reg = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "all",
  });

  // Wait for readiness
  await navigator.serviceWorker.ready;

  // Ask to claim immediately
  try { reg.active?.postMessage({ type: "claim" }); } catch {}

  // If still not controlled, wait once or reload once
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) => {
      const key = "__sw_reloaded_once__";
      const onController = () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.removeEventListener("controllerchange", onController);
          resolve();
        }
      };
      navigator.serviceWorker.addEventListener("controllerchange", onController);

      setTimeout(() => {
        if (!navigator.serviceWorker.controller) {
          const reloaded = sessionStorage.getItem(key) === "1";
          if (!reloaded) {
            sessionStorage.setItem(key, "1");
            location.reload();
          } else {
            resolve(); // give up but do not hang
          }
        }
      }, 1000);
    });
  }
}
