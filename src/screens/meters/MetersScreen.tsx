import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Avatar, Chip, Switch, SegmentedButtons, Menu, Button, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { metersApi, type Meter } from '../../api/meters';
import { categoriesApi as categoriasApi, type Category } from '../../api/categories';

export default function MetersScreen({ navigation, route }: any) {
  const theme = useTheme();
  const [meters, setMeters] = useState<Meter[]>([]);
  const [search, setSearch] = useState('');
  // Si llega desde el aviso de lecturas pendientes, el filtro arranca
  // activo: la notificacion dice "3 medidores sin lectura" y al tocarla
  // debe mostrarlos, no la lista completa.
  const params = (route?.params ?? {}) as { soloVencidos?: boolean };
  const [soloVencidos, setSoloVencidos] = useState(params.soloVencidos ?? false);
  const [planta, setPlanta] = useState('TODAS');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [menuTipoAbierto, setMenuTipoAbierto] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    metersApi.list().then(setMeters).catch(() => {});
    // Las categorias alimentan el selector de tipo (agua, combustible...).
    categoriasApi.list('METER').then(setCategorias).catch(() => setCategorias([]));
  }, []);

  useFocusEffect(load);

  // Con 200 medidores, buscar solo por nombre no alcanza: tambien mira el
  // activo y la ubicacion. Y el interruptor deja ver solo los que toca leer.
  const texto = search.trim().toLowerCase();
  const filtered = meters
    .filter(
      (m) =>
        !texto ||
        m.name.toLowerCase().includes(texto) ||
        (m.assetName ?? '').toLowerCase().includes(texto) ||
        (m.locationName ?? '').toLowerCase().includes(texto),
    )
    .filter((m) => !soloVencidos || m.readingStatus !== 'AL_DIA')
    // Filtro de planta: compara contra el nombre de la ubicacion del
    // medidor. Se usa "incluye" y no igualdad exacta para que tambien
    // funcione si el medidor cuelga de una sub-ubicacion dentro de la
    // planta (ej. "Planta Expalsa - Sala de Maquinas").
    .filter((m) => planta === 'TODAS' || (m.locationName ?? '').toLowerCase().includes(planta.toLowerCase()))
    // Tipo de medidor: se filtra por la CATEGORIA, elegida de un selector
    // que se llena solo con las que existan. Asi funciona igual para agua,
    // combustible, energia o lo que se agregue despues, sin tocar codigo.
    .filter((m) => categoriaId === null || m.categoryId === categoriaId);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Buscar por medidor, activo o ubicación…"
        value={search}
        onChangeText={setSearch}
        style={{ backgroundColor: theme.colors.background }}
      />
      <SegmentedButtons
        value={planta}
        onValueChange={setPlanta}
        density="small"
        style={styles.plantas}
        buttons={[
          { value: 'TODAS', label: 'Todas' },
          { value: 'Expalsa', label: 'Expalsa' },
          { value: 'Latamfoods', label: 'LatamFoods' },
        ]}
      />
      {/* Selector de tipo: solo aparece si hay categorias creadas. */}
      {categorias.length > 0 && (
        <View style={styles.tipoRow}>
          <Menu
            visible={menuTipoAbierto}
            onDismiss={() => setMenuTipoAbierto(false)}
            anchor={
              <Button
                mode="outlined"
                compact
                icon="filter-variant"
                onPress={() => setMenuTipoAbierto(true)}
              >
                {categoriaId === null
                  ? 'Todos los tipos'
                  : categorias.find((cat) => cat.id === categoriaId)?.name ?? 'Tipo'}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => { setCategoriaId(null); setMenuTipoAbierto(false); }}
              title="Todos los tipos"
            />
            {categorias.map((cat) => (
              <Menu.Item
                key={cat.id}
                onPress={() => { setCategoriaId(cat.id); setMenuTipoAbierto(false); }}
                title={cat.name}
              />
            ))}
          </Menu>
        </View>
      )}
      <View style={styles.filterRow}>
        <Text variant="bodyMedium">Solo pendientes</Text>
        <Switch value={soloVencidos} onValueChange={setSoloVencidos} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} colors={[theme.colors.primary]} onRefresh={() => { setRefreshing(true); load(); setRefreshing(false); }} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="titleMedium">No hay medidores que coincidan.</Text>
          </View>
        ) : (
          filtered.map((meter) => (
            <TouchableOpacity key={meter.id} onPress={() => navigation.navigate('MeterDetail', { id: meter.id })}>
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Avatar.Icon style={{ backgroundColor: theme.colors.background }} color="white" icon="gauge" size={50} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                      {meter.name}
                    </Text>
                    <View style={styles.cardBody}>
                      {meter.assetName && (
                        <Text variant="bodySmall" style={styles.muted}>
                          📦 {meter.assetName}
                        </Text>
                      )}
                      {meter.locationName && (
                        <Text variant="bodySmall" style={styles.muted}>
                          📍 {meter.locationName}
                        </Text>
                      )}
                      {/* Naranja mientras el turno nocturno tiene tiempo,
                          rojo cuando ya paso la hora limite sin registrar. */}
                      {meter.readingStatus === 'PENDIENTE' && (
                        <Chip compact style={{ backgroundColor: '#F59E0B', alignSelf: 'flex-start' }} textStyle={{ color: 'white', fontSize: 11 }}>
                          Pendiente
                        </Chip>
                      )}
                      {meter.readingStatus === 'INCUMPLIDO' && (
                        <Chip compact style={{ backgroundColor: theme.colors.error, alignSelf: 'flex-start' }} textStyle={{ color: 'white', fontSize: 11 }}>
                          No registrado
                        </Chip>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  plantas: { marginHorizontal: 16, marginTop: 8 },
  tipoRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 8 },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16, gap: 8 },
  empty: { backgroundColor: '#ffffff', padding: 20, borderRadius: 10, margin: 12 },
  card: { backgroundColor: '#ffffff', marginBottom: 1, padding: 10 },
  cardRow: { flexDirection: 'row' },
  cardBody: { gap: 6, marginTop: 4 },
  muted: { color: '#6B7280' },
});
