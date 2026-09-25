import { useEffect, useState } from 'react';
import { StyleSheet, Vibration, View } from 'react-native';

import { Button, T } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';

function format(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function RestTimer({ endsAt, onDone }: { endsAt: number; onDone: () => void }) {
  const [now, setNow] = useState(Date.now());
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (left === 0) {
      Vibration.vibrate(400);
      onDone();
    }
  }, [left, onDone]);

  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <T variant="label">Rest</T>
        <T variant="huge" style={{ fontVariant: ['tabular-nums'] }}>
          {format(left)}
        </T>
      </View>
      <Button title="Skip" kind="secondary" small onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardRaised,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
});
