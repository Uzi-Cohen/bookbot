import { View } from 'react-native';

import { Chip, T } from '@/components/ui';
import { WEEKDAYS_SHORT } from '@/lib/date';

// Monday-first display order.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function DayPicker({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  const toggle = (day: number) =>
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b));

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ORDER.map((day) => (
          <Chip key={day} label={WEEKDAYS_SHORT[day]} active={value.includes(day)} onPress={() => toggle(day)} />
        ))}
      </View>
      <T variant="small">
        {value.length} day{value.length === 1 ? '' : 's'} a week. 3–4 is plenty with a full-time job. Push, Pull and Legs
        rotate in order, so a missed day never skips a session.
      </T>
    </View>
  );
}
