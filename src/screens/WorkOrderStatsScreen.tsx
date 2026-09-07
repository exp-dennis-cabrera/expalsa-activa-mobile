import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { meApi, type MobileStatsExtended } from '../api/me';

/**
 * Copia fiel de WorkOrderStatsScreen real: dos secciones (completadas y
 * cumplidas a tiempo), cada una con el numero de esta semana y el
 * historico, uno al lado del otro.
 */
export default function WorkOrderStatsScreen() {
  const theme = useTheme();
  const [stats, setStats] = useState<MobileStatsExtended>({
    complete: 0,
    completeWeek: 0,
    compliantRate: 0,
    compliantRateWeek: 0,
  });
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    meApi
      .getMobileExtendedStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  function Seccion({ titulo, semana, total }: { titulo: string; semana: string; total: string }) {
    return (
      <View style={styles.section}>
        <Text variant="titleLarge" style={{ marginVertical: 20 }}>
          {titulo}
        </Text>
        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={{ width: '100%' }} variant="titleMedium">
              Esta semana
            </Text>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
              {semana}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={{ width: '100%' }} variant="titleMedium">
              Histórico
            </Text>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
              {total}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={loading} colors={[theme.colors.primary]} onRefresh={load} />}
    >
      <Seccion
        titulo="Órdenes de trabajo completadas"
        semana={String(stats.completeWeek)}
        total={String(stats.complete)}
      />
      <Seccion
        titulo="Órdenes de trabajo cumplidas"
        semana={`${(stats.compliantRateWeek * 100).toFixed(2)}%`}
        total={`${(stats.compliantRate * 100).toFixed(2)}%`}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', padding: 20 },
  metric: { flexDirection: 'column', alignItems: 'center' },
});
