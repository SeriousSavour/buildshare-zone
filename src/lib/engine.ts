// src/lib/engine.ts
let readyPromise: Promise<void> | null = null;

export function toEngineUrl(targetUrl: string) {
  return `/sengine/scramjet/${encodeURIComponent(targetUrl)}`;
}

export async function ensureEngineReady() {
  if (!('serviceWorker' in navigator)) return;
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    // Register (idempotent) with a cache-buster so Chrome updates if needed
    const swUrl = `/sengine/sw.js?v=${Date.now()}`;
    await navigator.serviceWorker.register(swUrl, { scope: '/sengine/' });
    await navigator.serviceWorker.ready;

    // Sanity: a HEAD should be intercepted by the SW (not your SPA)
    try {
      const head = await fetch(toEngineUrl('about:blank'), { method: 'HEAD' });
      if (!head.ok) throw new Error(`engine HEAD ${head.status}`);
    } catch (e) {
      console.warn('[engine] head probe failed (will still try):', e);
    }
  })();

  return readyPromise;
}
