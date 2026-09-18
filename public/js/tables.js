// Progressive enhancement for static tables: click-to-sort headers and text filters.
(function () {
  const val = (td) => (td ? (td.dataset.v !== undefined ? td.dataset.v : td.textContent.trim()) : '');
  document.querySelectorAll('table[data-sortable]').forEach((table) => {
    table.querySelectorAll('thead th').forEach((th, idx) => {
      th.dataset.sort = '';
      th.tabIndex = 0;
      const go = () => {
        const tbody = table.tBodies[0];
        const dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
        table.querySelectorAll('thead th').forEach((h) => h.removeAttribute('aria-sort'));
        th.setAttribute('aria-sort', dir);
        const rows = Array.from(tbody.rows).filter((r) => !r.classList.contains('total') && !r.classList.contains('pin'));
        const totals = Array.from(tbody.rows).filter((r) => r.classList.contains('total'));
        const pins = Array.from(tbody.rows).filter((r) => r.classList.contains('pin'));
        rows.sort((a, b) => {
          const x = val(a.cells[idx]), y = val(b.cells[idx]);
          const nx = parseFloat(x.replace(/[$,−%]/g, '')), ny = parseFloat(y.replace(/[$,−%]/g, ''));
          const cmp = !isNaN(nx) && !isNaN(ny) ? nx - ny : x.localeCompare(y);
          return dir === 'ascending' ? cmp : -cmp;
        });
        pins.concat(rows, totals).forEach((r) => tbody.appendChild(r));
      };
      th.addEventListener('click', go);
      th.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  });
  document.querySelectorAll('input[data-filter]').forEach((input) => {
    const id = input.dataset.filter;
    const table = document.getElementById(id);
    const count = document.querySelector(`[data-count="${id}"]`);
    if (!table) return;
    const rows = Array.from(table.tBodies[0].rows);
    const sel = document.querySelector(`select[data-filter-col="${id}"]`);
    const apply = () => {
      const q = input.value.trim().toLowerCase();
      const col = sel ? sel.value : '';
      let n = 0;
      rows.forEach((r) => {
        const okText = !q || r.textContent.toLowerCase().includes(q);
        const okCol = !col || r.dataset.group === col;
        const show = okText && okCol;
        r.hidden = !show;
        if (show) n++;
      });
      if (count) count.textContent = `${n.toLocaleString()} of ${rows.length.toLocaleString()} rows`;
    };
    input.addEventListener('input', apply);
    if (sel) sel.addEventListener('change', apply);
    apply();
  });
})();

// Hover/focus tooltip for chart marks: any element with data-tip.
(function () {
  const tip = document.getElementById('viz-tip');
  if (!tip) return;
  const place = (e) => {
    const x = Math.min(e.clientX + 12, innerWidth - tip.offsetWidth - 8), y = Math.max(8, e.clientY - tip.offsetHeight - 10);
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  };
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (!el) { tip.classList.remove('on'); return; }
    tip.textContent = el.dataset.tip; tip.classList.add('on'); place(e);
  });
  document.addEventListener('pointerleave', () => tip.classList.remove('on'));
})();
