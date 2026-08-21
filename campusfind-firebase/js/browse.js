// ── Browse Page ──────────────────────────────────────────────

let activeFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  loadBrowseItems();
});

function setFilter(type) {
  activeFilter = type;
  document.getElementById('filterAll').classList.toggle('active', type === 'all');
  document.getElementById('filterLost').classList.toggle('active', type === 'lost');
  document.getElementById('filterFound').classList.toggle('active', type === 'found');
  loadBrowseItems();
}

function loadBrowseItems() {
  const query = document.getElementById('searchInput').value;
  const category = document.getElementById('catFilter').value;
  const grid = document.getElementById('browseGrid');
  const countEl = document.getElementById('resultCount');

  const items = searchItems(query, activeFilter, category);

  countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''} found`;

  if (items.length === 0) {
    grid.innerHTML = `<div class="empty-state">No items match your search. <a href="report.html">Report one →</a></div>`;
    return;
  }

  grid.innerHTML = items.map(item => buildItemCard(item, `openModal('${item.id}')`)).join('');
}
