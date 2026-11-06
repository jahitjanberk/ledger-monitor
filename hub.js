  (function () {
    var root = document.documentElement;
    try { var s = localStorage.getItem('em-theme'); if (s) root.dataset.theme = s; } catch (e) {}
    document.getElementById('hb-theme').addEventListener('click', function () {
      var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('em-theme', root.dataset.theme); } catch (e) {}
    });
    // Dashboards need a web server: browsers block their scripts and data on file:// pages.
    if (location.protocol === "file:") {
      var note = document.createElement("p");
      note.className = "hb-filenote"; note.setAttribute("role", "note");
      note.innerHTML = "<b>You've opened this page as a file, so the dashboards won't load.</b> In the project folder run <code>node scripts/serve.mjs</code>, then go to <a href=\"http://localhost:8765/\">http://localhost:8765/</a>.";
      var grid = document.getElementById("dashboards");
      grid.parentNode.insertBefore(note, grid);
    }
  })();
