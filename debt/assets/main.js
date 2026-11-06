import dash from "./debt.js";
const app = document.getElementById("app");
document.title = `${dash.title} · Economy Monitor`;
document.querySelector('meta[name="description"]')?.setAttribute("content", dash.description);
try {
  dash.mount(app);
} catch (e) {
  app.textContent = `The debt dashboard could not load: ${e.message}`;
  throw e;
}
