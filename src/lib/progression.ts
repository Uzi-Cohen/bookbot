import type { Equipment, Exercise, RepRange, Session, SetLog } from './types';

export interface Performance {
  sessionId: string;
  date: string;
  sets: SetLog[];
}

/** Most recent completed sets for an exercise, excluding the given session. */
export function lastPerformance(history: Session[], exerciseId: string, excludeSessionId?: string): Performance | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const session = history[i];
    if (session.id === excludeSessionId) continue;
    const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
    const sets = ex?.sets.filter((s) => s.done && s.reps != null) ?? [];
    if (sets.length) return { sessionId: session.id, date: session.finishedAt ?? session.startedAt, sets };
  }
  return null;
}

export function formatPerformance(perf: Performance, withWeight: boolean): string {
  const reps = perf.sets.map((s) => s.reps).join(' / ');
  const weight = perf.sets[0]?.weight;
  return withWeight && weight != null ? `${weight} kg — ${reps}` : reps;
}

export interface Suggestion {
  /** Rep target per set (null = no target yet). */
  targets: (number | null)[];
  message: string;
}

/**
 * Double progression: add reps within the range, then add load (or, when
 * the user is maxed out on equipment, make the reps harder).
 */
export function suggest(
  exercise: Exercise,
  range: RepRange,
  setCount: number,
  prev: Performance | null,
  equipment: Equipment,
): Suggestion {
  const [min, max] = range;
  const side = exercise.perSide ? ' per side' : '';

  if (!prev) {
    const how =
      exercise.load === 'bodyweight'
        ? `Do as many clean reps as you can, up to ${max}${side}.`
        : `Pick a load you can move for ${min}–${max} reps${side} with good form.`;
    return { targets: Array(setCount).fill(null), message: `First time. ${how} Stop 1–2 reps before failure.` };
  }

  const reps = prev.sets.map((s) => s.reps ?? 0);
  const targets = Array.from({ length: setCount }, (_, i) => {
    const last = reps[Math.min(i, reps.length - 1)];
    return Math.min(last + 1, max);
  });

  if (reps.length >= setCount && reps.every((r) => r >= max)) {
    const weight = prev.sets[prev.sets.length - 1].weight ?? 0;
    const maxedOut =
      (exercise.load === 'dumbbell' && weight >= equipment.dumbbellKg) ||
      (exercise.load === 'barbell' && weight >= equipment.barbellKg);
    let message: string;
    if (exercise.load === 'band') message = `You hit ${max} on every set. Use a stronger band or stand further away.`;
    else if (exercise.load === 'bodyweight' || maxedOut)
      message = `You hit ${max} on every set. Make it harder: take 3 seconds to lower each rep and pause at the bottom.`;
    else message = `You hit ${max} on every set. Go heavier today and build the reps back up.`;
    return { targets: Array(setCount).fill(null), message };
  }

  const final = reps[reps.length - 1];
  return { targets, message: `Try to beat ${final} reps on your final set.` };
}
