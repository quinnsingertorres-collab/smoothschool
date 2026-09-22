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
7. Once it's created, go to the **Rules** tab and paste in the contents
   of [`firestore.rules`](firestore.rules) from this repo, then
   **Publish**. Each account can only read and write its own data under
   `users/{uid}/…`.
8. In the left sidebar: **Build → Authentication → Get started →
   Sign-in method → Email/Password → Enable → Save**. The app uses
   usernames, but under the hood each username is stored as a
   Firebase email-style login (`<username>@users.smoothschool.app`) —
   nobody ever sees or needs that address.

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

## 2c. Accounts

Anyone can open `/login`, pick **Create an account**, and choose a
username and password. Every account gets its own classes, homework,
schedules, planner and days off — nobody can see anyone else's.

In **Settings** (sidebar) each person can set their name and the app's
name. By default the app is called "<Name>'s School"; type anything in
**App name** to override it. The name shows in the sidebar, the mobile
top bar and the browser tab.

**Moving over data from before accounts existed:** sign in to your
account, open **Settings**, and click **Import old data**. That copies
the old shared classes/schedule/planner into your account. Do this
*before* publishing the rules in `firestore.rules` — once they're live
the old data is locked away and the import button disappears.

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
   same six `NEXT_PUBLIC_FIREBASE_*` values from your `.env.local`. Vercel can't read your local
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
  (app)/settings/  your name, app name, import old data, log out
  login/           sign in / create account
  api/weather/     server route that calls the free NWS weather API
components/        AuthProvider (accounts), AuthGate, Sidebar, add-class modal, icons, weather
lib/               Firestore data model, date/slug helpers, legacy-data import
firestore.rules    per-account Firestore security rules
```

Each class's page lives at `/<slugified-class-name>` (e.g. "AP
Biology" → `/ap-biology`). The slug is set once, when the class is
created.

## Weather

The dashboard shows current conditions for Medford, MA from the
National Weather Service (api.weather.gov) — it's free and requires no
API key. To point it at a different town, edit the `LAT`/`LON`
constants in `app/api/weather/route.ts`.
