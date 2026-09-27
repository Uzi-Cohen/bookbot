import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, MAX_WIDTH, radius, space } from '@/constants/theme';

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets>
          <View style={styles.inner}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.inner, styles.fill]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

type Variant = 'title' | 'heading' | 'body' | 'label' | 'muted' | 'small' | 'huge';

export function T({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  return <Text {...props} style={[styles.text, textStyles[variant], style]} />;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  style,
  small,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        buttonStyles[kind],
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 },
        style,
      ]}>
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, buttonTextStyles[kind]]}>{title}</Text>
    </Pressable>
  );
}

export function Check({ checked, label, onPress, right }: { checked: boolean; label: string; onPress: () => void; right?: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={({ pressed }) => [styles.checkRow, pressed && { opacity: 0.7 }]}>
      <View style={[styles.checkBox, checked && styles.checkBoxOn]}>
        {checked ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
      <T style={{ flex: 1 }}>{label}</T>
      {right}
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

const textStyles: Record<Variant, TextStyle> = {
  huge: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: colors.muted },
  muted: { fontSize: 15, lineHeight: 21, color: colors.muted },
  small: { fontSize: 13, color: colors.muted },
};

const buttonStyles: Record<string, ViewStyle> = {
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.cardRaised, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
};

const buttonTextStyles: Record<string, TextStyle> = {
  primary: { color: colors.accentText },
  secondary: { color: colors.text },
  ghost: { color: colors.muted },
  danger: { color: colors.danger },
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { flexGrow: 1, paddingBottom: space.xxl },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.lg },
  fill: { flex: 1 },
  footer: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.sm,
  },
  text: { color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, gap: space.md },
  button: { borderRadius: radius.md, paddingVertical: 16, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center' },
  buttonSmall: { paddingVertical: 10, paddingHorizontal: space.md },
  buttonText: { fontSize: 16, fontWeight: '800' },
  buttonTextSmall: { fontSize: 14 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkMark: { color: colors.accentText, fontWeight: '900', fontSize: 15 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.cardRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontWeight: '700' },
  chipTextActive: { color: colors.accentText },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
