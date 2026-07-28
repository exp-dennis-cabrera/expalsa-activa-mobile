import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { workOrdersApi } from '../../api/workOrders';

interface Props {
  navigation: any;
  route: { params: { id: number; askFeedback: boolean; requiresSignature: boolean } };
}

export default function CompleteWorkOrderScreen({ navigation, route }: Props) {
  const { id, askFeedback, requiresSignature } = route.params;
  const [feedback, setFeedback] = useState('');
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = (!askFeedback || feedback.trim()) && (!requiresSignature || signature.trim());

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await workOrdersApi.updateStatus(id, 'COMPLETED', {
        feedback: feedback.trim() || undefined,
        signature: signature.trim() || undefined,
      });
      navigation.navigate('WorkOrderDetail', { id });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'No se pudo completar la orden.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {askFeedback && (
        <TextInput
          label="Comentario de cierre"
          placeholder="Describí cómo quedó el trabajo"
          value={feedback}
          onChangeText={setFeedback}
          mode="outlined"
          multiline
          minRows={3}
          style={styles.input}
        />
      )}

      {requiresSignature && (
        <>
          <Text variant="bodySmall" style={styles.hint}>
            Esta orden requiere firma. Escribí tu nombre completo como firma.
          </Text>
          <TextInput label="Firma (nombre completo)" value={signature} onChangeText={setSignature} mode="outlined" style={styles.input} />
        </>
      )}

      {error && <HelperText type="error">{error}</HelperText>}

      <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={!canSubmit || submitting} style={styles.button}>
        Completar orden de trabajo
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  input: { marginBottom: 12 },
  hint: { color: '#6B7280', marginBottom: 8 },
  button: { marginTop: 16 },
});
