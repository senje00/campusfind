// ── Home Page ────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadRecentItems();
  animateStats();
});

function loadRecentItems() {
  const grid = document.getElementById('recentGrid');
  if (!grid) return;
  const items = getAllItems().slice(0, 6);
  if (items.length === 0) {
    grid.innerHTML = `<div class="empty-state">No items reported yet. <a href="pages/report.html">Be the first →</a></div>`;
    return;
  }
  grid.innerHTML = items.map(item => buildItemCard(item, `openModal('${item.id}')`)).join('');
}

function animateStats() {
  const stats = getStats();
  const map = {
    'stat-total': stats.total,
    'stat-found': stats.claimed,
    'stat-lost': stats.lost,
    'stat-matches': stats.matches
  };
  for (const [id, target] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (!el) continue;
    const numEl = el.querySelector('.stat-num');
    if (!numEl) continue;
    let count = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const interval = setInterval(() => {
      count = Math.min(count + step, target);
      numEl.textContent = count;
      if (count >= target) clearInterval(interval);
    }, 40);
  }
}

// ── Modal (used on home & browse) ────────────────────────────
let currentModal = null;

function openModal(id) {
  const item = getItemById(id);
  if (!item) return;
  currentModal = id;

  const matches = findMatches(item);
  const matchHTML = matches.length > 0 ? `
    <div class="match-banner">
      <strong>🔗 Potential Matches Found!</strong>
      ${matches.map(m => `<div>• <strong>${m.item.title}</strong> — ${m.item.type === 'lost' ? 'Lost' : 'Found'} at ${m.item.location} (score: ${m.score})</div>`).join('')}
    </div>` : '';

  const icon = categoryIcon(item.category);
  const imgHTML = item.photo
    ? `<img src="${item.photo}" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-bottom:1.25rem;" />`
    : `<div class="modal-img">${icon}</div>`;

  const badge = item.status === 'claimed' ? 'badge-claimed' : (item.type === 'lost' ? 'badge-lost' : 'badge-found');
  const badgeText = item.status === 'claimed' ? 'Claimed' : item.type.charAt(0).toUpperCase() + item.type.slice(1);

  document.getElementById('modalBody').innerHTML = `
    ${imgHTML}
    ${matchHTML}
    <div class="item-card-meta" style="margin-bottom:1rem;">
      <span class="badge ${badge}">${badgeText}</span>
      <span class="item-date">${formatDate(item.createdAt)}</span>
    </div>
    <div class="detail-row"><span class="detail-label">Title</span><span class="detail-val">${item.title}</span></div>
    <div class="detail-row"><span class="detail-label">Category</span><span class="detail-val">${item.category}</span></div>
    <div class="detail-row"><span class="detail-label">Location</span><span class="detail-val">${item.location}</span></div>
    <div class="detail-row"><span class="detail-label">Date</span><span class="detail-val">${formatDate(item.createdAt)}</span></div>
    <div class="detail-row" style="flex-direction:column;gap:.3rem;"><span class="detail-label">Description</span><span class="detail-val">${item.description}</span></div>
    ${item.contact ? `<div class="detail-row"><span class="detail-label">Contact</span><span class="detail-val">${item.contact}</span></div>` : ''}
    <div class="modal-actions">
      ${item.status !== 'claimed' ? `<button class="btn btn-success btn-sm" onclick="markClaimed('${item.id}')">✅ Mark as Claimed</button>` : ''}
      <button class="btn btn-outline btn-sm" onclick="closeModal()">Close</button>
    </div>`;

  document.getElementById('modalTitle').textContent = item.title;
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.add('open');
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('open');
  currentModal = null;
}

function markClaimed(id) {
  updateItem(id, { status: 'claimed' });
  showToast('Item marked as claimed! 🎉', 'success');
  closeModal();
  if (typeof loadRecentItems === 'function') loadRecentItems();
  if (typeof loadBrowseItems === 'function') loadBrowseItems();
  if (typeof loadAdminItems === 'function') loadAdminItems();
  animateStats();
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') closeModal();
});
