import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Row, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { getExercise } from '@/data/exercises';
import { PROGRAM } from '@/data/program';
import { usesWeight } from '@/lib/generate';
import { formatPerformance } from '@/lib/progression';
import { useStore } from '@/store/store';

export default function Complete() {
  const { state } = useStore();
  const session = state.history[state.history.length - 1];
  const done = () => router.dismissTo('/');

  if (!session) {
    return (
      <Screen footer={<Button title="Done" onPress={done} />}>
        <T variant="title">Nothing logged.</T>
      </Screen>
    );
  }

  const sets = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  const reps = session.exercises.reduce((n, e) => n + e.sets.reduce((r, s) => r + (s.reps ?? 0), 0), 0);
  const minutes = session.finishedAt
    ? Math.max(1, Math.round((Date.parse(session.finishedAt) - Date.parse(session.startedAt)) / 60000))
    : null;

  return (
    <Screen edges={['top', 'bottom']} footer={<Button title="Done" onPress={done} />}>
      <View style={{ gap: 8, paddingTop: 32 }}>
        <T variant="huge" style={{ color: colors.accent }}>
          Workout complete ✓
        </T>
        <T variant="heading">
          {PROGRAM[session.dayId].name}
          {session.mode === 'express' ? ' — Express' : ''}. You showed up.
        </T>
      </View>

      <Row>
        <Stat label="Sets" value={sets} />
        <Stat label="Reps" value={reps} />
        {minutes ? <Stat label="Minutes" value={minutes} /> : null}
      </Row>

      <Card>
        {session.exercises.map((e) => {
          const exercise = getExercise(e.exerciseId);
          return (
            <View key={e.slotId} style={{ gap: 2 }}>
              <T style={{ fontWeight: '700' }}>{exercise.name}</T>
              <T variant="muted">
                {formatPerformance({ sessionId: session.id, date: '', sets: e.sets }, usesWeight(exercise))}
              </T>
            </View>
          );
        })}
      </Card>

      <T variant="muted">Now eat a proper meal. Growth happens when you recover.</T>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card style={{ flex: 1, gap: 2 }}>
      <T variant="title">{value}</T>
      <T variant="label">{label}</T>
    </Card>
  );
}
