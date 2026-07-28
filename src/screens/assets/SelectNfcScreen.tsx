import { useEffect } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

type NfcModule = typeof import('react-native-nfc-manager');

// Igual que el real: el modulo de NFC nunca se importa en iOS.
const nfcModule: NfcModule | null = Platform.OS === 'ios' ? null : (require('react-native-nfc-manager') as NfcModule);
const NfcManager = nfcModule?.default;
const NfcTech = nfcModule?.NfcTech;

export default function SelectNfcScreen({ navigation, route }: any) {
  const { onChange } = route.params;

  async function readNdef() {
    try {
      await NfcManager!.requestTechnology(NfcTech!.Ndef);
      const tag = await NfcManager!.getTag();
      return tag?.id || null;
    } finally {
      NfcManager!.cancelTechnologyRequest().catch(() => {});
    }
  }

  useEffect(() => {
    if (!NfcManager || !NfcTech) {
      navigation.goBack();
      return;
    }
    let cancelled = false;

    NfcManager.start()
      .then(() => readNdef())
      .then((tagId) => {
        if (cancelled) return;
        if (tagId) {
          navigation.goBack();
          onChange(tagId);
        } else {
          Alert.alert('Error', 'No se encontró ninguna etiqueta NFC.', [{ text: 'Ok', onPress: () => navigation.goBack() }]);
        }
      })
      .catch((error: any) => {
        if (cancelled) return;
        Alert.alert('Error', error?.message ?? 'No se pudo leer el NFC.', [{ text: 'Ok', onPress: () => navigation.goBack() }]);
      });

    return () => {
      cancelled = true;
      NfcManager?.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={{ marginBottom: 20 }} variant="titleLarge">
        Escaneando…
      </Text>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
