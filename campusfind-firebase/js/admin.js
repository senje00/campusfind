// ── Admin Page ───────────────────────────────────────────────

const ADMIN_PIN = '0505';

function adminLogin() {
  const pin = document.getElementById('pinInput').value;
  if (pin === ADMIN_PIN) {
    document.getElementById('loginGate').style.display = 'none';
    document.getElementById('adminDash').style.display = 'block';
    loadAdminItems();
    showToast('Welcome, Admin! 👋', 'success');
  } else {
    showToast('Incorrect PIN. Try again.', 'error');
  }
}

function adminLogout() {
  document.getElementById('loginGate').style.display = 'block';
  document.getElementById('adminDash').style.display = 'none';
  document.getElementById('pinInput').value = '';
}

function loadAdminItems() {
  loadAdminStats();
  const items = getAllItems();
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:2rem;">No items in the database.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const badge = item.status === 'claimed' ? 'badge-claimed' : (item.type === 'lost' ? 'badge-lost' : 'badge-found');
    const typeText = item.type.charAt(0).toUpperCase() + item.type.slice(1);
    const statusText = item.status === 'claimed' ? 'Claimed' : 'Active';
    return `
      <tr>
        <td><strong>${item.title}</strong></td>
        <td><span class="badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}">${typeText}</span></td>
        <td>${item.category}</td>
        <td>${item.location}</td>
        <td>${formatDate(item.createdAt)}</td>
        <td><span class="badge ${badge}">${statusText}</span></td>
        <td>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
            ${item.status !== 'claimed' ? `<button class="btn btn-success btn-sm" onclick="adminClaim('${item.id}')">Claim</button>` : ''}
            <button class="btn btn-danger btn-sm" onclick="adminDelete('${item.id}')">Delete</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function loadAdminStats() {
  const stats = getStats();
  const container = document.getElementById('adminStats');
  if (!container) return;
  const cards = [
    { label: 'Total Items', value: stats.total, color: 'var(--accent)' },
    { label: 'Lost (Active)', value: stats.lost, color: 'var(--lost)' },
    { label: 'Found (Active)', value: stats.found, color: 'var(--found)' },
    { label: 'Claimed', value: stats.claimed, color: 'var(--text2)' },
  ];
  container.innerHTML = cards.map(c => `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.5rem;">
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:2.5rem;color:${c.color};">${c.value}</div>
      <div style="font-size:.8rem;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-top:.25rem;">${c.label}</div>
    </div>`).join('');
}

function adminClaim(id) {
  updateItem(id, { status: 'claimed' });
  showToast('Item marked as claimed.', 'success');
  loadAdminItems();
}

function adminDelete(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  deleteItem(id);
  showToast('Item deleted.', 'error');
  loadAdminItems();
}

async function clearAllItems() {
  if (!confirm('⚠️ This will DELETE ALL items permanently. Are you sure?')) return;
  const items = getAllItems();
  await Promise.all(items.map(i => deleteItem(i.id)));
  showToast('All data cleared.', 'error');
  loadAdminItems();
}
