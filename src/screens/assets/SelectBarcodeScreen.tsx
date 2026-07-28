import { useEffect, useState } from 'react';
import { Linking, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function SelectBarcodeScreen({ navigation, route }: any) {
  const { onChange } = route.params;
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const layout = useWindowDimensions();

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  function handleBarCodeScanned({ data }: { data: string }) {
    if (!scanned) {
      setScanned(true);
      navigation.goBack();
      onChange(data);
    }
  }

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text variant="titleLarge">Sin acceso a la cámara</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text variant="titleMedium">Dar permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openSettings()} style={styles.permissionButton}>
          <Text variant="titleMedium">Abrir ajustes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView onBarcodeScanned={handleBarCodeScanned} style={{ width: layout.width, height: layout.height }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  permissionContainer: { backgroundColor: 'white', padding: 20, borderRadius: 10, margin: 20 },
  permissionButton: { alignSelf: 'flex-start', marginTop: 16 },
});
