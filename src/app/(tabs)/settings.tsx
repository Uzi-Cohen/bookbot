import { useState } from 'react';

import { DayPicker } from '@/components/day-picker';
import { Button, Card, Screen, T } from '@/components/ui';
import { useStore } from '@/store/store';

export default function Settings() {
  const { state, setTrainingDays, resetAll } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Screen>
      <T variant="title">Settings</T>

      <Card>
        <T variant="heading">Training days</T>
        <DayPicker value={state.trainingDays} onChange={(days) => days.length && setTrainingDays(days)} />
      </Card>

      <Card>
        <T variant="heading">How it works</T>
        <T variant="muted">
          Push, Pull and Legs rotate in order. Each exercise has a rep range: add reps each session until you hit the top
          on every set, then go heavier. Maxed out on weight? Slow the reps down instead.
        </T>
        <T variant="muted">
          No calories. Weigh yourself a few times a week. If the scale stalls for 3 weeks, eat a bit more.
        </T>
      </Card>

      <Card>
        <T variant="heading">Data</T>
        <T variant="muted">Everything is stored on this device.</T>
        <Button
          title={confirmReset ? 'Tap again to erase everything' : 'Reset all data'}
          kind="danger"
          onPress={() => (confirmReset ? resetAll() : setConfirmReset(true))}
        />
      </Card>
    </Screen>
  );
}
