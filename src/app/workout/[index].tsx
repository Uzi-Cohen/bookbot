import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ExerciseCues, ExerciseMistakes } from '@/components/exercise-info';
import { ExerciseVideo } from '@/components/exercise-video';
import { RestTimer } from '@/components/rest-timer';
import { Button, Card, Chip, Row, Screen, T } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { PROGRAM } from '@/data/program';
import { alternatives, usesWeight } from '@/lib/generate';
import { formatPerformance, lastPerformance, suggest } from '@/lib/progression';
import { useStore } from '@/store/store';

function parseNumber(text: string): number | null {
  const n = parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function NumberField({
  initial,
  placeholder,
  onChange,
  label,
  editable,
}: {
  initial: number | null;
  placeholder: string;
  onChange: (n: number | null) => void;
  label: string;
  editable: boolean;
}) {
  return (
    <TextInput
      accessibilityLabel={label}
      style={[styles.input, !editable && styles.inputDone]}
      defaultValue={initial == null ? '' : String(initial)}
      placeholder={placeholder}
      placeholderTextColor={colors.faint}
      keyboardType="decimal-pad"
      editable={editable}
      selectTextOnFocus
      onChangeText={(t) => onChange(parseNumber(t))}
    />
  );
}

export default function WorkoutExercise() {
  const { index: indexParam } = useLocalSearchParams<{ index: string }>();
  const index = Number(indexParam);
  const { state, updateSet, addSet, swapExercise, finishSession } = useStore();
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const endRest = useCallback(() => setRestEndsAt(null), []);

  const session = state.active;
  const entry = session?.exercises[index];
  if (!session || !entry) {
    return (
      <Screen edges={[]}>
        <T variant="heading">No workout in progress.</T>
        <Button title="Back to today" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const exercise = getExercise(entry.exerciseId);
  const weighted = usesWeight(exercise);
  const prev = lastPerformance(state.history, exercise.id, session.id);
  const suggestion = suggest(exercise, entry.reps, entry.sets.length, prev, state.equipment);
  const doneCount = entry.sets.filter((s) => s.done).length;
  const allDone = doneCount === entry.sets.length;
  const isLast = index === session.exercises.length - 1;
  const slot = PROGRAM[session.dayId].slots.find((s) => s.id === entry.slotId);
  const swapOptions = slot && doneCount === 0 ? alternatives(slot, state.equipment) : [];

  const completeSet = (setIndex: number) => {
    const set = entry.sets[setIndex];
    if (set.done) {
      updateSet(index, setIndex, { done: false });
      return;
    }
    const reps = set.reps ?? suggestion.targets[setIndex] ?? null;
    if (reps == null) {
      setHint('Enter how many reps you did, then tap ✓.');
      return;
    }
    setHint(null);
    updateSet(index, setIndex, { done: true, reps });
    const remaining = entry.sets.filter((s, i) => !s.done && i !== setIndex).length;
    if (remaining > 0 || !isLast) setRestEndsAt(Date.now() + entry.restSec * 1000);
  };

  const next = () => {
    setRestEndsAt(null);
    if (isLast) {
      finishSession();
      router.replace('/complete');
    } else {
      router.replace(`/workout/${index + 1}`);
    }
  };

  return (
    <Screen
      edges={['bottom']}
      footer={
        <>
          {restEndsAt ? <RestTimer endsAt={restEndsAt} onDone={endRest} /> : null}
          {allDone ? (
            <Button title={isLast ? 'Finish workout' : 'Next exercise →'} onPress={next} />
          ) : null}
        </>
      }>
      <View style={{ gap: 4 }}>
        <T variant="label">
          {PROGRAM[session.dayId].name} · Exercise {index + 1} of {session.exercises.length}
        </T>
        <T variant="title">{exercise.name}</T>
        <T variant="muted">
          {entry.sets.length} × {entry.reps[0]}–{entry.reps[1]}
          {exercise.perSide ? ' per side' : ''} · Rest {entry.restSec} sec
        </T>
      </View>

      <ExerciseVideo exercise={exercise} />

      <Card style={{ gap: 6 }}>
        {prev ? (
          <>
            <T variant="label">Previous</T>
            <T variant="heading">{formatPerformance(prev, weighted)}</T>
          </>
        ) : null}
        <T style={{ color: colors.accent, fontWeight: '700' }}>{suggestion.message}</T>
      </Card>

      <Card>
        <Row>
          <T variant="label" style={styles.colSet}>
            Set
          </T>
          {weighted ? (
            <T variant="label" style={styles.colField}>
              kg
            </T>
          ) : null}
          <T variant="label" style={styles.colField}>
            Reps
          </T>
          <View style={styles.colCheck} />
        </Row>
        {entry.sets.map((set, i) => {
          const target = suggestion.targets[i];
          return (
            <Row key={`${exercise.id}-${i}`}>
              <T variant="heading" style={styles.colSet}>
                {i + 1}
              </T>
              {weighted ? (
                <View style={styles.colField}>
                  <NumberField
                    label={`Set ${i + 1} weight`}
                    initial={set.weight}
                    placeholder="kg"
                    editable={!set.done}
                    onChange={(weight) => updateSet(index, i, { weight })}
                  />
                </View>
              ) : null}
              <View style={styles.colField}>
                <NumberField
                  key={set.done ? `done-${set.reps}` : 'open'}
                  label={`Set ${i + 1} reps`}
                  initial={set.reps}
                  placeholder={target != null ? String(target) : `${entry.reps[0]}–${entry.reps[1]}`}
                  editable={!set.done}
                  onChange={(reps) => updateSet(index, i, { reps: reps == null ? null : Math.round(reps) })}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={set.done ? `Undo set ${i + 1}` : `Complete set ${i + 1}`}
                onPress={() => completeSet(i)}
                style={[styles.colCheck, styles.check, set.done && styles.checkDone]}>
                <T style={[styles.checkText, set.done && { color: colors.accentText }]}>✓</T>
              </Pressable>
            </Row>
          );
        })}
        {hint ? <T variant="small" style={{ color: colors.warn }}>{hint}</T> : null}
        <Button title="+ Add set" kind="ghost" small onPress={() => addSet(index)} />
      </Card>

      {swapOptions.length > 1 ? (
        <View style={{ gap: space.sm }}>
          <T variant="label">Swap exercise</T>
          <View style={styles.chips}>
            {swapOptions.map((e) => (
              <Chip key={e.id} label={e.name} active={e.id === exercise.id} onPress={() => swapExercise(entry.slotId, e.id)} />
            ))}
          </View>
        </View>
      ) : null}

      <ExerciseCues exercise={exercise} />
      <ExerciseMistakes exercise={exercise} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  colSet: { width: 32 },
  colField: { flex: 1 },
  colCheck: { width: 52 },
  input: {
    backgroundColor: colors.cardRaised,
    color: colors.text,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputDone: { backgroundColor: 'transparent', color: colors.good },
  check: {
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkText: { fontSize: 20, fontWeight: '900', color: colors.faint },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
