import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Dialog,
  Divider,
  List,
  Portal,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { meApi, type MyProfile, type UserSettings } from '../api/me';
import { useAuth } from '../context/AuthContext';

/**
 * Copia fiel de Profile.tsx real: avatar arriba, seccion de informacion
 * (correo, telefono, rol, tarifa), seccion de notificaciones con
 * interruptores, y al final cambiar contraseña / eliminar cuenta.
 */
export default function UserProfileScreen({ navigation }: any) {
  const theme = useTheme();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const [openPassword, setOpenPassword] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);

  const load = useCallback(() => {
    meApi.getProfile().then(setProfile).catch(() => {});
    meApi.getSettings().then(setSettings).catch(() => {});
  }, []);

  useFocusEffect(load);

  function iniciales(p: MyProfile): string {
    return `${(p.firstName ?? '').charAt(0)}${(p.lastName ?? '').charAt(0)}`.toUpperCase() || '?';
  }

  async function cambiarAjuste(campo: keyof UserSettings) {
    if (!settings) return;
    const nuevo = { ...settings, [campo]: !settings[campo] };
    setSettings(nuevo);
    try {
      await meApi.updateSettings({ [campo]: nuevo[campo] });
    } catch {
      setSettings(settings); // revierte si falla
      setMensaje({ texto: 'No se pudo guardar el cambio.', error: true });
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setMensaje({ texto: 'Las contraseñas no coinciden.', error: true });
      return;
    }
    if (newPassword.length < 8) {
      setMensaje({ texto: 'La contraseña debe tener al menos 8 caracteres.', error: true });
      return;
    }
    setBusy(true);
    try {
      await meApi.changePassword(oldPassword, newPassword);
      setOpenPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMensaje({ texto: 'Contraseña actualizada.', error: false });
    } catch {
      setMensaje({ texto: 'La contraseña actual no es correcta.', error: true });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAccount() {
    setBusy(true);
    try {
      await meApi.deleteAccount();
      setOpenDelete(false);
      await logout();
    } catch {
      setMensaje({ texto: 'No se pudo eliminar la cuenta.', error: true });
      setOpenDelete(false);
    } finally {
      setBusy(false);
    }
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const notificaciones: { campo: keyof UserSettings; titulo: string }[] = [
    { campo: 'emailNotified', titulo: 'Recibir notificaciones por correo' },
    { campo: 'emailUpdatesForWorkOrders', titulo: 'Avisos de órdenes de trabajo' },
    { campo: 'emailUpdatesForRequests', titulo: 'Avisos de solicitudes' },
    { campo: 'statsForAssignedWorkOrders', titulo: 'Resumen de mis órdenes asignadas' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.avatarBox}>
        {profile.avatarUrl ? (
          <Avatar.Image size={100} source={{ uri: profile.avatarUrl }} />
        ) : (
          <Avatar.Text size={100} label={iniciales(profile)} />
        )}
        <Text variant="titleLarge" style={{ marginTop: 12, fontWeight: 'bold' }}>
          {`${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()}
        </Text>
        {profile.jobTitle && (
          <Text variant="bodyLarge" style={{ color: '#6B7280' }}>
            {profile.jobTitle}
          </Text>
        )}
      </View>

      {mensaje && (
        <Text
          style={{ textAlign: 'center', padding: 12, color: mensaje.error ? theme.colors.error : theme.colors.primary }}
        >
          {mensaje.texto}
        </Text>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Información
      </Text>
      <List.Item title="Correo" description={profile.email} />
      <Divider />
      <List.Item title="Teléfono" description={profile.phone ?? '—'} />
      <Divider />
      <List.Item title="Rol" description={profile.role?.name ?? '—'} />
      <Divider />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Notificaciones
      </Text>
      {settings ? (
        notificaciones.map(({ campo, titulo }) => (
          <List.Item
            key={campo}
            title={titulo}
            titleNumberOfLines={2}
            right={() => <Switch value={settings[campo]} onValueChange={() => cambiarAjuste(campo)} />}
          />
        ))
      ) : (
        <ActivityIndicator style={{ margin: 16 }} />
      )}

      <Button mode="outlined" style={styles.action} onPress={() => setOpenPassword(true)}>
        Cambiar contraseña
      </Button>
      <Button mode="text" textColor={theme.colors.error} style={styles.action} onPress={() => setOpenDelete(true)}>
        Eliminar mi cuenta
      </Button>

      <Portal>
        <Dialog visible={openPassword} onDismiss={() => setOpenPassword(false)}>
          <Dialog.Title>Cambiar contraseña</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Contraseña actual"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              mode="outlined"
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Contraseña nueva"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Confirmar contraseña"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpenPassword(false)}>Cancelar</Button>
            <Button onPress={handleChangePassword} loading={busy} disabled={busy}>
              Cambiar contraseña
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={openDelete} onDismiss={() => setOpenDelete(false)}>
          <Dialog.Title>Eliminar cuenta</Dialog.Title>
          <Dialog.Content>
            <Text>
              Tu cuenta quedará deshabilitada y perderás el acceso. Esta acción no se puede deshacer. ¿Continuar?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpenDelete(false)}>Cancelar</Button>
            <Button textColor={theme.colors.error} onPress={handleDeleteAccount} loading={busy} disabled={busy}>
              Sí, eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarBox: { alignItems: 'center', paddingVertical: 24, backgroundColor: 'white' },
  sectionTitle: { fontWeight: 'bold', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  action: { margin: 16, marginBottom: 4 },
});
