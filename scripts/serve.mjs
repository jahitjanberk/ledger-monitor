// Serves the site locally for previewing:  node scripts/serve.mjs [port]   (default 8765)
import { serve } from "./lib/browser.mjs";

const port = Number(process.argv[2] ?? 8765);
const srv = serve(port);
console.log(`Economy Monitor at ${srv.url}  (Ctrl+C to stop)`);
