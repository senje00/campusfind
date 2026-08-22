// ── CampusFind Auth Layer (Firebase Authentication + Firestore) ─
// Real accounts, real password hashing/storage, and real password-
// reset emails are all handled by Firebase — none of it is custom
// code anymore. This file just adapts Firebase's API to the same
// function names the rest of the app (and auth.html) already calls.
//
// Profile data (displayName, username) lives in a "users" Firestore
// collection, keyed by the Firebase Auth uid, since Firebase Auth
// itself only stores email/password/provider info.

// ── CampusFind Auth Layer (Firebase Authentication + Firestore) ─
// Real accounts, real password hashing/storage, and real password-
// reset emails are all handled by Firebase — none of it is custom
// code anymore. This file just adapts Firebase's API to the same
// function names the rest of the app (and auth.html) already calls.
//
// Profile data (displayName, username) lives in a "users" Firestore
// collection, keyed by the Firebase Auth uid, since Firebase Auth
// itself only stores email/password/provider info.

let currentUserProfile = null; // cached profile of the signed-in user

// ── Profile helpers ─────────────────────────────────────────────
async function loadCurrentUserProfile(uid) {
  const doc = await db.collection('users').doc(uid).get();
  currentUserProfile = doc.exists ? { id: uid, ...doc.data() } : null;
  return currentUserProfile;
}

async function getUserByUsername(username) {
  const snap = await db.collection('users').where('username', '==', username).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// Login accepts an email OR a username — resolve to an email first,
// since Firebase Auth signs in with email/password.
async function resolveEmailForIdentifier(identifier) {
  if (identifier.includes('@')) return identifier;
  const user = await getUserByUsername(identifier);
  return user ? user.email : null;
}

// ── Session / current user ───────────────────────────────────────
function isLoggedIn() {
  return !!auth.currentUser;
}
function getCurrentUser() {
  return currentUserProfile;
}

// ── Password validation (unchanged) ──────────────────────────────
function validatePassword(pwd) {
  if (pwd.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-zA-Z]/.test(pwd)) return 'Password must contain at least one letter.';
  if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number.';
  if (!/[^a-zA-Z0-9]/.test(pwd)) return 'Password must contain at least one symbol (e.g. @, #, !, $).';
  return null;
}

function friendlyAuthError(e) {
  const map = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/weak-password': 'Password is too weak.',
    'auth/user-not-found': 'No account found with that email or username.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Incorrect email/username or password.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/network-request-failed': 'Network error — check your connection.',
    'auth/operation-not-allowed': 'This sign-in method isn\'t turned on yet in Firebase — go to Authentication → Sign-in method in the console and enable it.'
  };
  return map[e.code] || (e.message || 'Something went wrong. Please try again.');
}

// ── Register (email + password) ──────────────────────────────────
async function registerUser({ displayName, username, email, password }) {
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return { ok: false, error: 'Username must be 3-20 characters (letters, numbers, underscores).' };
  }
  if (await getUserByUsername(username)) {
    return { ok: false, error: 'That username is already taken.' };
  }
  const pwErr = validatePassword(password);
  if (pwErr) return { ok: false, error: pwErr };

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection('users').doc(cred.user.uid).set({
      displayName, username, email,
      createdAt: new Date().toISOString(),
      provider: 'email'
    });
    if (displayName) await cred.user.updateProfile({ displayName });
    await cred.user.sendEmailVerification().catch(() => {});
    await loadCurrentUserProfile(cred.user.uid);
    return { ok: true, user: currentUserProfile };
  } catch (e) {
    return { ok: false, error: friendlyAuthError(e) };
  }
}

// ── Login (email or username + password) ─────────────────────────
async function loginUser(identifier, password) {
  const email = await resolveEmailForIdentifier(identifier);
  if (!email) return { ok: false, error: 'No account found with that email or username.' };
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    await loadCurrentUserProfile(cred.user.uid);
    return { ok: true, user: currentUserProfile };
  } catch (e) {
    return { ok: false, error: friendlyAuthError(e) };
  }
}

// ── Google sign-in ────────────────────────────────────────────────
async function loginWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    const uid = result.user.uid;
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) {
      let base = (result.user.displayName || result.user.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = base, n = 1;
      while (await getUserByUsername(username)) username = base + (n++);
      await db.collection('users').doc(uid).set({
        displayName: result.user.displayName || username,
        username, email: result.user.email,
        createdAt: new Date().toISOString(),
        provider: 'google'
      });
    }
    await loadCurrentUserProfile(uid);
    return { ok: true, user: currentUserProfile };
  } catch (e) {
    return { ok: false, error: friendlyAuthError(e) };
  }
}

// ── Password reset (Firebase sends the email — no custom OTP) ────
async function sendPasswordReset(identifier) {
  const email = await resolveEmailForIdentifier(identifier);
  if (!email) return { ok: false, error: 'No account found with that email or username.' };
  try {
    await auth.sendPasswordResetEmail(email);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyAuthError(e) };
  }
}

// ── Auth guard: call on every protected page ──────────────────────
// Usage stays the same as before: <script>requireAuth(); injectUserNav();</script>
// The redirect + nav injection now happen once Firebase resolves the
// auth state (onReady fires after that, if you pass a callback).
function requireAuth(onReady) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = (window.location.pathname.includes('/pages/') ? '../' : '') + 'auth.html';
      return;
    }
    try {
      await loadCurrentUserProfile(user.uid);
    } catch (e) {
      console.error('Could not load user profile from Firestore:', e);
    }
    if (!currentUserProfile) {
      // No Firestore profile doc (missing, or the read failed/was denied) —
      // fall back to what Firebase Auth itself knows, so the nav still
      // shows a name + logout instead of silently disappearing.
      const fallbackName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
      currentUserProfile = { id: user.uid, displayName: fallbackName, username: fallbackName, email: user.email };
      console.warn('Using fallback profile (no Firestore users/ doc found for this account).');
    }
    injectUserNav();
    if (typeof onReady === 'function') onReady();
  });
}

// ── Logout ───────────────────────────────────────────────────────
function logoutUser() {
  auth.signOut().then(() => {
    currentUserProfile = null;
    window.location.href = (window.location.pathname.includes('/pages/') ? '../' : '') + 'auth.html';
  });
}

// ── Inject nav user info ────────────────────────────────────────
function injectUserNav() {
  const user = currentUserProfile;
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks || !user) return;
  const existing = navLinks.querySelector('.nav-user-btn');
  if (existing) existing.remove();
  const userBtn = document.createElement('div');
  userBtn.className = 'nav-user-btn';
  userBtn.innerHTML = `
    <div class="nav-avatar">${(user.displayName || user.username || 'U')[0].toUpperCase()}</div>
    <span class="nav-username">${user.displayName || user.username}</span>
    <div class="nav-user-dropdown">
      <div class="nav-dropdown-name">${user.displayName || user.username}</div>
      <div class="nav-dropdown-email">${user.email || '@' + user.username}</div>
      <hr style="border-color:var(--border);margin:.5rem 0;">
      <button onclick="logoutUser()" class="nav-dropdown-signout">Sign Out</button>
    </div>
  `;
  navLinks.appendChild(userBtn);
}

}

