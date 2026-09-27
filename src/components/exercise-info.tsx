import { View } from 'react-native';

import { Card, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import type { Exercise } from '@/lib/types';

export function ExerciseCues({ exercise }: { exercise: Exercise }) {
  return (
    <Card>
      {exercise.steps.map((step) => (
        <T key={step.label}>
          <T style={{ fontWeight: '800', color: colors.accent }}>{step.label}: </T>
          {step.text}
        </T>
      ))}
    </Card>
  );
}

export function ExerciseMistakes({ exercise }: { exercise: Exercise }) {
  return (
    <View style={{ gap: 6 }}>
      <T variant="label">Common mistakes</T>
      {exercise.mistakes.map((m) => (
        <T key={m} variant="muted">
          <T style={{ color: colors.danger }}>✕ </T>
          {m}
        </T>
      ))}
    </View>
  );
}
