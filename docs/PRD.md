# HomeBulk: Redesign + Subscription PRD

Status: ready for design. Scope: a full visual and interaction redesign of the existing app, plus a paid subscription.

## 1. Product in one line

Open the app and it tells you exactly what to train today, with the equipment you own, in the time you have. No gym, no calorie counting.

**Who it's for:** someone working full-time who wants to get bigger and stronger at home with limited equipment (e.g. 7.5 kg dumbbells, a light barbell, a bench, a pull-up bar), and who has failed before because programs were too long, needed a gym, or needed a food diary.

**The one job:** get the user from opening the app to starting their first set in under 10 seconds, every day, and make them want to come back tomorrow.

## 2. What exists today (don't lose any of it)

Expo SDK 57, Expo Router, TypeScript. Local-only storage (AsyncStorage). The logic is done and tested. This redesign is about UI, motion and feel, plus the paywall.

| Screen | File | What it does |
|---|---|---|
| Onboarding | `src/app/onboarding.tsx` | Philosophy screen → equipment → training days + optional bodyweight |
| Today | `src/app/(tabs)/index.tsx` | Today's split (Push/Pull/Legs), minutes, Normal/Express toggle, exercise list, start. Also rest-day, in-progress and done states |
| Exercise / set logging | `src/app/workout/[index].tsx` | Demo, previous performance, progression hint, set table (kg / reps / ✓), rest timer, swap exercise, cues, mistakes |
| Workout complete | `src/app/complete.tsx` | Sets, reps, minutes, per-exercise summary |
| Progress | `src/app/(tabs)/progress.tsx` | Bodyweight log + chart + 3-week trend message, workouts this week, last session per lift |
| Equipment | `src/app/(tabs)/equipment.tsx` | Equipment checklist + the full program with swap chips per slot |
| Settings | `src/app/(tabs)/settings.tsx` | Training days, how it works, reset data |
| Exercise detail | `src/app/exercise/[id].tsx` | Demo, cues, mistakes, history |

Logic you don't need to touch: `src/lib/*` (program generator, express mode, progression, bodyweight trend), `src/data/*` (exercise library, program), `src/store/store.tsx` (state and actions). UI pieces that get replaced: `src/components/*`, `src/constants/theme.ts`.

## 3. Design goals

1. **Feels like a top-tier 2026 native app**, not a web page in a wrapper. Native navigation, native tab bar, haptics, fluid motion, system fonts or one deliberate custom face.
2. **Glanceable mid-workout.** Sweaty hands, phone on the floor two metres away. Huge numbers, huge tap targets, one primary action per screen.
3. **Calm, not a dashboard.** The app's promise is "no complicated dashboards". Every screen answers one question.
4. **Rewarding.** Finishing a set and finishing a workout should feel good: haptic, motion, a visible streak.
5. **Honest.** No dark patterns in the paywall. Prices are clear, cancelling is easy to find.

## 4. Platform and interaction requirements

- **Tabs:** native tabs (`expo-router/unstable-native-tabs`, Liquid Glass on iOS 26). Icons from SF Symbols via `expo-symbols` on iOS and Material Symbols on Android. No text glyphs as icons.
- **Light and dark mode**, following the system. The current app is dark-only.
- **Dynamic Type:** layouts survive the largest accessibility text size. Numbers can stay fixed-size inside the set table.
- **Haptics** (`expo-haptics`): light when a set is ticked, success when an exercise is complete, heavy success when the workout is complete, selection when a chip or toggle changes.
- **Motion** (`react-native-reanimated`, already installed): shared-element or morph transition from an exercise row to the exercise screen, animated set tick, animated rest ring, a workout-complete moment. Respect Reduce Motion.
- **Bottom sheets** for secondary actions: swap exercise, edit a logged set, log bodyweight, exercise info. Native sheet presentation (`presentation: 'formSheet'` with detents) where possible.
- **Keyboard:** reps and kg entry should not rely on the system keyboard. Use a custom number pad or steppers (+/− with long-press to repeat), plus quick-pick chips for the target reps. The decimal pad on iOS has no Done key, which is a problem today.
- **Rest timer:** a big circular countdown with ±15 s buttons. It keeps running in the background, with a local notification when rest ends. **iOS Live Activity / Dynamic Island** for the rest timer is a stretch goal.
- **Keep awake** during an active workout (`expo-keep-awake`).
- **Home screen widget** (stretch): today's split and the minutes, tap to start.
- **Accessibility:** every control labelled, contrast AA or better in both themes, 44 pt minimum tap targets (56 pt+ for the set tick).

