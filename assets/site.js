// Shared by the generated pages (country profiles, compare): the theme switch, "copy link"
// buttons and the filter on the country index.
(function () {
  var root = document.documentElement;
  var theme = document.getElementById("hb-theme");
  if (theme) theme.addEventListener("click", function () {
    var dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("em-theme", root.dataset.theme); } catch (e) {}
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-copy=link]");
    if (!b) return;
    var label = b.textContent;
    var done = function (ok) { b.textContent = ok ? "Link copied" : "Copy failed: use the address bar"; setTimeout(function () { b.textContent = label; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { done(true); }, function () { done(false); });
    else done(false);
  });

  var filter = document.getElementById("ct-filter"), list = document.getElementById("ct-list"), count = document.getElementById("ct-count");
  if (filter && list) {
    var items = Array.prototype.slice.call(list.children);
    var run = function () {
      var q = filter.value.trim().toLowerCase(), n = 0;
      items.forEach(function (li) { var hit = !q || li.dataset.k.indexOf(q) !== -1; li.hidden = !hit; if (hit) n++; });
      if (count) count.textContent = n === items.length ? n + " countries" : n + " of " + items.length + " countries";
    };
    filter.addEventListener("input", run);
    filter.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var first = items.filter(function (li) { return !li.hidden; })[0];
      if (first) location.href = first.querySelector("a").href;
    });
    if (filter.value) run();
  }
})();
