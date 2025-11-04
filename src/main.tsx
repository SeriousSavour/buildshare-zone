import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const PROD = 'https://buildshare-zone.lovable.app';

// If we're inside the Lovable editor/preview on /browser, redirect to live site
if (/\.(lovable(dev|project)\.com?|lovableproject\.com)$/.test(location.hostname)) {
  if (location.pathname.startsWith('/browser')) {
    const dest = new URL(location.href);
    dest.hostname = new URL(PROD).hostname;
    dest.protocol = 'https:';
    location.replace(dest.toString());
  }
  console.log("🌎 origin:", location.origin);
  console.log("⚠️ Browser route only works on live site due to editor sandbox restrictions");
}

createRoot(document.getElementById("root")!).render(<App />);
