# CampusFind — Firebase Backend Setup

This build replaces `localStorage` with a real backend:

| Was (localStorage) | Now (Firebase) |
|---|---|
| `campusfind_items` in localStorage | **Firestore** `items` collection |
| Item photos as base64 strings | Still base64 — but compressed client-side and stored **inline on the Firestore document** (see "About photos" below) |
| `campusfind_users` in localStorage | **Firestore** `users` collection (profile only) |
| Fake password hash + fake OTP | **Firebase Authentication** (real password hashing, real email verification, real password-reset emails) |
| Google/Apple "demo" sign-in | Real **Google sign-in** via Firebase (Apple needs extra setup — see below) |

Nothing about the *look* of the app changed — same pages, same CSS, same matching algorithm. Only the data layer (`js/storage.js`) and auth layer (`js/auth.js`, plus the inline script in `auth.html`) now talk to Firebase instead of `localStorage`.

**This build deliberately does not use Firebase Storage.** As of February 2026, Firebase requires the paid **Blaze** plan to use Cloud Storage at all (even for a few KB — no more free tier there). To keep this project entirely on the free **Spark** plan with no credit card needed, item photos are compressed in the browser and saved directly inside the Firestore document instead of as a separate uploaded file. See "About photos" below for the trade-offs.

---

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com → **Add project** → name it (e.g. `campusfind`) → finish the wizard.
2. In the project, click the **Web** icon (`</>`) to register a web app. You don't need Firebase Hosting for this step.
3. Firebase shows you a `firebaseConfig` object. Copy it.
4. Open `js/firebase-config.js` in this project and paste your values in place of the `"YOUR_..."` placeholders.

## 2. Turn on Authentication

**Build → Authentication → Get started → Sign-in method**
- Enable **Email/Password**.
- Enable **Google** (pick a support email when prompted).
- *(Optional, extra setup)* **Apple** requires an active Apple Developer account and additional config in both Firebase and Apple's developer portal — skip this unless you need it. The Apple button in `auth.html` shows a "needs setup" message until you wire it up.

## 3. Turn on Firestore

**Build → Firestore Database → Create database** → start in **production mode** → pick a region close to your users.

Then publish the rules in `firestore.rules` (included in this project):
- Console: **Firestore → Rules** tab → paste the contents of `firestore.rules` → **Publish**.
- Or with the CLI: `firebase deploy --only firestore:rules` (see step 4).

That's it — **you do not need to enable Firebase Storage** for this build. Skip that section of the console entirely.

## 4. (Optional) Deploy rules with the CLI instead of the console

```bash
npm install -g firebase-tools
firebase login
firebase init            # choose Firestore only, point at this folder,
                          # and say the existing firestore.rules is fine
firebase deploy --only firestore:rules
```

## 5. Run the app

Same as before — open the folder in VS Code and use **Live Server** on `index.html` (see `SETUP_GUIDE.md`). Firebase config is loaded from `js/firebase-config.js`, so as soon as that file has your real project values, sign-up/login/report/browse/admin all work against your live Firebase project — no server code to write or host yourself, and no billing account required.

---

## About photos (why no Firebase Storage)

Since February 3, 2026, Google requires every Firebase project to be on the **Blaze** (pay-as-you-go) plan just to create or access a Cloud Storage bucket — there's no longer a Storage option on the free Spark plan, even for tiny files. Blaze does have its own no-cost quota, so it *can* still cost $0/month for a small project, but it requires linking a credit/debit card, which isn't ideal for a student project people just want to try out.

To avoid that entirely, this build:
- Compresses each uploaded photo in the browser (resized to max 900px, re-encoded as JPEG) before it's saved — see `compressImage()` in `js/report.js`.
- Stores the compressed photo as a base64 string directly on the item's Firestore document, the same way the original localStorage version did.
- The Firestore security rule for `items` rejects any write over ~900KB as a safety net, since Firestore caps documents at 1MB total.

**Trade-offs to know about:**
- Firestore isn't really designed to hold binary blobs — this works fine for a small class project with modest traffic, but it's not how you'd do it at real scale.
- Very large or very detailed photos will look visibly compressed. You can raise the quality/size in `compressImage(e.target.result, 900, 0.7, ...)` if 900px/0.7 quality looks too soft, just keep an eye on staying under the 900KB rule.
- If your project later needs full-resolution photos or heavier media, that's exactly when it's worth revisiting Firebase Storage on Blaze (or a free alternative like Cloudinary/ImgBB) instead of stuffing images into Firestore.

## Optional next step: real admin enforcement

Right now any signed-in CampusFind user could open the browser console and call `deleteItem(...)` directly — the PIN is a UI convenience, not a security boundary. To lock that down properly:

1. Add a Cloud Function (or a one-time manual step in the Firebase console) that sets a **custom claim** `admin: true` on your own user's Firebase Auth account.
2. Change the two `allow update, delete` lines in `firestore.rules` to require `request.auth.token.admin == true`.

This is optional — most course/demo projects are fine leaving it as-is.
