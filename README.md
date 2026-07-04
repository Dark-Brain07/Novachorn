# NovaChron Console

Frontend for the NovaChron covenant protocol. Reads live covenant state from GenLayer Bradbury
via `genlayer-js` (no wallet) and submits writes via a Privy wallet on chain 4221.

```
npm install
npm run dev      # local development
npm run build    # production build -> dist/
```

Set `VITE_PRIVY_APP_ID` (a public Privy client id) to enable wallet writes, and add your deployed
origin to the Privy dashboard's allowed origins.

**Vercel:** root directory `web`, build `npm run build`, output `dist`, `NODE_VERSION=20`.
