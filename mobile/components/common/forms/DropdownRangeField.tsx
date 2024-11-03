import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OptionalRange } from 'idai-field-core';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LabelsContext from '@/contexts/labels/labels-context';
import { colors } from '@/utils/colors';
import Row from '../Row';
import ChoiceModal, { ItemsObject } from './ChoiceModal/ChoiceModal';
import { FieldBaseProps } from './common-props';
import { NO_VAL } from './constants';
import FieldLabel from './FieldLabel';

const DropdownRangeField: React.FC<FieldBaseProps> = ({
  field,
  setFunction,
  currentValue,
}) => {
  const { labels } = useContext(LabelsContext);

  const [isValuesModalOpen, setIsValuesModalOpen] = useState<boolean>(false);
  const [valuesObject, setValuesObject] = useState<ItemsObject>({});

  const [isEndValuesModalOpen, setIsEndValuesModalOpen] =
    useState<boolean>(false);
  const [endValuesObject, setEndValuesObject] = useState<ItemsObject>({});
  const [showEndElements, setShowEndElements] = useState<boolean>(false);

  const getValues = useCallback(
    () =>
      field.valuelist && labels
        ? labels.orderKeysByLabels(field.valuelist)
        : [],
    [field, labels]
  );

  const initValuesObject = useCallback(() => {
    const itemData: ItemsObject = {};
    getValues().forEach(
      (value) => (itemData[value] = { selected: false, label: value })
    );
    itemData[NO_VAL] = { selected: false, label: NO_VAL };
    return itemData;
  }, [getValues]);

  useEffect(() => {
    const currentValueRange = currentValue as OptionalRange<string> | undefined;
    const valuesData = initValuesObject();
    if (currentValueRange) {
      valuesData[currentValueRange.value].selected = true;
    } else valuesData[NO_VAL].selected = true;
    setValuesObject(valuesData);

    const endValuesData = initValuesObject();
    if (currentValueRange && currentValueRange.endValue) {
      setShowEndElements(true);
      endValuesData[currentValueRange.endValue].selected = true;
    } else endValuesData[NO_VAL].selected = true;
    setEndValuesObject(endValuesData);
  }, [currentValue, initValuesObject]);

  const closeValueModal = () => setIsValuesModalOpen(false);

  const selectValue = (label: string) => {
    const itemData = initValuesObject();
    itemData[label].selected = true;
    setValuesObject(itemData);
    if (label !== NO_VAL) {
      const range: OptionalRange<string> = { value: label };
      const endValue = getSelectedValue(endValuesObject);
      if (endValue !== NO_VAL) range[OptionalRange.ENDVALUE] = endValue;
      setFunction(field.name, range);
    }
    closeValueModal();
  };

  const closeEndValueModal = () => setIsEndValuesModalOpen(false);

  const selectEndValue = (label: string) => {
    const itemData = initValuesObject();
    itemData[label].selected = true;
    setEndValuesObject(itemData);
    if (label !== NO_VAL) {
      const value = getSelectedValue(valuesObject);
      const range: OptionalRange<string> = { value, endValue: label };
      setFunction(field.name, range);
    }
    closeEndValueModal();
  };

  return (
    <View style={styles.container}>
      {isValuesModalOpen && (
        <ChoiceModal
          resetValues={closeValueModal}
          choices={valuesObject}
          field={field}
          setValue={selectValue}
          type="radio"
        />
      )}
      {isEndValuesModalOpen && (
        <ChoiceModal
          resetValues={closeEndValueModal}
          choices={endValuesObject}
          field={field}
          setValue={selectEndValue}
          type="radio"
        />
      )}
      <FieldLabel field={field} />
      <Row style={styles.selectionRow}>
        <TouchableOpacity
          testID="valueTextBtn"
          style={styles.selectionField}
          onPress={() => setIsValuesModalOpen(true)}
        >
          <Text testID="valueText">{getSelectedValue(valuesObject)}</Text>
        </TouchableOpacity>
        {showEndElements ? (
          <>
            <Text style={{ paddingHorizontal: 5 }}>to</Text>
            <TouchableOpacity
              testID="endValueTextBtn"
              style={styles.selectionField}
              onPress={() => setIsEndValuesModalOpen(true)}
            >
              <Text testID="endValueText">
                {getSelectedValue(endValuesObject)}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={() => setShowEndElements((prev) => !prev)}
            testID="arrowIconBtn"
          >
            <MaterialCommunityIcons
              name="arrow-expand-horizontal"
              size={20}
              testID="arrowIcon"
            />
          </TouchableOpacity>
        )}
      </Row>
    </View>
  );
};

const getSelectedValue = (data: ItemsObject) => {
  const selectedKey = Object.keys(data).filter((key) => data[key].selected);
  if (selectedKey && selectedKey.length) return data[selectedKey[0]].label;
  else return '';
};

const styles = StyleSheet.create({
  container: {
    margin: 5,
    padding: 5,
    width: '100%',
  },
  selectionRow: {
    alignItems: 'center',
  },
  selectionField: {
    marginTop: 3,
    padding: 5,
    borderColor: colors.lightgray,
    borderWidth: 1,
    width: '45%',
  },
});

export default DropdownRangeField;
