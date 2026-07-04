import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./theme.css";
import App from "./App";

// Public Privy client id (safe to ship). Override at build with VITE_PRIVY_APP_ID.
const appId = import.meta.env.VITE_PRIVY_APP_ID || "cmpyd62aw005a0djrdbskj3xk";
const root = createRoot(document.getElementById("root")!);

const bradbury = {
  id: 4221,
  name: "GenLayer Bradbury",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-bradbury.genlayer.com"] } },
  blockExplorers: { default: { name: "Explorer", url: "https://explorer-bradbury.genlayer.com" } },
};

if (appId) {
  // Load Privy only when configured, so reads work in a wallet-free build.
  import("@privy-io/react-auth").then(({ PrivyProvider }) => {
    root.render(
      <StrictMode>
        <PrivyProvider
          appId={appId}
          config={{
            defaultChain: bradbury as never,
            supportedChains: [bradbury] as never,
            appearance: { theme: "dark", accentColor: "#46c98a" },
          }}
        >
          <App walletEnabled />
        </PrivyProvider>
      </StrictMode>,
    );
  });
} else {
  root.render(<StrictMode><App walletEnabled={false} /></StrictMode>);
}
