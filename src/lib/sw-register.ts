// sw-register.ts (call from your app entry)
export async function ensureServiceWorkerControl() {
  if (!("serviceWorker" in navigator)) return;

  // Register with root scope so it can control /service/*
  const reg = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "all",
  });

  // Wait until this page is actually controlled by the SW
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) => {
      const onController = () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.removeEventListener("controllerchange", onController);
          resolve();
        }
      };
      navigator.serviceWorker.addEventListener("controllerchange", onController);
      // As a fallback, also try to claim right away:
      reg.active?.postMessage({ type: "claim" });
    });
  }
}
