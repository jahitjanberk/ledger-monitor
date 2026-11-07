import dash from "./disasters.js";
const app = document.getElementById("app");
document.title = `${dash.title} · Ledger Monitor`;
document.querySelector('meta[name="description"]')?.setAttribute("content", dash.description);
try {
  dash.mount(app);
} catch (e) {
  app.textContent = `The disasters dashboard could not load: ${e.message}`;
  throw e;
}
