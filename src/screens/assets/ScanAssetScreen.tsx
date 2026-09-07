import { Alert, Platform, View } from 'react-native';
import { Divider, List, useTheme } from 'react-native-paper';
import { assetsApi } from '../../api/assets';

// NFC deshabilitado en iOS, igual que el real.
const isNfcEnabled = Platform.select({ ios: false, default: true });

export default function ScanAssetScreen({ navigation }: any) {
  const theme = useTheme();

  function handleAssetFound(assetId: number) {
    navigation.replace('AssetDetail', { id: assetId });
  }

  function handleNotFound(identifier: { nfcId?: string; barCode?: string }) {
    Alert.alert('Error', 'No se encontró ningún activo con ese código. ¿Quieres crear uno nuevo?', [
      { text: 'No', onPress: () => navigation.goBack() },
      { text: 'Sí', onPress: () => navigation.replace('AddAsset', { presetIdentifier: identifier }) },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View>
        {isNfcEnabled && (
          <>
            <List.Item
              title="NFC"
              onPress={() =>
                navigation.navigate('SelectNfc', {
                  onChange: (nfcId: string) =>
                    assetsApi
                      .getByNfc(nfcId)
                      .then((asset) => handleAssetFound(asset.id))
                      .catch(() => handleNotFound({ nfcId })),
                })
              }
            />
            <Divider />
          </>
        )}
        <List.Item
          title="Código de barras/QR"
          onPress={() =>
            navigation.navigate('SelectBarcode', {
              onChange: (barCode: string) =>
                assetsApi
                  .getByBarcode(barCode)
                  .then((asset) => handleAssetFound(asset.id))
                  .catch(() => handleNotFound({ barCode })),
            })
          }
        />
      </View>
    </View>
  );
}
