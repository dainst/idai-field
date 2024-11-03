import { Picker } from '@react-native-picker/picker';
import { Dating, DatingElement, DatingType } from 'idai-field-core';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { colors } from '../../../../utils/colors';
import Row from '../../Row';

interface DatingElementFieldProps {
  dating: DatingElement | undefined;
  setDating: (dating: DatingElement) => void;
  type: 'begin' | 'end';
}

const DatingElementField: React.FC<DatingElementFieldProps> = ({
  dating,
  setDating,
  type,
}) => {
  const [inputYear, setInputYear] = useState<string>();
  const [inputType, setInputType] = useState<DatingType>('bce');

  useEffect(() => {
    if (!dating) return;
    setInputType(dating.inputType || 'bce');
    setInputYear(dating.inputYear.toString() || '');
  }, [dating]);

  const changeInputYearHandler = (text: string) => {
    setInputYear(text);
    setDating({
      inputYear: parseInt(text),
      inputType,
    } as DatingElement);
  };

  const changeInputType = (type: DatingType) => {
    setInputType(type);
    if (inputYear) {
      setDating({
        inputYear: parseInt(inputYear),
        inputType: type,
      } as DatingElement);
    }
  };

  return (
    <Row style={styles.container} testID={`${type}_DatingElement`}>
      <TextInput
        placeholder="0"
        keyboardType="numeric"
        onChangeText={changeInputYearHandler}
        value={inputYear}
        testID={`${type}_DatingElementText`}
        style={styles.textInput}
      />
      <Picker
        style={styles.picker}
        selectedValue={inputType}
        onValueChange={(itemValue) => changeInputType(itemValue as DatingType)}
        mode="dropdown"
        itemStyle={styles.pickerItem}
        testID={`${type}_DatingElementPicker`}
      >
        {Dating.VALID_DATING_TYPES.map((type) => (
          <Picker.Item value={type} label={type} key={type} />
        ))}
      </Picker>
    </Row>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  textInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lightgray,
    width: '20%',
  },
  picker: {
    width: 100,
    height: 100,
  },
  pickerItem: {
    height: 100,
    fontSize: 18,
  },
});

export default DatingElementField;
