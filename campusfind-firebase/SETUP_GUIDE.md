# CampusFind — VS Code Setup Guide

## What You're Getting
A complete multi-page web app with:
- **Home page** — Hero, stats counter, recent items grid
- **Report page** — Submit lost/found items with photo upload
- **Browse page** — Search & filter all items in real time
- **Admin page** — PIN-protected dashboard (PIN: `1234`)
- **Matching engine** — Keyword algorithm that links lost ↔ found items
- **Firebase backend** — Accounts and items are stored in Firebase (Auth + Firestore), not just the browser, and it stays on the free Spark plan. **See `FIREBASE_SETUP.md` first** to connect your own Firebase project before running the app.

---

## Folder Structure
```
lost-and-found/
├── index.html          ← Home page
├── css/
│   └── style.css       ← All styles
├── js/
│   ├── storage.js      ← Data layer + matching algorithm
│   ├── home.js         ← Home page + modal logic
│   ├── report.js       ← Report form logic
│   ├── browse.js       ← Browse/search logic
│   └── admin.js        ← Admin dashboard logic
└── pages/
    ├── report.html     ← Report item page
    ├── browse.html     ← Browse items page
    └── admin.html      ← Admin panel page
```

---

## Step-by-Step: Running in VS Code

### Step 1 — Install VS Code
Download and install from: https://code.visualstudio.com

### Step 2 — Install the Live Server Extension
1. Open VS Code
2. Click the **Extensions** icon on the left sidebar (or press `Ctrl+Shift+X`)
3. Search for **"Live Server"** by Ritwick Dey
4. Click **Install**

### Step 3 — Open the Project Folder
1. In VS Code, click **File → Open Folder**
2. Navigate to and select the `lost-and-found` folder
3. Click **Select Folder**

You should see the folder structure in the left panel.

### Step 4 — Launch the App
1. In the file explorer, click on `index.html` to open it
2. Right-click anywhere inside the file
3. Select **"Open with Live Server"**
4. Your browser will open automatically at `http://127.0.0.1:5500`

> ✅ That's it! The app is now running.

---

## How to Use the App

### Reporting a Lost Item
1. Click **"Report Lost Item"** on the home page
2. Select **"I Lost Something"** (red button)
3. Fill in: Title, Category, Location, Date, Description
4. Optionally upload a photo
5. Click **Submit Report**
6. If any matching found items exist, they appear below automatically

### Reporting a Found Item
1. Click **"I Found Something"** on the home page
2. Follow the same steps but select the green button
3. Submit and matches will appear instantly

### Browsing All Items
1. Click **Browse** in the navigation bar
2. Use the search box to find by keyword
3. Filter by Lost / Found using the buttons
4. Filter by category using the dropdown
5. Click any card to view full details

### Admin Panel
1. Click **Admin** in the navigation bar
2. Enter PIN: **`1234`**
3. View stats, mark items as claimed, or delete records
4. Use **"Clear All Data"** to reset everything

---

## Customisation Tips

| What to change | Where to find it |
|---|---|
| App name ("CampusFind") | Every HTML file, `<title>` and `.brand-name` |
| Admin PIN | `js/admin.js` → `const ADMIN_PIN = '1234'` |
| Colour scheme | `css/style.css` → `:root { }` variables |
| Add more categories | `pages/report.html` and `pages/browse.html` → `<select>` |
| Match sensitivity | `js/storage.js` → `if (score >= 2)` (raise to make stricter) |

---

## Deploying for Free (Optional)
To make it live so others can access it online:

1. Create a free account at https://github.com
2. Upload the `lost-and-found` folder as a repository
3. Go to **Settings → Pages → Source: main branch → /root**
4. Your app will be live at `https://yourusername.github.io/lost-and-found`

No server. No cost. Fully online.

---

*Built for CKT-UTAS IT Level 400 Final Year Project*
