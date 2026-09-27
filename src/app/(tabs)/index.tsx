import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Row, Screen, T } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { EXERCISES } from '@/data/exercises';
import { PROGRAM } from '@/data/program';
import { dateKey, WEEKDAYS } from '@/lib/date';
import { buildWorkout, nextDayId, planMinutes, sessionMinutes, usesWeight } from '@/lib/generate';
import { formatPerformance, lastPerformance } from '@/lib/progression';
import type { Session, WorkoutMode } from '@/lib/types';
import { useStore } from '@/store/store';

function nextTrainingDay(trainingDays: number[], from: Date): string {
  for (let i = 1; i <= 7; i++) {
    const day = (from.getDay() + i) % 7;
    if (trainingDays.includes(day)) return i === 1 ? 'tomorrow' : WEEKDAYS[day];
  }
  return 'your next training day';
}

function Header({ subtitle }: { subtitle?: string }) {
  const today = new Date();
  return (
    <View style={{ gap: 2 }}>
      <T variant="label">Today — {WEEKDAYS[today.getDay()]}</T>
      {subtitle ? <T variant="muted">{subtitle}</T> : null}
    </View>
  );
}

function ActiveWorkout({ session }: { session: Session }) {
  const { finishSession, discardSession } = useStore();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const anyDone = session.exercises.some((e) => e.sets.some((s) => s.done));

  return (
    <Screen
      footer={
        <>
          <Button
            title="Finish workout"
            disabled={!anyDone}
            onPress={() => {
              finishSession();
              router.push('/complete');
            }}
          />
          <Button
            title={confirmDiscard ? 'Tap again to discard' : 'Discard workout'}
            kind="ghost"
            small
            onPress={() => (confirmDiscard ? discardSession() : setConfirmDiscard(true))}
          />
        </>
      }>
      <Header />
      <View>
        <T variant="huge">{PROGRAM[session.dayId].name.toUpperCase()}</T>
        <T variant="muted">
          {session.mode === 'express' ? 'Express · ' : ''}
          {sessionMinutes(session)} minutes · in progress
        </T>
      </View>
      {session.exercises.map((e, i) => {
        const exercise = EXERCISES[e.exerciseId];
        const done = e.sets.filter((s) => s.done).length;
        const complete = done === e.sets.length;
        return (
          <Card key={e.slotId} style={complete && styles.doneCard}>
            <Row>
              <T variant="heading" style={{ flex: 1 }}>
                {i + 1}. {exercise.name}
              </T>
              <T variant="small" style={complete && { color: colors.good }}>
                {complete ? '✓ ' : ''}
                {done}/{e.sets.length} sets
              </T>
            </Row>
            <Button
              title={complete ? 'Review' : done ? 'Continue' : 'Start set'}
              kind={complete ? 'secondary' : 'primary'}
              small
              onPress={() => router.push(`/workout/${i}`)}
            />
          </Card>
        );
      })}
    </Screen>
  );
}

function Completed({ session, trainingDays }: { session: Session; trainingDays: number[] }) {
  const next = PROGRAM[nextDayId([session])].name;
  return (
    <Screen>
      <Header />
      <View style={styles.completeBlock}>
        <T variant="huge" style={{ color: colors.accent }}>
          Workout complete ✓
        </T>
        <T variant="heading">{PROGRAM[session.dayId].name} done. Now eat and recover.</T>
      </View>
      <Card>
        <T variant="label">Next up</T>
        <T variant="heading">
          {next} — {nextTrainingDay(trainingDays, new Date())}
        </T>
      </Card>
      <Button title="Log bodyweight" kind="secondary" onPress={() => router.push('/progress')} />
    </Screen>
  );
}

