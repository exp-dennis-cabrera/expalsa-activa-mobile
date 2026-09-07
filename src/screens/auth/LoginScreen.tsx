import { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      // Distinguir NO PODER LLEGAR al servidor de credenciales malas: antes
      // ambos casos decian "correo o contraseña incorrectos", y con el
      // servidor caido o mal configurado uno se pasaba horas probando
      // contraseñas que si eran correctas.
      let message: string;
      if (err?.response?.data?.message) {
        message = err.response.data.message;
      } else if (!err?.response) {
        message = 'No se pudo conectar con el servidor. Revisa tu conexión o la dirección del servidor en Ajustes.';
      } else {
        message = 'Correo o contraseña incorrectos.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text variant="bodyMedium" style={styles.subtitle}>
          Mantenimiento inteligente
        </Text>

        <TextInput
          label="Correo"
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          label="Contraseña"
          mode="outlined"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        {error && <HelperText type="error">{error}</HelperText>}

        <Button mode="contained" onPress={handleLogin} loading={loading} disabled={loading} style={styles.button}>
          Ingresar
        </Button>

        <Button mode="text" onPress={() => navigation.navigate('CustomServer')} style={styles.serverButton}>
          Configurar servidor
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  // El logo ocupa el lugar del titulo. La altura fija evita que salte
  // mientras carga la imagen.
  logo: { width: '80%', height: 90, alignSelf: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center', color: '#6B7280', marginBottom: 32 },
  input: { marginBottom: 12 },
  button: { marginTop: 8, paddingVertical: 4 },
  serverButton: { marginTop: 16 },
});
