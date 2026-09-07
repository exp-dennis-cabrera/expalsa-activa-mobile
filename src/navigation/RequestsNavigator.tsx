import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { IconButton } from 'react-native-paper';
import RequestsScreen from '../screens/requests/RequestsScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function RequestsNavigator() {
  const { isRequester } = useAuth();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RequestsList"
        component={RequestsScreen}
        options={({ navigation }) => ({
          title: 'Solicitudes',
          // Igual que el real: un REQUESTER no tiene pestaña "Más" ni
          // "Inicio" -- sin este acceso, no tendría forma de llegar a
          // Ajustes (y por lo tanto, de cerrar sesión).
          headerRight: isRequester
            ? () => (
                <View style={{ flexDirection: 'row' }}>
                  <IconButton icon="cog-outline" onPress={() => navigation.navigate('Settings')} />
                </View>
              )
            : undefined,
        })}
      />
    </Stack.Navigator>
  );
}
