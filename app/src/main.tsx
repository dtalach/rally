import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";

// Fonts and icons are bundled locally — no CDN at runtime.
import "@fontsource/chakra-petch/400.css";
import "@fontsource/chakra-petch/500.css";
import "@fontsource/chakra-petch/600.css";
import "@fontsource/chakra-petch/700.css";
import "@fontsource/press-start-2p/400.css";
import "@phosphor-icons/web/regular/style.css";
import "@phosphor-icons/web/fill/style.css";

import "./styles/tokens.css";
import App from "./App.tsx";
import { DeviceProvider } from "./device";
import { listenForFirstGesture } from "./sound";

// Path routing for a normal deploy; hash routing when the app is bundled into a
// single self-contained HTML file, where there is no server to rewrite paths.
const Router = import.meta.env.VITE_HASH_ROUTER === "1" ? HashRouter : BrowserRouter;

// Cache the shell so a home-screen launch is instant. Dev is excluded so
// there's no stale bundle to fight while iterating.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // A failed registration costs us speed, never correctness.
    });
  });
}

// iOS only allows audio inside a gesture; prime it on the first tap.
listenForFirstGesture();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <DeviceProvider>
        <App />
      </DeviceProvider>
    </Router>
  </StrictMode>
);
