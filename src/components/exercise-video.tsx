import { useVideoPlayer, VideoView } from 'expo-video';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import type { Exercise } from '@/lib/types';

function Player({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return <VideoView player={player} style={styles.frame} contentFit="cover" nativeControls={false} />;
}

/**
 * Short looping demo when the exercise has a clip; otherwise a one-tap link
 * to a short-form demo search so there's always something to watch.
 */
export function ExerciseVideo({ exercise }: { exercise: Exercise }) {
  if (exercise.videoUrl) return <Player uri={exercise.videoUrl} />;

  const query = encodeURIComponent(`${exercise.name} proper form short`);
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => Linking.openURL(`https://www.youtube.com/results?search_query=${query}`)}
      style={({ pressed }) => [styles.frame, styles.placeholder, pressed && { opacity: 0.8 }]}>
      <View style={styles.play}>
        <T style={styles.playIcon}>▶</T>
      </View>
      <T variant="heading">Watch a 30-second demo</T>
      <T variant="small">Opens a short demo of {exercise.name}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.card },
  placeholder: { alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: colors.border },
  play: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  playIcon: { color: colors.accentText, fontSize: 22, marginLeft: 4 },
});
