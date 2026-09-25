# HomeBulk

Get bigger and stronger at home, with the equipment you own, around a full-time job. No calorie tracking.

Open the app and it tells you what to do today:

```
TODAY — SUNDAY
PUSH · 33 minutes

1. DB Bench Press      3 × 8–15 · Rest 90 sec   [Start set]
2. DB Shoulder Press   3 × 8–15 · Rest 90 sec   [Start set]
3. Push-ups            3 × 8–20 · Rest 60 sec   [Start set]
…
```

## Features

- **Equipment-aware program.** Tick what you own (dumbbells + max weight, barbell, bench, pull-up bar, bands, cable, rack). Every slot in the Push / Pull / Legs program picks the best exercise you can actually do, down to a no-equipment option. Swap any exercise from the alternatives you have.
- **Express mode.** "Busy today?" keeps the 3 core lifts, trims sets and rest, and gets it down to about 15 minutes.
- **Exercise screen.** Demo video (plays a clip when an exercise has `videoUrl`, otherwise opens a short demo search), setup/lower/press cues, common mistakes.
- **Set logging + rest timer.** Weight is pre-filled from last time. Tick a set and the rest timer starts.
- **Progression built in.** Shows last session (`7.5 kg — 12 / 11 / 10`) and what to beat today. Hit the top of the range on every set → go heavier, or, if you're already at your heaviest dumbbell, slow the reps down.
- **Rotation, not a calendar.** Pick your training days. Push → Pull → Legs always continues from the last session, so a missed day never skips a workout. Non-training days show a rest day with a "train anyway" option.
- **Bodyweight only.** Log your weight; see the change. If it hasn't gone up in 3 weeks: "Consider adding another daily snack."

## Stack

Expo (SDK 57) + Expo Router + TypeScript. Data is stored on-device (AsyncStorage). `supabase/schema.sql` has the Postgres schema (with row-level security) for adding sync later.

```
src/
  app/            screens (Expo Router)
    onboarding.tsx          philosophy → equipment → training days
    (tabs)/index.tsx        Today
    (tabs)/progress.tsx     bodyweight + lifts
    (tabs)/equipment.tsx    equipment + program/swaps
    (tabs)/settings.tsx
    workout/[index].tsx     exercise + video + set logging
    exercise/[id].tsx       exercise details + history
    complete.tsx            workout complete
  data/           exercise library + Push/Pull/Legs program
  lib/            program generator, progression, bodyweight trend (pure, tested)
  store/          app state + persistence
```

## Run it

```bash
npm install
npx expo start        # press i / a, or scan the QR code with Expo Go
npm run web           # in the browser
```

## Checks

```bash
npm run typecheck
npm test              # program generation, express mode, progression, bodyweight trend
```

## Adding demo videos

Add a `videoUrl` (15–25 s MP4, e.g. from Supabase Storage) to an exercise in `src/data/exercises.ts`. It plays muted on a loop above the set log.

## Release to TestFlight → App Store

The app builds in Expo's cloud (EAS), so you don't need a Mac or Xcode. Build config is in `eas.json`. Bundle ID is `com.uzicohen.homebulk` (`app.json`). Build numbers go up automatically.

### What you need
- An **Apple Developer Program** membership ($99/year): https://developer.apple.com/programs/enroll/
- A free **Expo** account: https://expo.dev/signup

### First build (run from any computer with Node 22, once)
```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest init                    # links the project to your Expo account (writes projectId into app.json — commit it)
npx eas-cli@latest build --platform ios --profile production --auto-submit
```
When it asks, sign in with your Apple ID and say **yes** to everything. EAS will:
1. create the certificates and provisioning profile,
2. create the app in App Store Connect,
3. build it in the cloud (~15 min),
4. upload it to TestFlight.

Apple then processes the build (~10–30 min). Install **TestFlight** on your iPhone, open App Store Connect → your app → TestFlight, and add yourself as an internal tester.

### Later builds (from GitHub, one click)
1. Create a token at https://expo.dev/settings/access-tokens and add it as a repo secret named `EXPO_TOKEN` (GitHub → Settings → Secrets and variables → Actions).
2. Set up an App Store Connect API key for EAS so it can upload without asking: `npx eas-cli@latest credentials` → iOS → production → App Store Connect API Key → set up.
3. GitHub → Actions → **TestFlight** → Run workflow.

### Going live on the App Store
In App Store Connect → your app:
1. Fill in the listing from `store/listing.md` and upload `store/screenshots/` (6.9" iPhone).
2. Privacy Policy URL: the link to `PRIVACY.md` on GitHub (the repo must be public for that to work — or paste the text on any web page).
3. App Privacy → **Data Not Collected**.
4. Pick the TestFlight build under "Build", then **Add for Review** → **Submit**. Review usually takes 1–2 days.
