import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ComingSoonScreen({ route }: any) {
  const theme = useTheme();
  const label = route?.params?.label ?? 'Este módulo';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MaterialCommunityIcons name="hammer-wrench" size={48} color="#9CA3AF" />
      <Text variant="titleMedium" style={styles.text}>
        {label} está en camino
      </Text>
      <Text variant="bodyMedium" style={styles.subtext}>
        Todavía no está construido en la app móvil.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { marginTop: 12, fontWeight: 'bold' },
  subtext: { marginTop: 4, color: '#6B7280', textAlign: 'center' },
});
