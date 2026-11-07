  (function () {
    var root = document.documentElement;
    try { var s = localStorage.getItem('em-theme'); if (s) root.dataset.theme = s; } catch (e) {}
    document.getElementById('hb-theme').addEventListener('click', function () {
      var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('em-theme', root.dataset.theme); } catch (e) {}
    });
    // Search: dashboards, country profiles and topics from assets/search.json (written by
    // scripts/countries.mjs), loaded the first time the box is used.
    var q = document.getElementById("hb-q"), list = document.getElementById("hb-results"), count = document.getElementById("hb-count");
    if (q && list) {
      var index = null, loading = null;
      var load = function () {
        if (!loading) loading = fetch("assets/search.json").then(function (r) { return r.json(); }).then(function (j) {
          index = [].concat(
            j.dashboards.map(function (x) { x.kind = "Dashboard"; x.w = 0; return x; }),
            j.countries.map(function (x) { x.kind = "Country"; x.w = 1; return x; }),
            j.topics.map(function (x) { x.kind = "Topic"; x.w = 2; return x; }));
        });
        return loading;
      };
      var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
      var norm = function (t) { return String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
      var score = function (x, s) {
        var t = norm(x.t);
        if (x.k && norm(x.k) === s) return 0;
        if (t === s) return 0;
        if (t.indexOf(s) === 0) return 1;
        if ((" " + t).indexOf(" " + s) !== -1) return 2;
        if (t.indexOf(s) !== -1) return 3;
        if (x.kind === "Dashboard" && norm(x.s).indexOf(s) !== -1) return 4;
        return -1;
      };
      var run = function () {
        var s = norm(q.value.trim());
        if (!s) { list.hidden = true; list.innerHTML = ""; count.textContent = ""; return; }
        if (!index) { load().then(run); return; }
        var hits = index.map(function (x) { return { x: x, r: score(x, s) }; })
          .filter(function (h) { return h.r >= 0; })
          .sort(function (a, b) { return a.r - b.r || a.x.w - b.x.w || a.x.t.localeCompare(b.x.t); })
          .slice(0, 8);
        list.innerHTML = hits.map(function (h) { return '<li><a href="' + esc(h.x.u) + '"><b>' + esc(h.x.t) + "</b><span>" + esc(h.x.kind === "Dashboard" ? "Dashboard" : h.x.s) + "</span></a></li>"; }).join("");
        list.hidden = !hits.length;
        count.textContent = hits.length ? hits.length + (hits.length === 1 ? " result. Press Enter to open it." : " results. Press Enter to open the first, or the down arrow to choose.") : "Nothing found. Try a country, a dashboard or a mineral.";
      };
      q.addEventListener("focus", load, { once: true });
      q.addEventListener("input", run);
      q.addEventListener("keydown", function (e) {
        var first = list.querySelector("a");
        if (e.key === "Enter" && first) { e.preventDefault(); location.href = first.href; }
        if (e.key === "ArrowDown" && first) { e.preventDefault(); first.focus(); }
        if (e.key === "Escape") { q.value = ""; run(); }
      });
      list.addEventListener("keydown", function (e) {
        var links = Array.prototype.slice.call(list.querySelectorAll("a")), i = links.indexOf(document.activeElement);
        if (e.key === "ArrowDown" && i < links.length - 1) { e.preventDefault(); links[i + 1].focus(); }
        if (e.key === "ArrowUp") { e.preventDefault(); (i > 0 ? links[i - 1] : q).focus(); }
        if (e.key === "Escape") { q.focus(); }
      });
      if (q.value) run();
    }
    // Dashboards need a web server: browsers block their scripts and data on file:// pages.
    if (location.protocol === "file:") {
      var note = document.createElement("p");
      note.className = "hb-filenote"; note.setAttribute("role", "note");
      note.innerHTML = "<b>You've opened this page as a file, so the dashboards won't load.</b> In the project folder run <code>node scripts/serve.mjs</code>, then go to <a href=\"http://localhost:8765/\">http://localhost:8765/</a>.";
      var grid = document.getElementById("dashboards");
      grid.parentNode.insertBefore(note, grid);
    }
  })();
