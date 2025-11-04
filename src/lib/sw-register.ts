// src/lib/sw-register.ts
export async function ensureServiceWorkerControl(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers not supported in this browser.");
    return;
  }

  if (navigator.serviceWorker.controller) return;

  let reg: ServiceWorkerRegistration;
  try {
    reg = await navigator.serviceWorker.register("/sw.js", {
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
      const key = "__sw_reload_once__";
      const onCtrl = () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.removeEventListener("controllerchange", onCtrl);
          resolve();
        }
      };
      navigator.serviceWorker.addEventListener("controllerchange", onCtrl);

      // One-time reload if still not controlled
      setTimeout(() => {
        if (!navigator.serviceWorker.controller) {
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            location.reload();
          } else {
            console.error("❌ SW still not controlling after reload — check /sw.js route & content-type.");
            resolve();
          }
        }
      }, 1000);
    });
  }
}
