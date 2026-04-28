import { FontAwesome } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

type OptionItem = {
  value: string;
  label: string;
};

interface DropDownProps {
  data: OptionItem[];
  onChange: (item: OptionItem) => void;
  placeholder: string;
}

const DropDown = ({ data, onChange, placeholder }: DropDownProps) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useCallback(() => setExpanded(!expanded), [expanded]);

  const [value, setValue] = useState('');

  const buttonRef = useRef<View>(null);

  const [top, setTop] = useState(0);

  const onSelect = useCallback((item: OptionItem) => {
    onChange(item);
    setValue(item.value);
    setExpanded(false);
  }, []);
  return (
    <View
      ref={buttonRef}
      onLayout={(event) => {
        const layout = event.nativeEvent.layout;
        const topOffset = layout.y;
        const heightOfComponent = layout.height;

        const finalValue =
          topOffset + heightOfComponent + (Platform.OS === 'android' ? 420 : 3);

        setTop(finalValue);
      }}
    >
      <TouchableOpacity style={styles.button} onPress={toggleExpanded}>
        <Text style={styles.text}>{value || placeholder}</Text>

        <FontAwesome name={expanded ? 'sort-up' : 'sort-down'} />
      </TouchableOpacity>
      {expanded ? (
        <Modal visible={expanded} transparent>
          <TouchableWithoutFeedback onPress={() => setExpanded(false)}>
            <View style={styles.backdrop}>
              <View style={[styles.options, { top }]}>
                <FlatList
                  keyExtractor={(item) => item.value}
                  data={data}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.optionItem}
                      onPress={() => onSelect(item)}
                    >
                      <Text>{item.value} </Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => (
                    <View style={styles.itemSeparator} />
                  )}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      ) : null}
    </View>
  );
};

export default DropDown;

const styles = StyleSheet.create({
  button: {
    height: 50,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  text: {
    fontSize: 15,
    opacity: 0.8,
  },
  options: {
    position: 'absolute',
    // top: 53,
    backgroundColor: '#fff',
    width: '98%',
    padding: 10,
    borderRadius: 6,
    maxHeight: 250,
    borderColor: '#ccc',
    borderWidth: 0.5,
  },
  optionItem: {
    height: 40,
    justifyContent: 'center',
  },
  itemSeparator: {
    height: 4,
  },
  backdrop: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});
