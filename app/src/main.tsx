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

// Path routing for a normal deploy; hash routing when the app is bundled into a
// single self-contained HTML file, where there is no server to rewrite paths.
const Router = import.meta.env.VITE_HASH_ROUTER === "1" ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <DeviceProvider>
        <App />
      </DeviceProvider>
    </Router>
  </StrictMode>
);
