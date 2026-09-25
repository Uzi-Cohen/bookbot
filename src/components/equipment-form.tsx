import { StyleSheet, TextInput, View } from 'react-native';

import { Check, T } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import type { Equipment, EquipmentId } from '@/lib/types';

export const EQUIPMENT_LABELS: Record<EquipmentId, string> = {
  dumbbells: 'Dumbbells',
  barbell: 'Barbell',
  bench: 'Bench',
  pullupBar: 'Pull-up bar',
  bands: 'Resistance bands',
  cable: 'Cable machine',
  squatRack: 'Squat rack',
};

const ORDER: EquipmentId[] = ['dumbbells', 'barbell', 'bench', 'pullupBar', 'bands', 'cable', 'squatRack'];

function KgInput({ value, onChange }: { value: number; onChange: (kg: number) => void }) {
  return (
    <View style={styles.kg}>
      <TextInput
        style={styles.kgInput}
        keyboardType="decimal-pad"
        defaultValue={value ? String(value) : ''}
        placeholder="0"
        placeholderTextColor={colors.faint}
        onChangeText={(text) => {
          const kg = parseFloat(text.replace(',', '.'));
          onChange(Number.isFinite(kg) ? kg : 0);
        }}
        accessibilityLabel="Weight in kilograms"
      />
      <T variant="small">kg</T>
    </View>
  );
}

export function EquipmentForm({ value, onChange }: { value: Equipment; onChange: (e: Equipment) => void }) {
  const toggle = (id: EquipmentId) => onChange({ ...value, owned: { ...value.owned, [id]: !value.owned[id] } });

  return (
    <View>
      {ORDER.map((id) => (
        <Check
          key={id}
          label={EQUIPMENT_LABELS[id]}
          checked={value.owned[id]}
          onPress={() => toggle(id)}
          right={
            id === 'dumbbells' && value.owned.dumbbells ? (
              <KgInput value={value.dumbbellKg} onChange={(dumbbellKg) => onChange({ ...value, dumbbellKg })} />
            ) : id === 'barbell' && value.owned.barbell ? (
              <KgInput value={value.barbellKg} onChange={(barbellKg) => onChange({ ...value, barbellKg })} />
            ) : null
          }
        />
      ))}
      <T variant="small" style={{ marginTop: 8 }}>
        For weights, enter the heaviest you have: per dumbbell, or the barbell fully loaded.
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  kg: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kgInput: {
    width: 72,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.cardRaised,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
});
