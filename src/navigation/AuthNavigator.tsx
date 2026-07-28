import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import CustomServerScreen from '../screens/auth/CustomServerScreen';

export type AuthStackParamList = {
  Login: undefined;
  CustomServer: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="CustomServer"
        component={CustomServerScreen}
        options={{ headerShown: true, title: 'Servidor' }}
      />
    </Stack.Navigator>
  );
}
