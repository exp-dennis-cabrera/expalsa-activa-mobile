import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Avatar, Chip, Button, SegmentedButtons, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { assetsApi, type Asset, type AssetStatus } from '../../api/assets';

export const STATUS_LABELS: Record<AssetStatus, string> = {
  OPERATIONAL: 'Operativo',
  MODERNIZATION: 'En modernización',
  DOWN: 'Fuera de servicio',
  STANDBY: 'En espera',
  INSPECTION_SCHEDULED: 'Inspección programada',
  COMMISSIONING: 'En puesta en marcha',
  EMERGENCY_SHUTDOWN: 'Parada de emergencia',
};

export function statusColor(status: AssetStatus, theme: any): string {
  switch (status) {
    case 'OPERATIONAL':
      return theme.colors.success;
    case 'MODERNIZATION':
      return '#CBC3E3';
    case 'DOWN':
    case 'EMERGENCY_SHUTDOWN':
      return theme.colors.error;
    case 'STANDBY':
      return theme.colors.primary;
    case 'INSPECTION_SCHEDULED':
      return theme.colors.warning;
    case 'COMMISSIONING':
      return 'grey';
  }
}

function AssetCard({
  asset,
  navigation,
  showChildrenButton,
  onViewChildren,
}: {
  asset: Asset;
  navigation: any;
  showChildrenButton?: boolean;
  onViewChildren?: () => void;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('AssetDetail', { id: asset.id })}>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {asset.imageUrl ? (
            <Avatar.Image size={50} source={{ uri: asset.imageUrl }} />
          ) : (
            <Avatar.Icon style={{ backgroundColor: theme.colors.background }} color="white" icon="package-variant-closed" size={50} />
          )}
          <View style={{ flex: 1, marginLeft: 8 }}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                  {asset.name}
                </Text>
                <Text variant="bodySmall" style={{ color: 'grey' }}>
                  #{asset.customId ?? asset.id}
                </Text>
              </View>
              <Chip compact style={{ backgroundColor: statusColor(asset.status, theme) }} textStyle={{ color: 'white', fontSize: 11 }}>
                {STATUS_LABELS[asset.status]}
              </Chip>
            </View>
            {asset.locationName && (
              <Text variant="bodySmall" style={{ color: theme.colors.grey ?? 'grey', marginTop: 4 }}>
                📍 {asset.locationName}
              </Text>
            )}
            {showChildrenButton && (
              <View style={styles.cardFooter}>
                <View style={{ flex: 1 }} />
                <Button compact onPress={onViewChildren}>
                  Ver subactivos
                </Button>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function AssetsScreen({ navigation }: any) {
  const theme = useTheme();
  const [view, setView] = useState<'hierarchy' | 'list'>('hierarchy');
  const [search, setSearch] = useState('');
  const [flatAssets, setFlatAssets] = useState<Asset[]>([]);
  const [hierarchyAssets, setHierarchyAssets] = useState<Asset[]>([]);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (view === 'list') {
      assetsApi.list(0, 50, search || undefined).then((r) => setFlatAssets(r.content)).catch(() => {});
    } else {
      assetsApi.hierarchy().then(setHierarchyAssets).catch(() => {});
    }
  }, [view, search]);

  useFocusEffect(load);

  const currentLevelAssets = hierarchyAssets.filter((a) => a.parentAssetId === currentParentId);
  const hasChildren = (assetId: number) => hierarchyAssets.some((a) => a.parentAssetId === assetId);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Buscar…"
        value={search}
        onChangeText={(v) => {
          setSearch(v);
          setView('list');
        }}
        style={{ backgroundColor: theme.colors.background }}
      />
      <SegmentedButtons
        value={view}
        onValueChange={(v) => setView(v as 'hierarchy' | 'list')}
        style={{ marginHorizontal: 12, marginTop: 8 }}
        buttons={[
          { value: 'hierarchy', label: 'Jerarquía', icon: 'file-tree' },
          { value: 'list', label: 'Lista', icon: 'format-list-bulleted' },
        ]}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} colors={[theme.colors.primary]} onRefresh={() => { setRefreshing(true); load(); setRefreshing(false); }} />}
      >
        {view === 'list' ? (
          flatAssets.length === 0 ? (
            <View style={styles.empty}>
              <Text variant="titleMedium">No hay activos que coincidan.</Text>
            </View>
          ) : (
            flatAssets.map((asset) => <AssetCard key={asset.id} asset={asset} navigation={navigation} />)
          )
        ) : currentLevelAssets.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="titleMedium">No hay activos en este nivel.</Text>
          </View>
        ) : (
          currentLevelAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              navigation={navigation}
              showChildrenButton={hasChildren(asset.id)}
              onViewChildren={() => setCurrentParentId(asset.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { backgroundColor: '#ffffff', padding: 20, borderRadius: 10, margin: 12 },
  card: { backgroundColor: '#ffffff', marginBottom: 1, padding: 10 },
  cardRow: { flexDirection: 'row' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
});
