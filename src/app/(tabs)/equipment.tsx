import { View } from 'react-native';

import { EquipmentForm } from '@/components/equipment-form';
import { Card, Chip, Divider, Screen, T } from '@/components/ui';
import { PROGRAM, ROTATION } from '@/data/program';
import { alternatives, pickExercise } from '@/lib/generate';
import { useStore } from '@/store/store';

export default function EquipmentScreen() {
  const { state, setEquipment, swapExercise } = useStore();

  return (
    <Screen>
      <T variant="title">Equipment</T>
      <T variant="muted">Tick what you own. Your program updates instantly.</T>
      <Card>
        <EquipmentForm value={state.equipment} onChange={setEquipment} />
      </Card>

      <T variant="title" style={{ marginTop: 8 }}>
        Your program
      </T>
      {ROTATION.map((dayId) => {
        const day = PROGRAM[dayId];
        return (
          <Card key={dayId}>
            <T variant="heading">{day.name}</T>
            {day.slots.map((slot, i) => {
              const chosen = pickExercise(slot, state.equipment, state.swaps);
              const options = alternatives(slot, state.equipment);
              return (
                <View key={slot.id} style={{ gap: 6 }}>
                  {i > 0 ? <Divider /> : null}
                  <T variant="label">
                    {slot.pattern} · {slot.sets} × {slot.reps[0]}–{slot.reps[1]}
                    {slot.core ? ' · Express' : ''}
                  </T>
                  {options.length > 1 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {options.map((e) => (
                        <Chip
                          key={e.id}
                          label={e.name}
                          active={e.id === chosen.id}
                          onPress={() => swapExercise(slot.id, e.id)}
                        />
                      ))}
                    </View>
                  ) : (
                    <T style={{ fontWeight: '700' }}>{chosen.name}</T>
                  )}
                </View>
              );
            })}
          </Card>
        );
      })}
    </Screen>
  );
}
