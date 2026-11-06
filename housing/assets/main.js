import dash from "./housing.js";
const app = document.getElementById("app");
document.title = `${dash.title} · Economy Monitor`;
document.querySelector('meta[name="description"]')?.setAttribute("content", dash.description);
try {
  dash.mount(app);
} catch (e) {
  app.textContent = `The housing dashboard could not load: ${e.message}`;
  throw e;
}
