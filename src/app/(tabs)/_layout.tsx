import Tabs from 'expo-router/js-tabs';
import { Text, type ColorValue } from 'react-native';

import { colors } from '@/constants/theme';

function icon(glyph: string) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ color, fontSize: 20, fontWeight: '800' }}>{glyph}</Text>;
  };
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('●') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: icon('↗') }} />
      <Tabs.Screen name="equipment" options={{ title: 'Equipment', tabBarIcon: icon('⚒') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('≡') }} />
    </Tabs>
  );
}
