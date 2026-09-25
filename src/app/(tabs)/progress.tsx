import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, Row, Screen, T } from '@/components/ui';
import { WeightChart } from '@/components/weight-chart';
import { colors, radius } from '@/constants/theme';
import { EXERCISES } from '@/data/exercises';
import { trend } from '@/lib/bodyweight';
import { dateKey, daysBetween, formatDay } from '@/lib/date';
import { usesWeight } from '@/lib/generate';
import { formatPerformance, lastPerformance } from '@/lib/progression';
import { useStore } from '@/store/store';

export default function Progress() {
  const { state, logBodyweight, deleteBodyweight } = useStore();
  const [input, setInput] = useState('');
  const today = dateKey();

  const entries = state.bodyweight;
  const latest = entries[entries.length - 1];
  const t = trend(entries, today);

  const save = () => {
    const kg = parseFloat(input.replace(',', '.'));
    if (!Number.isFinite(kg) || kg <= 0) return;
    logBodyweight(today, kg);
    setInput('');
  };

  // Workouts in the current Monday-based week.
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const thisWeek = state.history.filter(
    (s) => daysBetween(dateKey(new Date(s.finishedAt ?? s.startedAt)), today) <= mondayOffset,
  ).length;

  const exerciseIds = [...new Set(state.history.flatMap((s) => s.exercises.map((e) => e.exerciseId)))];

  return (
    <Screen>
      <T variant="title">Progress</T>

      <Card>
        <T variant="label">Bodyweight</T>
        <Row style={{ alignItems: 'flex-end' }}>
          <T variant="huge">{latest ? latest.kg.toFixed(1) : '—'}</T>
          <T variant="muted" style={{ marginBottom: 8 }}>
            kg
          </T>
          {t.total != null ? (
            <T
              variant="heading"
              style={{ marginLeft: 'auto', marginBottom: 6, color: t.total >= 0 ? colors.good : colors.warn }}>
              {t.total >= 0 ? '📈 +' : '📉 '}
              {t.total.toFixed(1)} kg
            </T>
          ) : null}
        </Row>
        {t.message ? (
          <T style={{ color: t.tone === 'warn' ? colors.warn : t.tone === 'good' ? colors.good : colors.muted }}>
            {t.message}
          </T>
        ) : null}
        <WeightChart entries={entries} />
        <Row>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={save}
            keyboardType="decimal-pad"
            placeholder={latest ? latest.kg.toFixed(1) : 'Today’s weight'}
            placeholderTextColor={colors.faint}
            style={styles.input}
            accessibilityLabel="Today's bodyweight in kg"
          />
          <Button title="Log" small onPress={save} style={{ minWidth: 80 }} />
        </Row>
        {entries.length ? (
          <View style={{ gap: 6 }}>
            {entries
              .slice(-7)
              .reverse()
              .map((e) => (
                <Row key={e.date}>
                  <T variant="muted" style={{ flex: 1 }}>
                    {e.date === today ? 'Today' : formatDay(e.date)}
                  </T>
                  <T style={{ fontWeight: '700' }}>{e.kg.toFixed(1)} kg</T>
                  <Pressable accessibilityLabel={`Delete ${e.date}`} onPress={() => deleteBodyweight(e.date)} hitSlop={10}>
                    <T variant="small">✕</T>
                  </Pressable>
                </Row>
              ))}
          </View>
        ) : null}
      </Card>

      <Row>
        <Card style={{ flex: 1, gap: 2 }}>
          <T variant="title">
            {thisWeek}/{state.trainingDays.length}
          </T>
          <T variant="label">This week</T>
        </Card>
        <Card style={{ flex: 1, gap: 2 }}>
          <T variant="title">{state.history.length}</T>
          <T variant="label">Workouts</T>
        </Card>
      </Row>

      {exerciseIds.length ? (
        <View style={{ gap: 8 }}>
          <T variant="label">Lifts — last session</T>
          <Card>
            {exerciseIds.map((id) => {
              const exercise = EXERCISES[id];
              const perf = lastPerformance(state.history, id);
              if (!exercise || !perf) return null;
              return (
                <Pressable key={id} onPress={() => router.push(`/exercise/${id}`)} style={styles.lift}>
                  <T style={{ flex: 1, fontWeight: '700' }}>{exercise.name}</T>
                  <T variant="muted">{formatPerformance(perf, usesWeight(exercise))}</T>
                </Pressable>
              );
            })}
          </Card>
        </View>
      ) : (
        <T variant="muted">Your lifts will show up here after your first workout.</T>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.cardRaised,
    color: colors.text,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '700',
  },
  lift: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
});
