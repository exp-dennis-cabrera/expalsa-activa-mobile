import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreEntitiesScreen from '../screens/MoreEntitiesScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';

const Stack = createNativeStackNavigator();

export default function MoreNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MoreEntities" component={MoreEntitiesScreen} options={{ title: 'Más' }} />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
