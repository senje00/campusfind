// ── Firebase Initialization ─────────────────────────────────
// 1. Go to https://console.firebase.google.com → create a project
// 2. Project settings → General → "Your apps" → Add app → Web (</>)
// 3. Copy the config object Firebase gives you and paste it below
// 4. Enable the products you need:
//    - Build → Authentication → Sign-in method → enable "Email/Password" and "Google"
//    - Build → Firestore Database → Create database (start in production mode)
//    Note: Firebase Storage is intentionally NOT used here — it now requires
//    the paid Blaze plan. Photos are instead compressed client-side and
//    stored directly inside the Firestore document (see js/report.js and
//    js/storage.js). This keeps the whole app on the free Spark plan.
// 5. Deploy the rules in firestore.rules (see FIREBASE_SETUP.md)

const firebaseConfig = {
  apiKey: "AIzaSyCf75R7ZTFSvVaP76mOtC0auOQt-_Qci78",
  authDomain: "campusfind-444e9.firebaseapp.com",
  projectId: "campusfind-444e9",
  storageBucket: "campusfind-444e9.firebasestorage.app",
  messagingSenderId: "850422812989",
  appId: "1:850422812989:web:98067673f5c7a87c98b554",
};

firebase.initializeApp(firebaseConfig);

// Shared handles used by auth.js and storage.js
const auth = firebase.auth();
const db = firebase.firestore();