## 5. Screen-by-screen requirements

### 5.1 Onboarding (first launch)
1. **Philosophy:** "You don't need a perfect diet. You don't need a gym. You don't need two hours a day. You just need to keep showing up." One memorable visual moment here, then a single button: **Build my program**.
2. **Equipment:** big tappable tiles with an illustration or symbol per item, rather than a checklist. Dumbbells and barbell ask for the heaviest weight with a stepper (2.5 kg steps).
3. **Training days:** a week strip with the days to tap. Show the recommendation "3–4 days fits a full-time job".
4. **Bodyweight** (optional): a big wheel or stepper, skippable.
5. **Program reveal:** animate the generated Push / Pull / Legs week built from their equipment, e.g. "Your program: 15 exercises, all doable with what you own." This is the payoff moment right before the paywall.
6. **Paywall** (see §6).

### 5.2 Today
- The header shows the date, the split name as the hero ("PUSH"), and the minutes.
- **Normal / Express** segmented control. Express shows the time saved.
- The exercise list shows name, sets × reps and last time's numbers in small text. Tapping a row opens the exercise.
- A persistent **Start workout** button at the bottom.
- **Streak / consistency** indicator: the current week as 7 dots (done / planned / rest).
- **States to design:** training day, rest day ("Train anyway"), workout in progress (resume card with progress), workout done ("Workout complete ✓" + next up), first-ever day, subscription expired (§6.5).

### 5.3 Active workout (the most important screen)
- One exercise per page. Swipe horizontally between exercises, and show a progress bar of all sets across the whole workout at the top.
- **Demo video** at the top: collapsible, and looping muted when a clip exists.
- **"Beat last time" card:** previous `7.5 kg — 12 / 11 / 10` and the target for today.
- **Set rows:** kg and reps with steppers or a number pad, and a big tick. A ticked set animates to done, fires a haptic, and starts rest.
- **Rest timer** takes over the lower part of the screen with a ring, ±15 s and Skip. When rest ends: haptic, sound (respecting silent mode), and a notification if backgrounded.
- **Swap exercise** sheet, only before the first set of that exercise.
- **Cues and common mistakes** below the fold or in an info sheet.
- **Finish** is always reachable. Discarding a workout needs a confirmation.
- **PR moment:** when a set beats the best reps at that weight, show a small inline celebration.

### 5.4 Workout complete
- One orchestrated celebration: the checkmark, then sets / reps / minutes counting up, and any PRs.
- The streak updates visibly.
- Quick "Log bodyweight" and "Done".
- Stretch: a shareable summary card (image) for Instagram stories.

### 5.5 Progress
- **Bodyweight:** a proper line chart with a 7-day average line, the change since start (📈 +1.0 kg), and the 3-week stall message ("Your weight hasn't increased for 3 weeks. Consider adding another daily snack."). Log weight from a sheet.
- **Consistency:** a calendar heat-map of workouts, with the current and best streak.
- **Lifts:** a list of exercises with a mini sparkline of top-set reps × weight. Tapping one opens its history chart.

### 5.6 Equipment & program
- Equipment tiles, the same component as onboarding.
- The program view shows the three days, and each slot shows the chosen exercise with alternatives in a swap sheet.

