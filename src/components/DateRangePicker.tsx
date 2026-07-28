import { useState } from 'react';
import { View } from 'react-native';
import { HelperText } from 'react-native-paper';
import CustomDateTimePicker from './CustomDateTimePicker';

interface Props {
  value: [string | null, string | null];
  onChange: (dates: [string | null, string | null]) => void;
}

export default function DateRangePicker({ value, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);

  function onChangeInternal(date: Date, index: 0 | 1) {
    const clone: [string | null, string | null] = [...value];
    clone[index] = date.toISOString();
    onChange(clone);
    setError(null);
  }

  return (
    <View>
      <CustomDateTimePicker
        label="Desde"
        value={value[0] ? new Date(value[0]) : null}
        onChange={(date) => {
          if (!value[1] || date < new Date(value[1])) {
            onChangeInternal(date, 0);
          } else {
            setError('La fecha de inicio no puede ser posterior a la de fin.');
          }
        }}
      />
      <CustomDateTimePicker
        label="Hasta"
        value={value[1] ? new Date(value[1]) : null}
        onChange={(date) => {
          if (!value[0] || date > new Date(value[0])) {
            onChangeInternal(date, 1);
          } else {
            setError('La fecha de fin no puede ser anterior a la de inicio.');
          }
        }}
      />
      {error && <HelperText type="error">{error}</HelperText>}
    </View>
  );
}
