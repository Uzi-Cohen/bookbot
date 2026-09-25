import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { DayPicker } from '@/components/day-picker';
import { EquipmentForm } from '@/components/equipment-form';
import { Button, Card, T, Screen } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { dateKey } from '@/lib/date';
import { DEFAULT_EQUIPMENT, useStore } from '@/store/store';

const STEPS = ['Build your program', 'Train', 'Eat', 'Recover', 'Repeat'];

export default function Onboarding() {
  const { completeOnboarding, logBodyweight } = useStore();
  const [step, setStep] = useState(0);
  const [equipment, setEquipment] = useState(DEFAULT_EQUIPMENT);
  const [days, setDays] = useState([0, 2, 4]);
  const [weight, setWeight] = useState('');

  const finish = () => {
    const kg = parseFloat(weight.replace(',', '.'));
    if (Number.isFinite(kg) && kg > 0) logBodyweight(dateKey(), kg);
    completeOnboarding(equipment, days);
  };

  if (step === 0) {
    return (
      <Screen footer={<Button title="Build my program" onPress={() => setStep(1)} />}>
        <T variant="label" style={{ color: colors.accent, marginTop: 24 }}>
          HomeBulk
        </T>
        <View style={{ gap: 14 }}>
          <T variant="title">You don’t need a perfect diet.</T>
          <T variant="title">You don’t need a gym.</T>
          <T variant="title">You don’t need two hours a day.</T>
          <T variant="title" style={{ color: colors.accent }}>
            You just need to keep showing up.
          </T>
        </View>
        <Card style={{ gap: 6 }}>
          {STEPS.map((s, i) => (
            <T key={s} variant={i === 0 ? 'heading' : 'muted'}>
              {i + 1}. {s}
            </T>
          ))}
        </Card>
        <T variant="muted">No calorie tracking. No complicated dashboards. Open the app, do what it says, close it.</T>
      </Screen>
    );
  }

  if (step === 1) {
    return (
      <Screen
        footer={
          <>
            <Button title="Next" onPress={() => setStep(2)} />
            <Button title="Back" kind="ghost" onPress={() => setStep(0)} />
          </>
        }>
        <T variant="label">Step 1 of 2</T>
        <T variant="title">What equipment do you have?</T>
        <T variant="muted">Your program is built around what you actually own. You can change this any time.</T>
        <Card>
          <EquipmentForm value={equipment} onChange={setEquipment} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <>
          <Button title="Start training" onPress={finish} disabled={days.length === 0} />
          <Button title="Back" kind="ghost" onPress={() => setStep(1)} />
        </>
      }>
      <T variant="label">Step 2 of 2</T>
      <T variant="title">Which days can you train?</T>
      <Card>
        <DayPicker value={days} onChange={setDays} />
      </Card>
      <Card>
        <T variant="heading">Current bodyweight (optional)</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="61.0"
            placeholderTextColor={colors.faint}
            style={{
              flex: 1,
              minWidth: 0,
              backgroundColor: colors.cardRaised,
              color: colors.text,
              borderRadius: radius.md,
              padding: 14,
              fontSize: 18,
              fontWeight: '700',
            }}
          />
          <T variant="muted">kg</T>
        </View>
        <T variant="small">That’s the only number you track besides your lifts.</T>
      </Card>
    </Screen>
  );
}
