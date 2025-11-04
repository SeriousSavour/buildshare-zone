import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ensureServiceWorkerControl } from "./lib/sw-register";

(async () => {
  try { await ensureServiceWorkerControl(); } catch (e) { console.warn("SW init:", e); }
  createRoot(document.getElementById("root")!).render(<App />);
})();
