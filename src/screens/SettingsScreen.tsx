import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Dialog, IconButton, List, Portal, Text, useTheme } from 'react-native-paper';
import Constants from 'expo-constants';
import { meApi, type MyProfile } from '../api/me';
import { useAuth } from '../context/AuthContext';

/**
 * Copia fiel de SettingsScreen real: perfil arriba (avatar + correo +
 * "Actualizar perfil"), cerrar sesion en rojo con confirmacion, y la
 * version -- que al tocarla 6 veces revela la informacion de compilacion.
 */
export default function SettingsScreen({ navigation }: any) {
  const theme = useTheme();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [openLogout, setOpenLogout] = useState(false);
  const [openDevInfo, setOpenDevInfo] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [versionPressCount, setVersionPressCount] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    meApi.getProfile().then(setProfile).catch(() => {});
  }, []);

  // Igual que el real: a partir del tercer toque avisa cuantos faltan, y
  // al sexto abre la informacion de compilacion.
  useEffect(() => {
    if (versionPressCount > 2 && versionPressCount < 6) {
      setAviso(`Modo desarrollador en ${6 - versionPressCount}`);
    } else if (versionPressCount === 6) {
      setOpenDevInfo(true);
      setDevMode(true);
      setVersionPressCount(0);
      setAviso(null);
    }
  }, [versionPressCount]);

  function iniciales(p: MyProfile): string {
    return `${(p.firstName ?? '').charAt(0)}${(p.lastName ?? '').charAt(0)}`.toUpperCase() || '?';
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Portal>
        <Dialog visible={openLogout} onDismiss={() => setOpenLogout(false)}>
          <Dialog.Title>Confirmación</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">¿Seguro que quieres cerrar sesión?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpenLogout(false)}>Cancelar</Button>
            <Button onPress={logout}>Cerrar sesión</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={openDevInfo} onDismiss={() => setOpenDevInfo(false)}>
          <Dialog.Title>Información técnica</Dialog.Title>
          <Dialog.Content>
            <Text variant="titleMedium">Versión</Text>
            <Text variant="bodyMedium">{Constants.expoConfig?.version ?? '—'}</Text>
            <Text variant="titleMedium" style={{ marginTop: 12 }}>
              Servidor
            </Text>
            <Text variant="bodyMedium">{(Constants.expoConfig?.extra as any)?.DEFAULT_API_URL ?? '—'}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpenDevInfo(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View>
        <List.Item
          style={styles.item}
          left={() =>
            profile?.avatarUrl ? (
              <Avatar.Image size={50} source={{ uri: profile.avatarUrl }} />
            ) : (
              <Avatar.Text size={50} label={profile ? iniciales(profile) : '?'} />
            )
          }
          title={profile?.email ?? 'Cargando…'}
          description="Actualizar perfil"
          onPress={() => navigation.navigate('UserProfile')}
        />
        <List.Item
          style={styles.item}
          left={() => <IconButton iconColor={theme.colors.error} icon="logout" />}
          title="Cerrar sesión"
          titleStyle={{ color: theme.colors.error }}
          onPress={() => setOpenLogout(true)}
        />
        <List.Item
          style={styles.item}
          left={() => <IconButton icon="information-outline" />}
          title="Versión"
          description={Constants.expoConfig?.version ?? '—'}
          onPress={() => {
            if (devMode) {
              setOpenDevInfo(true);
            } else {
              setVersionPressCount((n) => n + 1);
            }
          }}
        />
        {aviso && (
          <Text style={{ textAlign: 'center', color: theme.colors.primary, paddingVertical: 8 }}>{aviso}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { paddingHorizontal: 20 },
});
