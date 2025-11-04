import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ensureServiceWorkerControl } from "./lib/sw-register";

(async () => {
  console.log("🌎 origin:", location.origin);
  if (location.hostname.endsWith("lovableproject.com")) {
    console.error("❌ You are on Lovable PREVIEW. Redirect should have fired.");
  }
  try {
    await ensureServiceWorkerControl();
    console.log("✅ SW controller?", !!navigator.serviceWorker.controller);
  } catch (e) {
    console.error("❌ SW init error:", e);
  }
  createRoot(document.getElementById("root")!).render(<App />);
})();
