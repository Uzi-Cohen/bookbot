import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ExerciseCues, ExerciseMistakes } from '@/components/exercise-info';
import { ExerciseVideo } from '@/components/exercise-video';
import { Card, Screen, T } from '@/components/ui';
import { EXERCISES } from '@/data/exercises';
import { formatDay, dateKey } from '@/lib/date';
import { usesWeight } from '@/lib/generate';
import { formatPerformance } from '@/lib/progression';
import { useStore } from '@/store/store';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useStore();
  const exercise = EXERCISES[id];

  if (!exercise) {
    return (
      <Screen edges={[]}>
        <T variant="heading">Exercise not found.</T>
      </Screen>
    );
  }

  const weighted = usesWeight(exercise);
  const log = state.history
    .filter((s) => s.exercises.some((e) => e.exerciseId === exercise.id))
    .slice(-8)
    .reverse();

  return (
    <Screen edges={['bottom']}>
      <T variant="title">{exercise.name}</T>
      <ExerciseVideo exercise={exercise} />
      <ExerciseCues exercise={exercise} />
      <ExerciseMistakes exercise={exercise} />
      {log.length ? (
        <View style={{ gap: 8 }}>
          <T variant="label">History</T>
          <Card>
            {log.map((s) => {
              const e = s.exercises.find((x) => x.exerciseId === exercise.id)!;
              return (
                <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <T variant="muted">{formatDay(dateKey(new Date(s.finishedAt ?? s.startedAt)))}</T>
                  <T style={{ fontWeight: '700' }}>
                    {formatPerformance({ sessionId: s.id, date: '', sets: e.sets }, weighted)}
                  </T>
                </View>
              );
            })}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}