export default function Today() {
  const { state, startSession } = useStore();
  const [mode, setMode] = useState<WorkoutMode>('full');
  const [trainAnyway, setTrainAnyway] = useState(false);

  if (state.active) return <ActiveWorkout session={state.active} />;

  const today = new Date();
  const last = state.history[state.history.length - 1];
  if (last?.finishedAt && dateKey(new Date(last.finishedAt)) === dateKey(today)) {
    return <Completed session={last} trainingDays={state.trainingDays} />;
  }

  const dayId = nextDayId(state.history);
  const day = PROGRAM[dayId];
  const isTrainingDay = state.trainingDays.includes(today.getDay());

  if (!isTrainingDay && !trainAnyway) {
    return (
      <Screen>
        <Header />
        <View style={styles.completeBlock}>
          <T variant="huge">REST DAY</T>
          <T variant="heading">Recover. Eat well. Sleep.</T>
        </View>
        <Card>
          <T variant="label">Next up</T>
          <T variant="heading">
            {day.name} — {nextTrainingDay(state.trainingDays, today)}
          </T>
        </Card>
        <Button title={`Train ${day.name} anyway`} kind="secondary" onPress={() => setTrainAnyway(true)} />
      </Screen>
    );
  }

  const full = buildWorkout(dayId, 'full', state.equipment, state.swaps);
  const express = buildWorkout(dayId, 'express', state.equipment, state.swaps);
  const plan = mode === 'express' ? express : full;
  const minutes = planMinutes(plan, mode);

  const start = (index = 0) => {
    startSession(mode);
    router.push(`/workout/${index}`);
  };

  return (
    <Screen footer={<Button title={`Start ${mode === 'express' ? 'express ' : ''}workout`} onPress={() => start()} />}>
      <Header />
      <View>
        <T variant="huge">
          {day.name.toUpperCase()}
          {mode === 'express' ? ' — EXPRESS' : ''}
        </T>
        <T variant="muted">{minutes} minutes</T>
      </View>

      <View style={styles.modes}>
        <ModeOption
          active={mode === 'full'}
          title="Normal workout"
          detail={`${planMinutes(full, 'full')} min`}
          onPress={() => setMode('full')}
        />
        <ModeOption
          active={mode === 'express'}
          title="Busy today?"
          detail={`${planMinutes(express, 'express')} min Express`}
          onPress={() => setMode('express')}
        />
      </View>
      {mode === 'express' ? (
        <T variant="small">Express keeps the big movements. 20 minutes beats zero minutes.</T>
      ) : null}

      {plan.map((p, i) => {
        const prev = lastPerformance(state.history, p.exercise.id);
        return (
          <Card key={p.slot.id}>
            <Pressable onPress={() => router.push(`/exercise/${p.exercise.id}`)} style={{ gap: 4 }}>
              <T variant="heading">
                {i + 1}. {p.exercise.name}
              </T>
              <T variant="muted">
                {p.sets} × {p.reps[0]}–{p.reps[1]}
                {p.exercise.perSide ? ' per side' : ''} · Rest {p.restSec} sec
              </T>
              {prev ? (
                <T variant="small">Last time: {formatPerformance(prev, usesWeight(p.exercise))}</T>
              ) : null}
              <T variant="small" style={{ color: colors.accent }}>
                ▶ Demonstration
              </T>
            </Pressable>
            <Button title="Start set" small kind="secondary" onPress={() => start(i)} />
          </Card>
        );
      })}
    </Screen>
  );
}

function ModeOption({ active, title, detail, onPress }: { active: boolean; title: string; detail: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.mode, active && styles.modeActive]}>
      <T style={[styles.modeTitle, active && { color: colors.accentText }]}>{title}</T>
      <T variant="small" style={active && { color: colors.accentText }}>
        {detail}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modes: { flexDirection: 'row', gap: space.sm },
  mode: {
    flex: 1,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  modeActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  modeTitle: { fontWeight: '800' },
  doneCard: { opacity: 0.7 },
  completeBlock: { gap: space.sm, paddingVertical: space.lg },
});
