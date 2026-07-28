import { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Text, IconButton, Portal, Dialog, Checkbox, useTheme } from 'react-native-paper';

interface Props<T extends string> {
  label: string;
  allOptions: { value: T; label: string }[];
  selected: T[]; // vacio = "todas" (sin filtro)
  defaultSelected: T[];
  onChange: (values: T[]) => void;
}

export default function EnumFilterButton<T extends string>({ label, allOptions, selected, defaultSelected, onChange }: Props<T>) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<T[]>(selected);

  const isNonDefault = JSON.stringify([...selected].sort()) !== JSON.stringify([...defaultSelected].sort());

  function toggle(value: T) {
    setDraft((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  return (
    <TouchableOpacity
      onPress={() => {
        setDraft(selected);
        setOpen(true);
      }}
      style={{
        backgroundColor: isNonDefault ? theme.colors.primary : theme.colors.background,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        paddingLeft: 15,
        margin: 5,
      }}
    >
      <Text style={{ color: isNonDefault ? 'white' : 'black', fontWeight: 'bold' }}>{label}</Text>
      <IconButton icon="chevron-double-down" iconColor={isNonDefault ? 'white' : 'black'} size={15} />

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => {
            setOpen(false);
            onChange(draft);
          }}
          style={{ backgroundColor: 'white' }}
        >
          <Dialog.Title>Seleccionar</Dialog.Title>
          <Dialog.Content>
            {allOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={{ marginTop: 5, padding: 10, flexDirection: 'row', alignItems: 'center', borderRadius: 5 }}
                onPress={() => toggle(option.value)}
              >
                <Checkbox status={draft.includes(option.value) ? 'checked' : 'unchecked'} onPress={() => toggle(option.value)} />
                <Text>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </Dialog.Content>
        </Dialog>
      </Portal>
    </TouchableOpacity>
  );
}
