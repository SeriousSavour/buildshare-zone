// src/lib/sw-register.ts
const SW_URL = `/sw.js?v=${Date.now()}` as const;

export async function ensureServiceWorkerControl(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers not supported in this browser.");
    return;
  }

  if (navigator.serviceWorker.controller) return;

  let reg: ServiceWorkerRegistration;
  try {
    reg = await navigator.serviceWorker.register(SW_URL, {
      scope: "/",                // allow /s/* under root
      updateViaCache: "all",
    });
  } catch (e) {
    console.error("❌ Failed to register /sw.js:", e);
    throw e;
  }

  try {
    await navigator.serviceWorker.ready;
  } catch (e) {
    console.error("❌ navigator.serviceWorker.ready failed:", e);
    throw e;
  }

  try { reg.active?.postMessage({ type: "claim" }); } catch {}

  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) => {
      const onCtrl = () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.removeEventListener("controllerchange", onCtrl);
          resolve();
        }
      };
      navigator.serviceWorker.addEventListener("controllerchange", onCtrl);
      setTimeout(() => resolve(), 1500);
    });
  }
}
