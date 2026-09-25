/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EXERCISES } from '../data/exercises';
import { PROGRAM } from '../data/program';
import { trend } from './bodyweight';
import { alternatives, buildWorkout, canDo, createSession, nextDayId, planMinutes } from './generate';
import { lastPerformance, suggest } from './progression';
import type { Equipment, Session } from './types';

const none: Equipment = {
  owned: { dumbbells: false, barbell: false, bench: false, pullupBar: false, bands: false, cable: false, squatRack: false },
  dumbbellKg: 0,
  barbellKg: 0,
};
const homeGym: Equipment = {
  owned: { ...none.owned, dumbbells: true, barbell: true, bench: true, pullupBar: true },
  dumbbellKg: 7.5,
  barbellKg: 10,
};

test('every slot references real exercises and has a no-equipment fallback', () => {
  for (const day of Object.values(PROGRAM)) {
    for (const slot of day.slots) {
      for (const id of slot.candidates) assert.ok(EXERCISES[id], `${slot.id}: ${id}`);
      assert.ok(alternatives(slot, none).length > 0, `${slot.id} has no bodyweight option`);
    }
  }
});

test('program follows the equipment the user owns', () => {
  const push = buildWorkout('push', 'full', homeGym, {});
  assert.deepEqual(
    push.map((p) => p.exercise.name).slice(0, 3),
    ['DB Bench Press', 'DB Shoulder Press', 'Push-ups'],
  );
  for (const day of ['push', 'pull', 'legs'] as const) {
    for (const p of buildWorkout(day, 'full', none, {})) assert.ok(canDo(p.exercise, none), p.exercise.id);
  }
  // No squat rack → no barbell back squat.
  assert.equal(buildWorkout('legs', 'full', homeGym, {})[0].exercise.id, 'goblet-squat');
});

test('express mode keeps the core lifts and is much shorter', () => {
  const full = buildWorkout('push', 'full', homeGym, {});
  const express = buildWorkout('push', 'express', homeGym, {});
  assert.deepEqual(express.map((p) => p.sets), [3, 3, 2]);
  assert.ok(planMinutes(express, 'express') <= 20);
  assert.ok(planMinutes(full, 'full') > planMinutes(express, 'express') + 10);
});

test('swaps are honoured only when the equipment allows them', () => {
  assert.equal(buildWorkout('push', 'full', homeGym, { 'push-horizontal': 'db-floor-press' })[0].exercise.id, 'db-floor-press');
  assert.equal(buildWorkout('push', 'full', none, { 'push-horizontal': 'db-floor-press' })[0].exercise.id, 'push-up');
});

function finished(session: Session, reps: number[][]): Session {
  return {
    ...session,
    finishedAt: session.startedAt,
    exercises: session.exercises.map((e, i) => ({
      ...e,
      sets: (reps[i] ?? []).map((r) => ({ weight: e.sets[0].weight, reps: r, done: true })),
    })),
  };
}

test('rotation continues from the last completed workout', () => {
  assert.equal(nextDayId([]), 'push');
  const push = finished(createSession('push', 'full', homeGym, {}, []), []);
  assert.equal(nextDayId([push]), 'pull');
  const legs = { ...push, dayId: 'legs' as const };
  assert.equal(nextDayId([push, legs]), 'push');
});

test('progression: beat last time, then go heavier or harder', () => {
  const bench = EXERCISES['db-bench-press'];
  const s1 = finished(createSession('push', 'full', homeGym, {}, []), [[12, 11, 10]]);
  assert.equal(s1.exercises[0].sets[0].weight, 7.5);
  const prev = lastPerformance([s1], bench.id);
  assert.ok(prev);
  const s = suggest(bench, [8, 15], 3, prev, homeGym);
  assert.deepEqual(s.targets, [13, 12, 11]);
  assert.match(s.message, /beat 10 reps on your final set/);

  const maxed = finished(createSession('push', 'full', homeGym, {}, []), [[15, 15, 15]]);
  const atMax = suggest(bench, [8, 15], 3, lastPerformance([maxed], bench.id), homeGym);
  assert.match(atMax.message, /3 seconds/);
  const heavier = suggest(bench, [8, 15], 3, lastPerformance([maxed], bench.id), { ...homeGym, dumbbellKg: 12.5 });
  assert.match(heavier.message, /Go heavier/);

  // Next session starts with last used weight.
  const s2 = createSession('push', 'full', { ...homeGym, dumbbellKg: 20 }, {}, [s1]);
  assert.equal(s2.exercises[0].sets[0].weight, 7.5);
});

test('bodyweight trend flags a 3-week stall', () => {
  const today = '2026-09-25';
  const stalled = [
    { date: '2026-09-01', kg: 61.5 },
    { date: '2026-09-03', kg: 61.4 },
    { date: '2026-09-22', kg: 61.5 },
    { date: '2026-09-24', kg: 61.4 },
  ];
  assert.equal(trend(stalled, today).tone, 'warn');
  const gaining = [
    { date: '2026-09-01', kg: 61.0 },
    { date: '2026-09-24', kg: 62.0 },
  ];
  const t = trend(gaining, today);
  assert.equal(t.tone, 'good');
  assert.equal(t.total, 1);
  assert.equal(trend([{ date: today, kg: 61 }], today).total, null);
});
