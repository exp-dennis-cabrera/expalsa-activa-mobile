import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Platform, TouchableOpacity, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import HomeScreen from '../screens/HomeScreen';
import WorkOrdersNavigator from './WorkOrdersNavigator';
import RequestsScreen from '../screens/RequestsScreen';
import MoreNavigator from './MoreNavigator';

const Tab = createBottomTabNavigator();

// Mismo boton "+" flotante, elevado por encima de la barra, que el real
// (CreateTabBarButton en navigation/index.tsx).
function CreateTabBarButton({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  return (
    <TouchableOpacity style={{ top: -25, justifyContent: 'center', alignItems: 'center' }} onPress={onPress}>
      <View style={{ width: 20 }}>{children}</View>
    </TouchableOpacity>
  );
}

export default function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarStyle: {
          position: 'absolute',
          bottom: 17,
          left: 20,
          right: 20,
          elevation: 8,
          borderRadius: 15,
          height: 70,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 18 : 10,
          borderTopWidth: 0,
          backgroundColor: theme.colors.surface,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarItemStyle: { justifyContent: 'center', alignItems: 'center' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'Inicio',
          headerShown: true,
          headerTitle: () => <Text style={{ color: theme.colors.primary, fontSize: 22, fontWeight: 'bold' }}>Expalsa Activa</Text>,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={30} />,
          headerRight: () => <IconButton icon="cog-outline" onPress={() => navigation.navigate('Settings')} />,
        })}
      />
      <Tab.Screen
        name="WorkOrdersTab"
        component={WorkOrdersNavigator}
        options={{
          title: 'Órdenes',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={30} color={color} />,
        }}
      />
      <Tab.Screen
        name="AddEntities"
        component={HomeScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Simplificacion: el real abre una hoja para elegir QUE crear
            // (orden, activo, etc). Nosotros hoy solo tenemos creacion de
            // Ordenes de trabajo, asi que vamos directo ahi.
            navigation.navigate('AddWorkOrder');
          },
        })}
        options={{
          title: '',
          tabBarIcon: () => <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={60} />,
          tabBarButton: (props) => <CreateTabBarButton onPress={props.onPress as any}>{props.children}</CreateTabBarButton>,
        }}
      />
      <Tab.Screen
        name="RequestsTab"
        component={RequestsScreen}
        options={{
          title: 'Solicitudes',
          tabBarIcon: ({ color }) => <Feather name="inbox" color={color} size={28} />,
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreNavigator}
        options={{
          title: 'Más',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'menu' : 'menu-outline'} size={28} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
