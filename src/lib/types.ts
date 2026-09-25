export type EquipmentId =
  | 'dumbbells'
  | 'barbell'
  | 'bench'
  | 'pullupBar'
  | 'bands'
  | 'cable'
  | 'squatRack';

export interface Equipment {
  owned: Record<EquipmentId, boolean>;
  /** Heaviest dumbbell (per hand) the user owns, in kg. */
  dumbbellKg: number;
  /** Heaviest loaded barbell the user can make, in kg. */
  barbellKg: number;
}

export type LoadType = 'dumbbell' | 'barbell' | 'bodyweight' | 'band' | 'cable';

export interface ExerciseStep {
  label: string;
  text: string;
}

export interface Exercise {
  id: string;
  name: string;
  requires: EquipmentId[];
  load: LoadType;
  /** Reps are counted per side (e.g. one-arm row). */
  perSide?: boolean;
  steps: ExerciseStep[];
  mistakes: string[];
  /** Short 15–25 s demo clip. Falls back to a search link when missing. */
  videoUrl?: string;
}

export type RepRange = [min: number, max: number];

export interface Slot {
  id: string;
  /** Movement pattern, e.g. "Horizontal press". */
  pattern: string;
  sets: number;
  reps: RepRange;
  restSec: number;
  /** Kept in Express mode. */
  core: boolean;
  /** Sets used in Express mode (defaults to `sets`). */
  expressSets?: number;
  /** Exercise ids in order of preference; the first one the user can do is picked. */
  candidates: string[];
}

export type DayId = 'push' | 'pull' | 'legs';

export interface WorkoutDay {
  id: DayId;
  name: string;
  slots: Slot[];
}

export type WorkoutMode = 'full' | 'express';

export interface SetLog {
  weight: number | null;
  reps: number | null;
  done: boolean;
}

export interface SessionExercise {
  slotId: string;
  exerciseId: string;
  reps: RepRange;
  restSec: number;
  sets: SetLog[];
}

export interface Session {
  id: string;
  dayId: DayId;
  mode: WorkoutMode;
  startedAt: string;
  finishedAt?: string;
  exercises: SessionExercise[];
}

export interface BodyweightEntry {
  /** YYYY-MM-DD */
  date: string;
  kg: number;
}

export interface AppState {
  onboarded: boolean;
  equipment: Equipment;
  /** Weekdays to train on, 0 = Sunday … 6 = Saturday. */
  trainingDays: number[];
  /** User-chosen exercise per slot, overriding the default pick. */
  swaps: Record<string, string>;
  active: Session | null;
  history: Session[];
  bodyweight: BodyweightEntry[];
}
