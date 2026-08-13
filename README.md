# Promised Land Initiative — Admin App

A secure, installable (PWA) admin app for managing the Promised Land
Initiative public website: gallery photos/video and site contact details.

## Stack

- **React 19 + Vite**
- **Firebase Authentication** — email/password, admin accounts only
  (no public sign-up screen)
- **Firestore** — stores gallery items and site settings
- **Cloudinary** — image/video storage, uploaded via signed requests
- **Firebase Cloud Functions** — signs Cloudinary uploads/deletes so the
  Cloudinary API secret never reaches the browser
- **vite-plugin-pwa** — installable on iPhone and Android as a home-screen app

## Security model

- **No public sign-up.** Admin accounts are created manually in the
  Firebase console (Authentication → Users → Add user). Anyone without
  an account you created cannot log in.
- **Every protected route requires a signed-in user** (`ProtectedRoute`
  redirects to `/login` otherwise).
- **Firestore rules** (`firestore.rules`) go beyond a simple
  "signed-in users can write" check. For every collection, they also
  validate the exact shape of the data:
  - Only a fixed, known set of fields can be written — no extra fields
    can be smuggled into a document, even by a signed-in admin's
    buggy client code.
  - Field types and lengths are enforced (e.g. a story's `summary`
    must be a string under 2000 characters, `age` must be a whole
    number 0–120).
  - `createdAt` is set once and locked — it can never be edited after
    creation.
  - `settings` writes are restricted to a single document
    (`settings/site`), so that collection can't become a dumping
    ground for arbitrary data.
  - **Stories specifically:** a story can never be saved with
    `published: true` unless `consentConfirmed: true` is also set —
    enforced here, server-side, so this safeguard holds even if
    someone calls Firestore directly instead of going through the
    admin app's form (which also requires the checkbox).
  - **Prayer requests — the one deliberate exception.** Visitors submit
    these from the public site with no login, so `prayerRequests`
    allows public `create` (strictly validated: fixed fields only,
    request text capped at 800 characters). But `update` is denied
    entirely and `delete` requires an admin — so a visitor can create
    a request, but can never edit or remove their own or anyone else's
    afterward. Moderation happens from the admin app's Prayer Requests
    tab.
- **Cloudinary uploads and deletes are signed server-side.** The admin
  app never holds the Cloudinary API secret — it calls a Cloud Function
  (`functions/index.js`), which checks the caller is authenticated,
  then signs the request using a secret stored only in the Functions
  environment.

### Optional next step: Firebase App Check

Everything above stops anyone who *isn't signed in* from writing data,
and constrains what a signed-in admin's client can send. For an extra
layer that also blocks traffic from outside this app entirely (e.g.
someone scripting requests against your Firestore/Functions endpoints
directly), consider adding
[Firebase App Check](https://firebase.google.com/docs/app-check) —
not required to launch, but worth doing once the site is live and
you want to lock things down further. It's most valuable for the
Prayer Requests form specifically, since that's the one path anyone
can write to without logging in — App Check would stop spam/bot
submissions without requiring visitors to sign in.

## Local development

```bash
npm install
cp .env.example .env   # fill in Firebase + Cloudinary values
npm run dev
```

## One-time setup

### 1. Firebase project

1. Create a project at https://console.firebase.google.com (or reuse the
   one for the public site).
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Authentication** → Users → **Add user** for each admin (this is the
   only way accounts get created — there is no in-app registration).
4. **Firestore Database** → Create database (production mode).
5. **Project settings** → General → add a **Web app** → copy the config
   values into `.env` (see `.env.example`).

### 2. Deploy Firestore rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # select your project
firebase deploy --only firestore:rules
```

**⚠️ Currently running in test mode.** `firestore.rules` (the file this
command deploys) is set to Firestore's temporary test-mode template —
open read/write to anyone, no login required, until **2026-09-10**,
after which it locks to deny-everything automatically. This was a
deliberate choice to keep building without needing Firebase billing
resolved immediately.

The real, hardened rules (auth required, per-field validation, the
consent-before-publish safeguard on Stories, etc. — see "Security
model" above) are saved in **`firestore.production.rules`**, ready to
go. Before the site has any real content — and definitely before
launch — copy that file over `firestore.rules` and redeploy:

```bash
cp firestore.production.rules firestore.rules
firebase deploy --only firestore:rules
```

Don't add real Stories (children's names/photos) while test mode is
active — the database is publicly writable until you make this swap.

### 3. Cloud Functions (Cloudinary signing)

```bash
cd functions
npm install
cd ..
firebase functions:secrets:set CLOUDINARY_API_SECRET
firebase functions:config:set 2>/dev/null || true   # (not used; see below)
```

This app uses Firebase Functions v2 **params**, not the legacy
`functions:config`. Set the non-secret values as environment variables
when deploying, or add them to `functions/.env` (gitignored):

```
# functions/.env
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

Then deploy:

```bash
firebase deploy --only functions
```

### 4. Cloudinary

1. Create a Cloudinary account (a **new** account gives you a fresh
   storage quota, separate from any other project).
2. From the dashboard, note the **Cloud name** and **API Key** — put
   both in `.env` (`VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_API_KEY`).
3. Note the **API Secret** — this goes **only** into
   `firebase functions:secrets:set CLOUDINARY_API_SECRET`, never into
   any `.env` file that ships to the browser.

## Deploying the admin app itself

Firebase Hosting is the simplest option since the project is already a
Firebase project, and it gives HTTPS by default (required for a PWA to
be installable):

```bash
npm run build
firebase deploy --only hosting
```

This publishes to `https://<project-id>.web.app`. You can attach a
custom subdomain (e.g. `admin.promisedlandinitiative.org`) under
**Hosting → Add custom domain** in the Firebase console.

## Installing on a phone (PWA)

Once deployed to a real HTTPS URL:

- **Android (Chrome):** open the site → menu (⋮) → "Add to Home
  screen" / "Install app."
- **iPhone (Safari):** open the site → Share button → "Add to Home
  Screen." (iOS ignores install prompts from other browsers — it must
  be opened in Safari.)

The app then launches full-screen with its own icon, like a native app.

## Project structure

```
functions/            ← Cloud Functions (Cloudinary signing)
src/
  context/AuthContext.jsx   ← Firebase Auth state
  components/ProtectedRoute.jsx
  components/Layout.jsx     ← nav shell for authenticated pages
  lib/firebase.js
  lib/cloudinary.js
  pages/Login.jsx
  pages/Dashboard.jsx
  pages/GalleryManager.jsx  ← upload / list / delete gallery media
  pages/Settings.jsx        ← org contact details (read by the public site)
```

## Connecting this to the public website

The public site (separate project) currently reads gallery items and
contact details from a static file. To make it dynamic, point it at the
same Firestore project and read from the `gallery` and `settings/site`
collections this app writes to — the shapes already match what the
public site's `src/data/content.js` expects (`publicId`, `resourceType`,
`caption` for gallery; `phone`, `email`, `location` for settings).
