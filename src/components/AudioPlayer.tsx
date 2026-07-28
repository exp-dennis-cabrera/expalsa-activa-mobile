import { View } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export function AudioPlayer({ url }: { url: string }) {
  const theme = useTheme();
  const player = useAudioPlayer(url ? { uri: url } : null);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status?.playing ?? false;

  return (
    <View>
      {url && !isPlaying && (
        <IconButton icon="play" iconColor={theme.colors.primary} onPress={() => player.play()} />
      )}
      {isPlaying && (
        <View style={{ flexDirection: 'row' }}>
          <IconButton icon="pause" onPress={() => player.pause()} />
          <IconButton
            icon="stop"
            iconColor={theme.colors.error}
            onPress={async () => {
              player.pause();
              await player.seekTo(0);
            }}
          />
        </View>
      )}
    </View>
  );
}
