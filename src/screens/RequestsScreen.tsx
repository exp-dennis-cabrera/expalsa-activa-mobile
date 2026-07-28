import ComingSoonScreen from './ComingSoonScreen';

export default function RequestsScreen(props: any) {
  return <ComingSoonScreen {...props} route={{ params: { label: 'Solicitudes' } }} />;
}
