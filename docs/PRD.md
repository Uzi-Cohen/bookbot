# HomeBulk — Redesign PRD (v2, Android first)

Read with `PRODUCT.md` (product context) — this file is the build plan. Everything below is ordered: do the phases in order, tickets top to bottom. Each ticket is sized for one working session and has a clear "done when".

---

## 1. Product

**One line:** open the app, it tells you what to train today with whatever you have at home, in the time you have.

**Users**
- People starting out at home (may move to a gym later).
- People with no gym access.
- Equipment from a full home setup down to **nothing at all**.

**Two ways to use it — both first-class**
| Quick mode | Full tracking |
|---|---|
| Open → start → tick sets → close. No typing required. | Log weight and reps for every set, see history, charts, PRs. |
| Detail stays out of the way. | Detail is one tap away, never forced. |

Rule: **every screen must work for quick mode with zero data entry.** Tracking detail is revealed, not required.

**Platforms:** Android ships first (APK now, Play later). iOS from the same code and same design — nothing Android-only. Phone, portrait only.

**Still undecided (don't design for either way yet):** calorie/nutrition tracking, units (kg-only today), accounts/sync, Hebrew/RTL.

---

## 2. Design bar

1. **Native, not a web page.** Material 3 structure on Android (bottom nav, top app bars, sheets, FAB-style primary action), matching native feel on iOS.
2. **Glanceable mid-workout.** Phone on the floor, sweaty hands: big numbers, 48dp minimum touch targets (the set tick ≥ 64dp), one primary action per screen.
3. **Real dark and light themes**, following the system. Contrast AA+ in both.
4. **System back works everywhere** (Android back gesture + predictive back), including closing sheets and leaving a workout safely.
5. **Rewarding.** Ticking a set, finishing an exercise, finishing a workout each get haptics + a small motion moment. One bigger moment on workout complete.
6. **Calm.** No dashboard clutter. Each screen answers one question.
7. **Honest paywall.** Clear prices, easy cancel, no fake urgency.

---

## 3. Phases & tickets

Legend: 📁 files touched · ✅ done when

### Phase 0 — Groundwork (no visible redesign yet)

**P0-1 Run the critique**
- Run `/impeccable critique` on the current app; save the output to `docs/critique-1.md`.
- ✅ scored list of issues committed; every issue is mapped to a ticket below or added as a new one.

**P0-2 Turn on Android predictive back**
- 📁 `app.json` → `android.predictiveBackGestureEnabled: true`.
- Make sure the active workout confirms before back-navigating out if sets are logged but not finished (it keeps the workout — nothing is lost, just confirm leaving).
- ✅ back gesture works on every screen and sheet on a real Android phone.

**P0-3 Design tokens + theme**
- 📁 replace `src/constants/theme.ts` with light + dark tokens: color roles (surface, surface-container, on-surface, primary, on-primary, outline, success, warning, error), type scale, spacing, radii, elevation.
- Add a `useTheme()` hook; theme follows the system.
- 📁 `app.json` → `userInterfaceStyle: "automatic"`.
- ✅ switching system theme flips the whole app with no hard-coded colors left (`grep '#' src/app src/components` returns only token files).

**P0-4 Install native building blocks**
- `npx expo install expo-haptics expo-keep-awake expo-notifications expo-symbols @expo/vector-icons`
- Wrap haptics in `src/lib/haptics.ts` (tick / success / heavy / selection) with a user setting to disable.
- ✅ typecheck + lint pass; a debug button on Settings fires each haptic.

**P0-5 Component kit**
- 📁 `src/components/` — rebuild on the new tokens: `Button` (filled / tonal / text), `Surface`, `ListItem`, `SegmentedControl`, `Chip`, `Stepper` (+/−, long-press repeat), `NumberPad`, `Sheet`, `ProgressRing`, `TopBar`, `EmptyState`, `Banner`.
- All touch targets ≥ 48dp, accessible labels, focus/pressed states.
- ✅ a hidden `/_kit` screen (dev only) shows every component in light and dark.

### Phase 1 — The core loop (Today → Workout → Complete)

**P1-1 Native navigation**
- 📁 `src/app/(tabs)/_layout.tsx` → native tabs (`expo-router/unstable-native-tabs`): Today, Progress, Program, Settings. Real icons (Material Symbols on Android, SF Symbols on iOS).
- Rename tab "Equipment" → **Program** (it holds equipment + the program).
- ✅ Material bottom nav on Android, native tab bar on iOS, correct selected states.

**P1-2 Today screen**
- 📁 `src/app/(tabs)/index.tsx`
- Hero: today's split name + minutes. Week strip (7 dots: done / planned / rest) under it.
- Normal / Express segmented control; Express shows minutes saved.
- Exercise list: name, sets × reps, last time's numbers in secondary text. Tap → exercise info sheet (not a full page).
- Primary action pinned at bottom: **Start workout**.
- States: training day · rest day ("Train anyway") · in progress (resume card with set progress) · done today · first day ever · subscription expired.
- ✅ all six states designed + built, both themes; from app open to first set in ≤ 2 taps.

**P1-3 Active workout — layout**
- 📁 `src/app/workout/[index].tsx` (+ new components)
- Top: progress bar across all sets of the workout; exercise X of N.
- Horizontal swipe between exercises (plus prev/next buttons).
- Demo area (collapsible). "Beat last time" line: `7.5 kg — 12 / 11 / 10 → beat 11 on your last set`.
- ✅ usable one-handed; nothing important below the thumb zone is hidden by the keyboard (there is no system keyboard — see P1-4).

**P1-4 Set entry without the keyboard**
- Quick mode: tapping the tick logs the **target reps and current weight** in one tap. (Today it blocks until reps are typed — remove that.)
- Full tracking: tap reps/kg → `NumberPad` sheet with quick chips (target −2 … +2) and a Stepper for weight (2.5 kg steps, 1.25 for barbell).
- Ticked set animates to done + tick haptic. Long-press a done set → edit.
- First-ever session (no target yet): tick logs the bottom of the rep range and shows "Edit if you did more".
- ✅ a full workout can be logged with only the tick button; full tracking needs no system keyboard.

**P1-5 Rest timer**
- `ProgressRing` countdown filling the lower half; ±15 s; Skip.
- Keeps counting in background; local notification + vibration when rest ends (`expo-notifications`, Android channel "Rest timer").
- `expo-keep-awake` during an active workout.
- ✅ with the phone locked, the rest-end notification arrives on time on a real Android phone.

**P1-6 Swap + info sheets**
- Swap exercise sheet (only before the first set of that exercise).
- Info sheet: cues, common mistakes, demo link.
- ✅ both close with back gesture and swipe-down.

**P1-7 PR moment**
- When a set beats the best reps at that weight (or any weight above), inline badge + success haptic.
- 📁 logic in `src/lib/progression.ts` (`isPersonalBest`) + unit test in `src/lib/logic.test.ts`.
- ✅ test passes; badge shows once per exercise per session.

**P1-8 Workout complete**
- 📁 `src/app/complete.tsx`
- One orchestrated moment: check → counters count up (sets, reps, minutes) → PR list → week strip fills today's dot. Heavy haptic. Respects reduce-motion.
- Actions: **Log bodyweight** (sheet), **Done**.
- ✅ moment plays once; reduce-motion shows the end state immediately.

### Phase 2 — Onboarding + equipment

**P2-1 Makeshift equipment (logic)**
- 📁 `src/lib/types.ts`, `src/data/exercises.ts`, `src/data/program.ts`
- New equipment: `backpack` (loadable with books/water), `waterJugs`, `chair` (sturdy), `table` (sturdy, for rows), `towel`, `doorFrame`, `stairs`.
- New exercises using them, e.g. backpack squat, backpack RDL, backpack row, jug curl, jug lateral raise, chair dips, chair split squat, towel door row, stair calf raise.
- Slot candidates ordered: real equipment → makeshift → bodyweight. Every slot still ends in a no-equipment option.
- Weighted makeshift items get an editable load (e.g. backpack 8 kg).
- ✅ unit tests: with only `backpack + chair`, every day has a full workout with no bodyweight-only fallback where a makeshift option exists.

**P2-2 Equipment picker**
- Tiles grid (icon + name), two groups: **Gym equipment** and **Around the house**. Selected state obvious in both themes. Weight stepper appears in-tile for dumbbells/barbell/backpack/jugs.
- "I have nothing" shortcut.
- Used in onboarding and on the Program tab (same component).
- ✅ picker usable with one thumb; "I have nothing" produces a valid program.

**P2-3 Onboarding flow**
- 📁 `src/app/onboarding.tsx` → split into steps with a progress indicator; back gesture goes to the previous step.
- Steps: philosophy → how you want to use it (**Just tell me what to do** / **I want to track everything** — sets a default, changeable in Settings) → equipment → training days → bodyweight (skippable) → **program reveal** (animated week built from their equipment) → paywall.
- ✅ completes in < 60 s; every step skippable except equipment and days.

**P2-4 Program tab**
- 📁 `src/app/(tabs)/equipment.tsx` → rename route to `program.tsx`.
- Equipment tiles at top, then Push / Pull / Legs with chosen exercise per slot; tap a slot → swap sheet.
- ✅ changes reflect instantly on Today.

### Phase 3 — Progress

**P3-1 Bodyweight chart**
- Real line chart (e.g. `victory-native` or `react-native-svg` hand-rolled) with a 7-day average line; change since start; the 3-week stall message.
- Log weight from a sheet with a Stepper (0.1 kg).
- ✅ readable in both themes; empty state tells you what to do.

**P3-2 Consistency**
- Calendar heat-map of workouts, current streak, best streak.
- 📁 streak logic in `src/lib/` + tests.
- ✅ streak counts training days only (rest days don't break it).

**P3-3 Lift history**
- List of lifts with a mini sparkline; tap → full history chart + table.
- Hidden in quick mode unless the user opens it.
- ✅ no lift history → friendly empty state.

### Phase 4 — Subscription

**P4-1 Plans**
| Plan | Price | Display |
|---|---|---|
| Weekly | ₪20/week (store point ₪19.90) | "₪20 per week" |
| Yearly | ₪150/year (store point ₪149.90) | "₪2.88 per week" + **Save 85%** + "₪150 billed yearly" |
- Save % = 1 − yearly ÷ (weekly × 52), computed at runtime from localized store prices — never hard-coded.
- 3-day free trial on yearly only (recommended).

**P4-2 RevenueCat**
- `npx expo install react-native-purchases react-native-purchases-ui`
- Products `homebulk_weekly`, `homebulk_yearly`; entitlement `pro`.
- 📁 `src/lib/subscription.ts` + store state (`isPro`, `trialEndsAt`, `billingIssue`), cached for offline.
- Needs a dev build (`eas build --profile development --platform android`), Play Console products (needs the $25 Play account), later App Store Connect.
- ✅ sandbox purchase, restore, and expiry all work on a real Android phone.

**P4-3 Free vs paid**
- Free: onboarding, program reveal, the first full workout.
- Paid: everything after the first completed workout.
- Lapsed: history stays readable; Today shows "Your program is waiting" + resubscribe. Data never deleted.

**P4-4 Paywall screen**
- Headline tied to their program ("Your 3-day home program is ready"), 3–4 benefit lines, two plan cards (yearly preselected with Save 85%), one primary button, trial timeline (Today → Day 2 reminder → Day 3 billing), Restore, Terms, Privacy, "Cancel anytime in Settings". Close button visible immediately.
- Shown: after program reveal (dismissible → free first workout), after first workout complete, from Settings.
- Real day-2 reminder notification for trials.
- ✅ matches store rules: billed amount as prominent as per-week price; no fake countdowns.

**P4-5 Subscription states**
- Trial active (days left in Settings) · subscribed · expired · billing issue (banner, not a blocker) · purchase failed/cancelled (plain message, stay on paywall) · restore found nothing.
- ✅ each state reachable via RevenueCat sandbox and designed.

### Phase 5 — Settings, polish, release

**P5-1 Settings**
- Mode (quick / full tracking), training days, reminder notification (time picker, training days only), rest-end sound, haptics toggle, subscription (plan, renewal, Manage, Restore), privacy, terms, reset data (confirm).
- ✅ every toggle persists and takes effect without restart.

**P5-2 Accessibility pass**
- Font scaling to 200% without clipping (set table numbers may stay fixed), TalkBack/VoiceOver labels on every control, reduce-motion respected.
- ✅ full workout completed with TalkBack on.

**P5-3 Second critique**
- `/impeccable critique` again → `docs/critique-2.md`; fix everything scored below target.

**P5-4 Store assets**
- Regenerate `store/screenshots/` from the new design (Android phone + iPhone 6.9"), update `store/listing.md`, Play feature graphic 1024×500.
- ✅ assets committed.

**P5-5 Release**
- `npx --yes eas-cli@latest build --platform android --profile preview` → test APK on device.
- Play: `--profile production` (AAB) → Play Console internal testing track.
- iOS once the Apple account is active: `--platform ios --profile production --auto-submit` → TestFlight.

---

## 4. Definition of done (every ticket)
- `npx tsc --noEmit`, `npx expo lint`, `npm test` pass.
- Checked in light and dark on a real Android phone.
- Back gesture behaves.
- Works in quick mode with zero typing.
- Design hook passes on the touched UI files.

## 5. Out of scope for this PRD
Accounts/sync (schema exists in `supabase/schema.sql`), nutrition/calorie tracking (still undecided), social, AI coaching, Health Connect / Apple Health, tablets, landscape.
