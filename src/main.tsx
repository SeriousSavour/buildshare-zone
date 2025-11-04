// src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ensureServiceWorkerControl } from "./lib/sw-register";

(async () => {
  try {
    await ensureServiceWorkerControl();
  } catch (e) {
    // Not fatal; app can still render
    console.warn("SW init warning:", e);
  } finally {
    createRoot(document.getElementById("root")!).render(<App />);
  }
})();
