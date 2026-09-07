# SmoothSchool

A class manager: homework, projects, links, schedule, and after-school
planning, one place per class. Built with Next.js and Firebase.

This README walks through all three setup steps in order: **GitHub →
Firebase → Vercel**. Do them in that order — Vercel's step needs the
GitHub repo to exist, and you'll want your Firebase keys in hand before
you deploy.

## 1. Push this to GitHub

1. Go to [github.com/new](https://github.com/new).
2. Repository name: `smoothschool` (or anything you like).
3. Leave it **empty** — don't add a README, .gitignore, or license (you
   already have those here).
4. Click **Create repository**. Keep the page open; it shows the exact
   push commands for "an existing repository."
5. In a terminal, `cd` into this project folder, then run:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/smoothschool.git
   git push -u origin main
   ```

   (Swap in the URL GitHub showed you in step 4 if it differs.)

## 2. Set up Firebase (the backend)

This is what makes your classes, homework, and schedule survive a
refresh and sync across devices — without it the app still works, but
only for the current browser tab.

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
   and sign in with the Google account you want to own this data.
2. **Add project** → name it `smoothschool` (or anything) → you can
   leave Google Analytics off, it's not needed here.
3. Once the project opens, click the **`</>`** (web) icon under "Get
   started by adding Firebase to your app."
4. Give the web app a nickname (e.g. "SmoothSchool web") → **Register
   app**. You don't need Firebase Hosting.
5. Firebase shows you a `firebaseConfig` object — six values
   (`apiKey`, `authDomain`, `projectId`, `storageBucket`,
   `messagingSenderId`, `appId`). Keep this tab open; you'll need it in
   both step 2b and step 3.
6. In the left sidebar: **Build → Firestore Database → Create
   database**. Choose a location close to you, and start in
   **production mode** (the rules below replace the default).
7. Once it's created, go to the **Rules** tab and replace the contents
   with:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

   **What this means:** anyone who has your Firestore project id can
   read and write this data — there's no login built into this app.
   That's fine for a personal homework tracker nobody else knows the
   id of, but don't put anything sensitive in it. If you'd like real
   login-gated access later, that's a follow-up (Firebase Auth) worth
   asking for.

### 2b. Add your Firebase keys locally

1. In this project folder, copy `.env.local.example` to `.env.local`.
2. Paste in the six values from step 5 above, e.g.:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=smoothschool-xxxxx.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=smoothschool-xxxxx
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=smoothschool-xxxxx.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

3. `.env.local` is already in `.gitignore` — it never gets pushed to
   GitHub, so your keys stay out of the public repo. (These particular
   keys aren't secret the way a password is — Firebase's real security
   boundary is the Firestore rules above, not hiding this config — but
   there's no reason to publish them either.)

## 2c. Optional: put a password on the app

By default anyone with the URL can open the app. To require a password
first, set one environment variable:

```
APP_PASSWORD=yourpassword
```

Add it to `.env.local` for local dev, and to Vercel's Environment
Variables for the live site (same place as the Firebase keys). Leave it
unset to leave the app open — no password screen appears.

This is a single shared password for the whole app, not a real login
system, and it only gates the Next.js pages. The Firestore rules above
are still `allow read, write: if true`, so the data itself remains
readable by anyone with the Firebase config values (which ship in the
public JS bundle regardless). Think of it as a "don't share this link"
lock on the front door, not a vault — good enough to keep the site from
being casually stumbled on, not a substitute for real auth.

## 3. Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should land on
`/home`. If the banner under the date says Firebase isn't configured,
double check `.env.local`.

## 4. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in (GitHub
   login is easiest).
2. **Import** the `smoothschool` repo you pushed in step 1.
3. Before clicking Deploy, open **Environment Variables** and add the
   same six `NEXT_PUBLIC_FIREBASE_*` values from your `.env.local`
   (plus `APP_PASSWORD` if you set one). Vercel can't read your local
   `.env.local` file — it needs its own copy.
4. Click **Deploy**. Vercel will build and give you a live URL
   (`smoothschool-<something>.vercel.app`); every future push to
   `main` redeploys automatically.

## Project structure

```
app/
  (app)/home/      "Today" dashboard (date, weather, due-soon, classes)
  (app)/planner/   weekly after-school planner
  (app)/schedule/  periods, lunch block, and days-off (no school)
  (app)/[classname]/  one page per class, e.g. /ap-biology
  login/           password screen (only shown if APP_PASSWORD is set)
  api/weather/     server route that calls the free NWS weather API
  api/login/        api/logout/  password check + session cookie
proxy.ts            gates every page behind APP_PASSWORD, if set
components/        Sidebar, add-class modal, shared icons, weather widget
lib/               Firestore data model, date/slug helpers, password check
```

Each class's page lives at `/<slugified-class-name>` (e.g. "AP
Biology" → `/ap-biology`). The slug is set once, when the class is
created.

## Weather

The dashboard shows current conditions for Medford, MA from the
National Weather Service (api.weather.gov) — it's free and requires no
API key. To point it at a different town, edit the `LAT`/`LON`
constants in `app/api/weather/route.ts`.
