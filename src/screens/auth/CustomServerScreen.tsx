import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl, resetApiClient, setCustomServerUrl } from '../../api/client';

export default function CustomServerScreen() {
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getApiBaseUrl().then(setUrl);
  }, []);

  async function handleSave() {
    await setCustomServerUrl(url.trim() || null);
    resetApiClient(); // para que el proximo pedido use la nueva URL
    setSaved(true);
  }

  async function handleReset() {
    await AsyncStorage.removeItem('expalsa_custom_server_url');
    resetApiClient();
    const defaultUrl = await getApiBaseUrl();
    setUrl(defaultUrl);
    setSaved(true);
  }

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Servidor
      </Text>
      <Text variant="bodySmall" style={styles.description}>
        Si tu empresa aloja su propio servidor de Expalsa Activa, pon la dirección aquí. Si no sabes qué es esto,
        déjalo como está.
      </Text>

      <TextInput
        label="URL del servidor"
        mode="outlined"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="https://mi-empresa.expalsa-activa.com"
        value={url}
        onChangeText={(v) => {
          setUrl(v);
          setSaved(false);
        }}
        style={styles.input}
      />

      {saved && <HelperText type="info">Guardado.</HelperText>}

      <Button mode="contained" onPress={handleSave} style={styles.button}>
        Guardar
      </Button>
      <Button mode="text" onPress={handleReset} style={styles.button}>
        Restablecer al valor por defecto
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontWeight: '700', marginBottom: 8 },
  description: { color: '#6B7280', marginBottom: 20 },
  input: { marginBottom: 8 },
  button: { marginTop: 8 },
});
