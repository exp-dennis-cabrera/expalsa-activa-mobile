import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Switch, Button, Divider, IconButton, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { lookupsApi, type IdName, type UserSummary } from '../../api/lookups';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';
import DateRangePicker from '../../components/DateRangePicker';
import type { AdvancedFilters } from '../../api/workOrders';

interface Props {
  navigation: any;
  route: { params: { current: AdvancedFilters; onApply: (f: AdvancedFilters) => void; onReset: () => void } };
}

function toIdLabel(items: IdName[]) {
  return items.map((i) => ({ id: i.id, label: i.name }));
}
function toUserIdLabel(items: UserSummary[]) {
  return items.map((i) => ({ id: i.id, label: i.fullName || i.email }));
}

// Misma fila que el real (Form/index.tsx): etiqueta + resumen de lo elegido,
// con un icono +/check -- al tocar, navega a la pantalla de seleccion
// completa (SelectListScreen), no abre un dialogo chico.
function SelectRow({
  label,
  options,
  selectedIds,
  onChange,
  navigation,
}: {
  label: string;
  options: { id: number; label: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  navigation: any;
}) {
  const theme = useTheme();
  const summary = options.filter((o) => selectedIds.includes(o.id)).map((o) => o.label).join(', ');

  return (
    <TouchableOpacity
      style={styles.selectRow}
      onPress={() => navigation.navigate('SelectList', { title: label, options, selected: selectedIds, onChange })}
    >
      <View style={styles.selectRowHeader}>
        <Text>{label}</Text>
        <IconButton iconColor={theme.colors.primary} icon={selectedIds.length ? 'check-circle' : 'plus-circle'} />
      </View>
      {!!selectedIds.length && (
        <Text style={{ color: theme.colors.primary }} numberOfLines={1}>
          {summary}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function WorkOrderFiltersScreen({ navigation, route }: Props) {
  const { current, onApply, onReset } = route.params;

  const [assets, setAssets] = useState<IdName[]>([]);
  const [categories, setCategories] = useState<IdName[]>([]);
  const [teams, setTeams] = useState<IdName[]>([]);
  const [locations, setLocations] = useState<IdName[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);

  const [assetIds, setAssetIds] = useState<number[]>(current.assetIds ?? []);
  const [categoryIds, setCategoryIds] = useState<number[]>(current.categoryIds ?? []);
  const [teamIds, setTeamIds] = useState<number[]>(current.teamIds ?? []);
  const [locationIds, setLocationIds] = useState<number[]>(current.locationIds ?? []);
  const [createdByIds, setCreatedByIds] = useState<number[]>(current.createdByIds ?? []);
  const [completedByIds, setCompletedByIds] = useState<number[]>(current.completedByIds ?? []);
  const [primaryUserIds, setPrimaryUserIds] = useState<number[]>(current.primaryUserIds ?? []);
  const [additionalWorkerIds, setAdditionalWorkerIds] = useState<number[]>(current.additionalWorkerIds ?? []);
  const [archived, setArchived] = useState(!!current.archived);

  const [createdAtRange, setCreatedAtRange] = useState<[string | null, string | null]>([current.createdAtFrom ?? null, current.createdAtTo ?? null]);
  const [completedAtRange, setCompletedAtRange] = useState<[string | null, string | null]>([current.completedAtFrom ?? null, current.completedAtTo ?? null]);
  const [updatedAtRange, setUpdatedAtRange] = useState<[string | null, string | null]>([current.updatedAtFrom ?? null, current.updatedAtTo ?? null]);
  const [dueDateBefore, setDueDateBefore] = useState<Date | null>(current.dueDateBefore ? new Date(current.dueDateBefore) : null);

  useFocusEffect(
    useCallback(() => {
      lookupsApi.assets().then(setAssets).catch(() => {});
      lookupsApi.categories('WORK_ORDER').then(setCategories).catch(() => {});
      lookupsApi.teams().then(setTeams).catch(() => {});
      lookupsApi.locations().then(setLocations).catch(() => {});
      lookupsApi.users().then(setUsers).catch(() => {});
    }, []),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={() => {
            onReset();
            navigation.goBack();
          }}
        >
          Restablecer
        </Button>
      ),
    });
  }, [navigation, onReset]);

  function handleSubmit() {
    onApply({
      assetIds,
      categoryIds,
      teamIds,
      locationIds,
      createdByIds,
      completedByIds,
      primaryUserIds,
      additionalWorkerIds,
      archived,
      dueDateBefore: dueDateBefore?.toISOString(),
      createdAtFrom: createdAtRange[0] ?? undefined,
      createdAtTo: createdAtRange[1] ?? undefined,
      completedAtFrom: completedAtRange[0] ?? undefined,
      completedAtTo: completedAtRange[1] ?? undefined,
      updatedAtFrom: updatedAtRange[0] ?? undefined,
      updatedAtTo: updatedAtRange[1] ?? undefined,
    });
    navigation.goBack();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SelectRow label="Activo" options={toIdLabel(assets)} selectedIds={assetIds} onChange={setAssetIds} navigation={navigation} />
      <SelectRow label="Categoría" options={toIdLabel(categories)} selectedIds={categoryIds} onChange={setCategoryIds} navigation={navigation} />
      <SelectRow label="Equipo" options={toIdLabel(teams)} selectedIds={teamIds} onChange={setTeamIds} navigation={navigation} />
      <SelectRow label="Ubicación" options={toIdLabel(locations)} selectedIds={locationIds} onChange={setLocationIds} navigation={navigation} />

      <Text variant="titleSmall" style={styles.groupTitle}>
        Personas
      </Text>
      <SelectRow label="Creado por" options={toUserIdLabel(users)} selectedIds={createdByIds} onChange={setCreatedByIds} navigation={navigation} />
      <SelectRow label="Completado por" options={toUserIdLabel(users)} selectedIds={completedByIds} onChange={setCompletedByIds} navigation={navigation} />
      <SelectRow label="Trabajador principal" options={toUserIdLabel(users)} selectedIds={primaryUserIds} onChange={setPrimaryUserIds} navigation={navigation} />
      <SelectRow
        label="Trabajadores adicionales"
        options={toUserIdLabel(users)}
        selectedIds={additionalWorkerIds}
        onChange={setAdditionalWorkerIds}
        navigation={navigation}
      />

      <View style={styles.switchRow}>
        <Text>Archivada</Text>
        <Switch value={archived} onValueChange={setArchived} />
      </View>

      <Divider style={styles.divider} />
      <Text variant="titleSmall" style={styles.groupTitle}>
        Fechas
      </Text>

      <Text variant="bodyMedium" style={styles.fieldLabel}>
        Creada el
      </Text>
      <DateRangePicker value={createdAtRange} onChange={setCreatedAtRange} />

      <Text variant="bodyMedium" style={styles.fieldLabel}>
        Completada el
      </Text>
      <DateRangePicker value={completedAtRange} onChange={setCompletedAtRange} />

      <Text variant="bodyMedium" style={styles.fieldLabel}>
        Actualizada el
      </Text>
      <DateRangePicker value={updatedAtRange} onChange={setUpdatedAtRange} />

      <Text variant="bodyMedium" style={styles.fieldLabel}>
        Fecha de vencimiento
      </Text>
      <CustomDateTimePicker label="Antes de" value={dueDateBefore} onChange={setDueDateBefore} />

      <Button mode="contained" onPress={handleSubmit} style={styles.saveButton}>
        Guardar
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 60 },
  selectRow: { marginBottom: 8 },
  selectRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupTitle: { marginTop: 16, marginBottom: 4, fontWeight: 'bold' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  divider: { marginVertical: 8 },
  fieldLabel: { marginTop: 10, marginBottom: 4 },
  saveButton: { marginTop: 24 },
});
