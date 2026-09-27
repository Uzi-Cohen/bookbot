import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { createSession, nextDayId } from '@/lib/generate';
import type { AppState, Equipment, SetLog, WorkoutMode } from '@/lib/types';

const STORAGE_KEY = 'homebulk:v1';

export const DEFAULT_EQUIPMENT: Equipment = {
  owned: {
    dumbbells: true,
    barbell: false,
    bench: false,
    pullupBar: false,
    bands: false,
    cable: false,
    squatRack: false,
  },
  dumbbellKg: 7.5,
  barbellKg: 10,
};

const INITIAL_STATE: AppState = {
  onboarded: false,
  equipment: DEFAULT_EQUIPMENT,
  trainingDays: [0, 2, 4],
  swaps: {},
  active: null,
  history: [],
  bodyweight: [],
};

interface Actions {
  completeOnboarding(equipment: Equipment, trainingDays: number[]): void;
  setEquipment(equipment: Equipment): void;
  setTrainingDays(days: number[]): void;
  swapExercise(slotId: string, exerciseId: string): void;
  startSession(mode: WorkoutMode): void;
  updateSet(exerciseIndex: number, setIndex: number, patch: Partial<SetLog>): void;
  addSet(exerciseIndex: number): void;
  finishSession(): void;
  discardSession(): void;
  logBodyweight(date: string, kg: number): void;
  deleteBodyweight(date: string): void;
  resetAll(): void;
}

interface Store extends Actions {
  state: AppState;
  hydrated: boolean;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState({ ...INITIAL_STATE, ...(JSON.parse(raw) as Partial<AppState>) });
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);

  const updateActiveExercise = useCallback(
    (exerciseIndex: number, fn: (sets: SetLog[]) => SetLog[]) =>
      update((s) => {
        if (!s.active) return s;
        const exercises = s.active.exercises.map((e, i) => (i === exerciseIndex ? { ...e, sets: fn(e.sets) } : e));
        return { ...s, active: { ...s.active, exercises } };
      }),
    [update],
  );

  const actions = useMemo<Actions>(
    () => ({
      completeOnboarding: (equipment, trainingDays) =>
        update((s) => ({ ...s, equipment, trainingDays, onboarded: true })),
      setEquipment: (equipment) => update((s) => ({ ...s, equipment })),
      setTrainingDays: (trainingDays) => update((s) => ({ ...s, trainingDays })),
      swapExercise: (slotId, exerciseId) =>
        update((s) => {
          const swaps = { ...s.swaps, [slotId]: exerciseId };
          if (!s.active) return { ...s, swaps };
          const exercises = s.active.exercises.map((e) =>
            e.slotId === slotId && !e.sets.some((set) => set.done)
              ? { ...e, exerciseId, sets: e.sets.map(() => ({ weight: null, reps: null, done: false })) }
              : e,
          );
          return { ...s, swaps, active: { ...s.active, exercises } };
        }),
      startSession: (mode) =>
        update((s) => ({
          ...s,
          active: createSession(nextDayId(s.history), mode, s.equipment, s.swaps, s.history),
        })),
      updateSet: (exerciseIndex, setIndex, patch) =>
        updateActiveExercise(exerciseIndex, (sets) => sets.map((set, i) => (i === setIndex ? { ...set, ...patch } : set))),
      addSet: (exerciseIndex) =>
        updateActiveExercise(exerciseIndex, (sets) => [
          ...sets,
          { weight: sets[sets.length - 1]?.weight ?? null, reps: null, done: false },
        ]),
      finishSession: () =>
        update((s) => {
          if (!s.active) return s;
          const exercises = s.active.exercises
            .map((e) => ({ ...e, sets: e.sets.filter((set) => set.done) }))
            .filter((e) => e.sets.length > 0);
          const finished = { ...s.active, exercises, finishedAt: new Date().toISOString() };
          return { ...s, active: null, history: [...s.history, finished] };
        }),
      discardSession: () => update((s) => ({ ...s, active: null })),
      logBodyweight: (date, kg) =>
        update((s) => ({
          ...s,
          bodyweight: [...s.bodyweight.filter((e) => e.date !== date), { date, kg }].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
        })),
      deleteBodyweight: (date) => update((s) => ({ ...s, bodyweight: s.bodyweight.filter((e) => e.date !== date) })),
      resetAll: () => update(() => INITIAL_STATE),
    }),
    [update, updateActiveExercise],
  );

  const value = useMemo<Store>(() => ({ state, hydrated, ...actions }), [state, hydrated, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
