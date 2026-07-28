import { useEffect, useLayoutEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Checkbox, Searchbar, Button, useTheme } from 'react-native-paper';

export interface SelectOption {
  id: number;
  label: string;
  subtitle?: string;
}

interface Props {
  navigation: any;
  route: {
    params: {
      title: string;
      options: SelectOption[];
      selected: number[];
      onChange: (ids: number[]) => void;
    };
  };
}

// Igual patron que SelectUsersModal / SelectAssetsModal / etc. reales:
// pantalla completa (no un dialogo chico), busqueda arriba, tarjetas con
// checkbox, boton "Agregar" en el encabezado que confirma y vuelve.
export default function SelectListScreen({ navigation, route }: Props) {
  const { title, options, selected, onChange } = route.params;
  const theme = useTheme();
  const [selectedIds, setSelectedIds] = useState<number[]>(selected);
  const [search, setSearch] = useState('');

  function toggle(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () => (
        <Button
          onPress={() => {
            onChange(selectedIds);
            navigation.goBack();
          }}
        >
          Agregar
        </Button>
      ),
    });
  }, [navigation, title, selectedIds]);

  useEffect(() => {
    setSelectedIds(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase().trim()));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar placeholder="Buscar…" value={search} onChangeText={setSearch} style={{ backgroundColor: theme.colors.background }} />
      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {filtered.map((option) => (
          <TouchableOpacity key={option.id} onPress={() => toggle(option.id)}>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    {option.label}
                  </Text>
                  {option.subtitle && (
                    <Text variant="bodySmall" style={{ color: 'grey' }}>
                      {option.subtitle}
                    </Text>
                  )}
                </View>
                <Checkbox status={selectedIds.includes(option.id) ? 'checked' : 'unchecked'} onPress={() => toggle(option.id)} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { backgroundColor: 'white', marginBottom: 1, padding: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontWeight: 'bold' },
});
