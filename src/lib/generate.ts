import { EXERCISES, getExercise } from '../data/exercises';
import { PROGRAM, ROTATION } from '../data/program';
import type {
  DayId,
  Equipment,
  Exercise,
  RepRange,
  Session,
  SetLog,
  Slot,
  WorkoutMode,
} from './types';

export interface PlannedExercise {
  slot: Slot;
  exercise: Exercise;
  sets: number;
  reps: RepRange;
  restSec: number;
}

const WORK_SEC_PER_SET = 40;
const EXPRESS_MAX_EXERCISES = 3;
const EXPRESS_MAX_REST_SEC = 60;

export function canDo(exercise: Exercise, equipment: Equipment): boolean {
  return exercise.requires.every((id) => equipment.owned[id]);
}

/** Exercises the user can do for a slot, in order of preference. */
export function alternatives(slot: Slot, equipment: Equipment): Exercise[] {
  return slot.candidates.map(getExercise).filter((e) => canDo(e, equipment));
}

export function pickExercise(slot: Slot, equipment: Equipment, swaps: Record<string, string>): Exercise {
  const options = alternatives(slot, equipment);
  const swapped = swaps[slot.id];
  const chosen = options.find((e) => e.id === swapped) ?? options[0];
  // Every slot ends with a no-equipment option, so this only guards bad data.
  return chosen ?? getExercise(slot.candidates[slot.candidates.length - 1]);
}

export function buildWorkout(
  dayId: DayId,
  mode: WorkoutMode,
  equipment: Equipment,
  swaps: Record<string, string>,
): PlannedExercise[] {
  const slots = PROGRAM[dayId].slots;
  const chosen = mode === 'express' ? slots.filter((s) => s.core).slice(0, EXPRESS_MAX_EXERCISES) : slots;
  return chosen.map((slot) => ({
    slot,
    exercise: pickExercise(slot, equipment, swaps),
    sets: mode === 'express' ? (slot.expressSets ?? slot.sets) : slot.sets,
    reps: slot.reps,
    restSec: mode === 'express' ? Math.min(slot.restSec, EXPRESS_MAX_REST_SEC) : slot.restSec,
  }));
}

export function estimateMinutes(plan: { sets: number; restSec: number; perSide?: boolean }[], mode: WorkoutMode): number {
  const warmUpSec = mode === 'express' ? 120 : 300;
  const workSec = plan.reduce((sum, p) => {
    const work = WORK_SEC_PER_SET * (p.perSide ? 2 : 1);
    return sum + p.sets * (work + p.restSec);
  }, 0);
  return Math.round((warmUpSec + workSec) / 60);
}

export function planMinutes(plan: PlannedExercise[], mode: WorkoutMode): number {
  return estimateMinutes(
    plan.map((p) => ({ sets: p.sets, restSec: p.restSec, perSide: p.exercise.perSide })),
    mode,
  );
}

/** The next day in the rotation, so a missed day never skips a session. */
export function nextDayId(history: Session[]): DayId {
  const last = history[history.length - 1];
  if (!last) return ROTATION[0];
  return ROTATION[(ROTATION.indexOf(last.dayId) + 1) % ROTATION.length];
}

export function defaultWeight(exercise: Exercise, equipment: Equipment): number | null {
  if (exercise.load === 'dumbbell') return equipment.dumbbellKg || null;
  if (exercise.load === 'barbell') return equipment.barbellKg || null;
  return null;
}

export function usesWeight(exercise: Exercise): boolean {
  return exercise.load === 'dumbbell' || exercise.load === 'barbell' || exercise.load === 'cable';
}

export function createSession(
  dayId: DayId,
  mode: WorkoutMode,
  equipment: Equipment,
  swaps: Record<string, string>,
  history: Session[],
  now: Date = new Date(),
): Session {
  const plan = buildWorkout(dayId, mode, equipment, swaps);
  return {
    id: `${now.getTime()}`,
    dayId,
    mode,
    startedAt: now.toISOString(),
    exercises: plan.map((p) => {
      const lastWeight = lastUsedWeight(history, p.exercise.id);
      const weight = usesWeight(p.exercise) ? (lastWeight ?? defaultWeight(p.exercise, equipment)) : null;
      const sets: SetLog[] = Array.from({ length: p.sets }, () => ({ weight, reps: null, done: false }));
      return { slotId: p.slot.id, exerciseId: p.exercise.id, reps: p.reps, restSec: p.restSec, sets };
    }),
  };
}

function lastUsedWeight(history: Session[], exerciseId: string): number | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const ex = history[i].exercises.find((e) => e.exerciseId === exerciseId);
    const done = ex?.sets.filter((s) => s.done && s.weight != null) ?? [];
    if (done.length) return done[done.length - 1].weight;
  }
  return null;
}

export function sessionMinutes(session: Session): number {
  return estimateMinutes(
    session.exercises.map((e) => ({
      sets: e.sets.length,
      restSec: e.restSec,
      perSide: EXERCISES[e.exerciseId]?.perSide,
    })),
    session.mode,
  );
}
