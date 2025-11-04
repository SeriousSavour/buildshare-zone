// src/lib/ensureEngine.ts
export async function ensureEngineReady(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  // Register the worker *from the top page* with scope '/sengine/'
  const swUrl = `/sengine/sw.js?v=${Date.now()}`;
  const reg = await navigator.serviceWorker.register(swUrl, { scope: '/sengine/' });
  await navigator.serviceWorker.ready;

  // If there's no controller yet, wait for it once
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) => {
      const onCtrl = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onCtrl);
        resolve();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onCtrl);
      // soft fallback
      setTimeout(resolve, 500);
    });
  }
}
