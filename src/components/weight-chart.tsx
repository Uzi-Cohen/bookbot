import { StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { colors } from '@/constants/theme';
import type { BodyweightEntry } from '@/lib/types';

const HEIGHT = 120;
const MAX_POINTS = 30;

/** Minimal bar chart of the most recent weigh-ins. */
export function WeightChart({ entries }: { entries: BodyweightEntry[] }) {
  const points = entries.slice(-MAX_POINTS);
  if (points.length < 2) return null;

  const values = points.map((p) => p.kg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);

  return (
    <View>
      <View style={styles.chart} accessibilityLabel={`Bodyweight from ${points[0].kg} to ${points[points.length - 1].kg} kg`}>
        {points.map((p, i) => (
          <View key={p.date} style={styles.col}>
            <View
              style={[
                styles.bar,
                {
                  height: 12 + ((p.kg - min) / span) * (HEIGHT - 12),
                  backgroundColor: i === points.length - 1 ? colors.accent : colors.faint,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.axis}>
        <T variant="small">{min.toFixed(1)} kg</T>
        <T variant="small">{max.toFixed(1)} kg</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { height: HEIGHT, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  col: { flex: 1, justifyContent: 'flex-end' },
  bar: { borderRadius: 3, width: '100%' },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
});
