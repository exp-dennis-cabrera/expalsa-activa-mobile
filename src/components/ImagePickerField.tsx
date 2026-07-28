import { useState } from 'react';
import { View, Modal, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  name: string;
  mimeType: string;
}

interface Props {
  label: string;
  image: PickedImage | null;
  existingImageUrl?: string | null;
  onChange: (image: PickedImage | null) => void;
}

// Mismo patron que FileUpload.tsx real: tocar "Imagen" abre una hoja con 2
// opciones (Biblioteca / Camara), en vez de ir directo a la galeria.
// Simplificacion honesta: el real abre una camara IN-APP con overlay
// propio (InAppCamera.tsx); nosotros usamos el selector de camara nativo
// del sistema via expo-image-picker (misma libreria, launcher estandar en
// vez de una UI de camara custom).
export default function ImagePickerField({ label, image, existingImageUrl, onChange }: Props) {
  const theme = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  async function pickFromLibrary() {
    setSheetOpen(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      onChange({ uri: asset.uri, name: asset.fileName ?? asset.uri.split('/').pop() ?? 'imagen.jpg', mimeType: asset.mimeType ?? 'image/jpeg' });
    }
  }

  async function takePhoto() {
    setSheetOpen(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      onChange({ uri: asset.uri, name: asset.fileName ?? asset.uri.split('/').pop() ?? 'foto.jpg', mimeType: asset.mimeType ?? 'image/jpeg' });
    }
  }

  const previewUri = image?.uri ?? existingImageUrl ?? null;

  return (
    <View>
      {previewUri ? (
        <View style={styles.previewRow}>
          <Image source={{ uri: previewUri }} style={styles.preview} />
          <IconButton icon="close-circle" iconColor={theme.colors.error} onPress={() => onChange(null)} />
        </View>
      ) : (
        <TouchableOpacity onPress={() => setSheetOpen(true)} style={styles.row}>
          <Text>{label}</Text>
          <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={22} onPress={() => setSheetOpen(true)} style={{ margin: 0 }} />
        </TouchableOpacity>
      )}

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setSheetOpen(false)}>
          <View style={styles.sheet}>
            <TouchableOpacity style={styles.sheetItem} onPress={pickFromLibrary}>
              <Text>Elegir de la biblioteca</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={takePhoto}>
              <Text>Tomar foto</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  previewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  preview: { width: 80, height: 80, borderRadius: 8 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingVertical: 8 },
  sheetItem: { paddingVertical: 16, paddingHorizontal: 20 },
});