### 5.7 Settings
- Training days, units (kg/lb, a new requirement), rest timer sound, haptics toggle, notifications (training-day reminder at a chosen time).
- **Subscription:** current plan, renewal date, Manage subscription (opens the store's page), Restore purchases.
- Privacy policy, Terms, Reset all data (with confirmation).

## 6. Subscription

### 6.1 Plans (Israel pricing, ILS)
| Plan | Price | Shown as |
|---|---|---|
| Weekly | ₪20 / week | ₪20 per week |
| Yearly | ₪150 / year | ₪2.88 per week · **Save 85%** |

The "Save 85%" badge is calculated against the weekly plan: ₪20 × 52 = ₪1,040 a year versus ₪150, which is 85.6% less. Always show the full billed amount ("₪150 billed yearly") in the same visual weight as the per-week figure. Apple and Google both require this, and it keeps the offer honest.

Use the nearest App Store / Play price points (e.g. ₪19.90 / ₪149.90). The badge percentage is computed from the actual localized store prices at runtime, never hard-coded, so it stays correct in every country and currency.

**Recommended:** a 3-day free trial on the yearly plan only. The weekly plan has no trial. This makes yearly the obvious choice without hiding the weekly option.

### 6.2 What's free vs paid
- **Free, forever:** onboarding, the program reveal, and the first workout (full, not a demo).
- **Paid:** everything after the first completed workout: the daily program, Express mode, progression targets, progress history and charts.
- If the subscription lapses, the user keeps read access to their history, and Today shows the paywall instead of the workout (§6.5). Data is never deleted.

### 6.3 Paywall screen
- Shown after the program reveal in onboarding (dismissible, "Start my free workout first" goes on to the free workout), again after the first workout is completed, and from Settings.
- **Content:** a headline tied to their own program ("Your 3-day home program is ready"), 3–4 short benefit lines, the two plan cards with yearly preselected and carrying the Save 85% badge, and one primary button ("Start 3-day free trial" for yearly, "Subscribe for ₪20/week" for weekly). Below that: Restore purchases, Terms, Privacy, and "Cancel anytime in Settings".
- **Trial timeline** for yearly: Today (full access) → Day 2 (reminder notification) → Day 3 (billing starts). Send the reminder notification for real.
- No fake countdowns, no "only today" pricing, no pre-ticked upsells, and the close button is visible without delay.

### 6.4 Implementation
- Use **RevenueCat** (`react-native-purchases`, plus `react-native-purchases-ui` if its paywall template fits the design) for App Store and Google Play subscriptions. Payments for digital content must go through in-app purchase on both stores.
- Products: `homebulk_weekly`, `homebulk_yearly` in one subscription group. Entitlement: `pro`.
- The app reads the entitlement on launch and on foreground, and caches it for offline use.
- Needs a development build (not Expo Go) and store products configured in App Store Connect and Play Console.

### 6.5 States to design
- Trial active (days left, visible in Settings).
- Subscribed.
- Expired: Today shows "Your program is waiting" with a resubscribe option, and history stays visible.
- Billing issue (grace period): an inline banner, not a blocker.
- Purchase failed or cancelled: a plain message saying what happened, and the user stays on the paywall.
- Restore found nothing: explain it and offer to contact support.

## 7. Content and tone
- Plain, direct and short: "Start workout", "Log weight", "Beat 11 reps on your final set."
- Sentence case. Buttons say exactly what happens.
- Encouraging without being cheesy. No exclamation-mark spam, no emoji in body copy (the 📈 on the weight change is the exception).
- Units: kg by default, lb optional.

## 8. Out of scope (for this pass)
Accounts and cloud sync (the Supabase schema exists in `supabase/schema.sql` for later), social features, AI coaching, nutrition logging of any kind, Apple Health / Health Connect (next pass: write workouts and read bodyweight).

## 9. Done means
- Every screen and state in §5 and §6.5 is designed and built, in light and dark.
- `npx tsc --noEmit`, `npx expo lint` and `npm test` pass.
- Tested on a real iPhone and a real Android phone: a full workout logged one-handed without the system keyboard, rest timer notification while the phone is locked, purchase and restore in sandbox.
- Store screenshots in `store/screenshots/` regenerated from the new design.

## 10. Open questions
1. App name: keep "HomeBulk"? It sets the tone for the whole visual identity.
2. Hebrew / RTL support at launch, given Israel pricing? It affects layout (mirroring) and must be decided before design.
3. Demo videos: film our own 15–25 s clips (consistent look, big improvement to the exercise screen), or keep the YouTube link for launch?
