// ── CampusFind Storage Layer (Firebase Firestore + Storage) ───
// Items live in the "items" collection in Firestore. Photos are
// uploaded to Firebase Storage and we store the download URL.
// A live onSnapshot listener keeps an in-memory cache (itemsCache)
// so every existing get*/search*/find* function below can stay
// SYNCHRONOUS, exactly like the old localStorage version — the
// only functions that became async are the ones that WRITE data:
// addItem, updateItem, deleteItem.

const ITEMS_COLLECTION = 'items';

let itemsCache = [];
let itemsCacheReady = false;

db.collection(ITEMS_COLLECTION).orderBy('createdAt', 'desc')
  .onSnapshot(
    (snap) => {
      itemsCache = snap.docs.map(d => d.data());
      itemsCacheReady = true;
      refreshUI();
    },
    (err) => {
      console.error('Firestore items listener error:', err);
      showToast('Could not load items. Check your connection.', 'error');
    }
  );

// Re-render whichever page-level loaders exist. Each page file
// (home.js/browse.js/admin.js) still defines its own loadXItems()
// function — this just calls whichever ones are present, same
// pattern the original code already used inside markClaimed().
function refreshUI() {
  if (typeof loadRecentItems === 'function') loadRecentItems();
  if (typeof loadBrowseItems === 'function') loadBrowseItems();
  if (typeof loadAdminItems === 'function') loadAdminItems();
  if (typeof animateStats === 'function') animateStats();
}

function getAllItems() {
  return itemsCache;
}

async function addItem(item) {
  const id = db.collection(ITEMS_COLLECTION).doc().id;

  // No Firebase Storage (it now requires the paid Blaze plan) — the
  // photo is already compressed to a small JPEG data URL by report.js
  // before it gets here, so it's safe to store directly on the
  // document. Firestore's per-document limit is 1MB; report.js keeps
  // compressed photos well under that (~150-300KB typical).
  const newItem = {
    ...item,
    id,
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  await db.collection(ITEMS_COLLECTION).doc(id).set(newItem);
  return newItem;
}

function getItemById(id) {
  return getAllItems().find(i => i.id === id) || null;
}

async function updateItem(id, updates) {
  try {
    await db.collection(ITEMS_COLLECTION).doc(id).update(updates);
    return true;
  } catch (e) {
    console.error('updateItem failed:', e);
    showToast('Could not update item.', 'error');
    return false;
  }
}

async function deleteItem(id) {
  try {
    await db.collection(ITEMS_COLLECTION).doc(id).delete();
  } catch (e) {
    console.error('deleteItem failed:', e);
    showToast('Could not delete item.', 'error');
  }
}

function searchItems(query, type = 'all', category = 'all') {
  let items = getAllItems();
  if (type !== 'all') items = items.filter(i => i.type === type);
  if (category !== 'all') items = items.filter(i => i.category === category);
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(i =>
    i.title.toLowerCase().includes(q) ||
    i.description.toLowerCase().includes(q) ||
    i.location.toLowerCase().includes(q) ||
    i.category.toLowerCase().includes(q)
  );
}

// ── Keyword matching algorithm (unchanged) ─────────────────────
function findMatches(newItem) {
  const items = getAllItems();
  const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';
  const candidates = items.filter(i => i.type === oppositeType && i.status === 'active' && i.id !== newItem.id);

  const keywords = extractKeywords(newItem.title + ' ' + newItem.description);
  const matches = [];

  for (const item of candidates) {
    const itemKeywords = extractKeywords(item.title + ' ' + item.description);
    const score = computeMatchScore(keywords, itemKeywords, newItem, item);
    if (score >= 2) matches.push({ item, score });
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}

function extractKeywords(text) {
  const stopWords = new Set(['a','an','the','and','or','in','on','at','to','for','of','with','is','was','i','my','it','this','that','has','have','been','lost','found','item']);
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

function computeMatchScore(kw1, kw2, item1, item2) {
  let score = 0;
  for (const k of kw1) if (kw2.includes(k)) score += 2;
  if (item1.category === item2.category) score += 3;
  if (item1.location.toLowerCase() === item2.location.toLowerCase()) score += 2;
  return score;
}

// ── Stats ────────────────────────────────────────────────────
function getStats() {
  const items = getAllItems();
  const lost = items.filter(i => i.type === 'lost');
  const found = items.filter(i => i.type === 'found');
  const claimed = items.filter(i => i.status === 'claimed');
  let matchCount = 0;
  for (const item of items) {
    const m = findMatches(item);
    if (m.length > 0) matchCount++;
  }
  return {
    total: items.length,
    lost: lost.filter(i => i.status === 'active').length,
    found: found.filter(i => i.status === 'active').length,
    claimed: claimed.length,
    matches: Math.floor(matchCount / 2)
  };
}

// ── Toast utility ────────────────────────────────────────────
function showToast(message, type = 'success') {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.className = 'toast ' + type;
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Nav toggle ───────────────────────────────────────────────
function toggleNav() {
  const links = document.querySelector('.nav-links');
  if (links) links.classList.toggle('open');
}

// ── Format date ──────────────────────────────────────────────
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Category emoji map ───────────────────────────────────────
const CATEGORY_ICONS = {
  'Electronics': '💻', 'Phone': '📱', 'Wallet/Purse': '👜',
  'Keys': '🔑', 'ID/Card': '🪪', 'Bag/Backpack': '🎒',
  'Clothing': '👕', 'Books/Notes': '📚', 'Jewellery': '💍',
  'Sports Equipment': '⚽', 'Other': '📦'
};

function categoryIcon(cat) {
  return CATEGORY_ICONS[cat] || '📦';
}

// ── Build item card HTML ─────────────────────────────────────
function buildItemCard(item, onclick = '') {
  const icon = categoryIcon(item.category);
  const badge = item.status === 'claimed' ? 'badge-claimed' : (item.type === 'lost' ? 'badge-lost' : 'badge-found');
  const badgeText = item.status === 'claimed' ? 'Claimed' : item.type.charAt(0).toUpperCase() + item.type.slice(1);
  const imgContent = item.photo
    ? `<img src="${item.photo}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;"/>`
    : icon;
  return `
    <div class="item-card" onclick="${onclick}" data-id="${item.id}">
      <div class="item-card-img">${imgContent}</div>
      <div class="item-card-body">
        <div class="item-card-meta">
          <span class="badge ${badge}">${badgeText}</span>
          <span class="item-date">${formatDate(item.createdAt)}</span>
        </div>
        <div class="item-card-title">${item.title}</div>
        <div class="item-card-desc">${item.description}</div>
        <div class="item-card-loc">${item.location}</div>
      </div>
    </div>`;
}
