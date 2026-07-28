import { View, StyleSheet } from 'react-native';
import { List, Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen({ navigation }: any) {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Item title="Versión" description="0.1.0" />
      </List.Section>

      <Button mode="contained" buttonColor="#D8341E" onPress={logout} style={styles.logoutButton}>
        Cerrar sesión
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  logoutButton: { marginTop: 24 },
});
