import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Platform, TouchableOpacity, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import HomeScreen from '../screens/HomeScreen';
import WorkOrdersNavigator from './WorkOrdersNavigator';
import RequestsNavigator from './RequestsNavigator';
import MoreNavigator from './MoreNavigator';
import { useAuth } from '../context/AuthContext';

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
  const { isRequester, hasCreatePermission } = useAuth();

  return (
    <Tab.Navigator
      // Igual que el real: un usuario REQUESTER arranca directo en
      // Solicitudes, no en Inicio (initialRouteName condicional).
      initialRouteName={isRequester ? 'RequestsTab' : 'Home'}
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
      {/* Igual que el real: un REQUESTER no ve Inicio, Ordenes ni Mas --
          su cuenta solo puede tocar Solicitudes. */}
      {!isRequester && (
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
      )}
      {!isRequester && (
        <Tab.Screen
          name="WorkOrdersTab"
          component={WorkOrdersNavigator}
          options={{
            title: 'Órdenes',
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={30} color={color} />,
          }}
        />
      )}
      <Tab.Screen
        name="AddEntities"
        component={HomeScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Igual que el real: si sos REQUESTER, el "+" va directo a
            // crear una solicitud. Para el resto de los roles, sigue
            // siendo la simplificacion ya conocida (va directo a crear
            // Orden de trabajo, en vez de abrir una hoja "que querés crear"),
            // pero solo si el rol tiene permiso de crear -- un rol View
            // Only, por ejemplo, no puede.
            if (isRequester) {
              navigation.navigate('AddRequest');
            } else if (hasCreatePermission('WORK_ORDERS')) {
              navigation.navigate('AddWorkOrder');
            }
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
        component={RequestsNavigator}
        options={{
          title: 'Solicitudes',
          tabBarIcon: ({ color }) => <Feather name="inbox" color={color} size={28} />,
        }}
      />
      {!isRequester && (
        <Tab.Screen
          name="MoreTab"
          component={MoreNavigator}
          options={{
            title: 'Más',
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'menu' : 'menu-outline'} size={28} color={color} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
}
