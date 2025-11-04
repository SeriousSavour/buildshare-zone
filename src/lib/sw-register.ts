export async function ensureServiceWorkerControl(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  // Already controlled? done.
  if (navigator.serviceWorker.controller) return;

  // Register at this origin with root scope
  const reg = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "all",
  });

  await navigator.serviceWorker.ready;

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
            resolve();
          }
        }
      }, 1000);
    });
  }
}
