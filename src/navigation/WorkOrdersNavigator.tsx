import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WorkOrdersListScreen from '../screens/workOrders/WorkOrdersListScreen';

// Solo la LISTA queda anidada en la pestaña -- es la unica pantalla de este
// dominio que debe seguir mostrando la barra flotante de abajo. Detalle,
// Crear y Completar viven en el stack raiz (ver RootNavigator.tsx), igual
// que WODetails/CreateWorkOrder/CompleteWorkOrder en el real -- por eso ahi
// la barra flotante desaparece.
export type WorkOrdersStackParamList = {
  WorkOrdersList: { status?: 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED'; dueToday?: boolean; highPriority?: boolean; assignedOnly?: boolean } | undefined;
};

const Stack = createNativeStackNavigator<WorkOrdersStackParamList>();

export default function WorkOrdersNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="WorkOrdersList" component={WorkOrdersListScreen} options={{ title: 'Órdenes de trabajo' }} />
    </Stack.Navigator>
  );
}
