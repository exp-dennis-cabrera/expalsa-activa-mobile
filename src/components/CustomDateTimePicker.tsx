import { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function CustomDateTimePicker({
  onChange,
  value,
  label,
}: {
  onChange: (date: Date) => void;
  value: Date | null;
  label: string;
}) {
  const theme = useTheme();
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  return (
    <View>
      <TouchableOpacity
        onPress={() => setDatePickerVisibility(true)}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}
      >
        <Text>{label}</Text>
        {value && <Text style={{ color: theme.colors.primary }}>{value.toLocaleString()}</Text>}
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        date={value ?? new Date()}
        onConfirm={(newValue) => {
          onChange(newValue);
          setDatePickerVisibility(false);
        }}
        onCancel={() => setDatePickerVisibility(false)}
      />
    </View>
  );
}
