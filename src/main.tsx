import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// No longer registering service worker - using remote Scramjet engine
console.log("🌎 origin:", location.origin);
if (location.hostname.endsWith("lovableproject.com")) {
  console.error("❌ You are on Lovable PREVIEW. Redirect should have fired.");
}

createRoot(document.getElementById("root")!).render(<App />);
