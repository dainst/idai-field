import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Dimension } from 'idai-field-core';
import React, { useContext, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PreferencesContext } from '@/contexts/preferences-context';
import useToast from '@/hooks/use-toast';
import { colors } from '@/utils/colors';
import translations from '@/utils/translations';
import BooleanRadio from '../BooleanRadio';
import Button from '../Button';
import Row from '../Row';
import { ToastType } from '../Toast/ToastProvider';
import { FieldBaseProps } from './common-props';
import FieldLabel from './FieldLabel';

const ICON_SIZE = 24;

type MeasurementType = 'single value' | 'range';
type MeasuredBy = 'maximum expansion' | 'mininum expansion';

const DimensionField: React.FC<FieldBaseProps> = ({
  setFunction,
  field,
  currentValue,
}) => {
  const [showAddRow, setShowAddRow] = useState<boolean>(true);
  const [measurementType, setMeasurementType] =
    useState<MeasurementType | null>('single value');
  const [inputValue, setInputValue] = useState<string>();
  const [inputRangeEndValue, setInputRangeEndValue] = useState<string>();
  const [inputUnit, setInputUnit] = useState<Dimension.InputUnits>('cm');
  const [measurementPosition, setMeasurementPosition] =
    useState<MeasuredBy | null>(null);
  const [isImprecise, setIsImprecise] = useState<boolean>(false);
  const [measurementComment, setMeasurementComment] = useState<string>();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { showToast } = useToast();
  const languages = useContext(PreferencesContext).preferences.languages;

  const addDimensionHandler = () => {
    setShowAddRow(false);
  };

  const submitHandler = (index?: number) => {
    if (inputValue) {
      const dimension: Dimension = {
        value: parseFloat(inputValue),
        inputValue: parseFloat(inputValue),
        inputUnit,
        measurementComment,
        isImprecise,
        inputRangeEndValue: inputRangeEndValue
          ? parseFloat(inputRangeEndValue)
          : undefined,
        measurementPosition: measurementPosition
          ? measurementPosition
          : undefined,
      };
      Object.keys(dimension).forEach(
        (key) => dimension[key] === undefined && delete dimension[key]
      );
      Dimension.addNormalizedValues(dimension);
      resetForm();
      setFunction(
        field.name,
        Array.isArray(currentValue) && currentValue.length
          ? index !== undefined
            ? (currentValue as Dimension[]).map((val, i) =>
                i === index ? dimension : val
              )
            : [...(currentValue as Dimension[]), dimension]
          : [dimension]
      );
    } else showToast(ToastType.Error, 'Please enter an input value');
  };

  const removeDimension = (index: number) => {
    if (currentValue && Array.isArray(currentValue))
      setFunction(
        field.name,
        (currentValue as Dimension[]).filter((_dim, i) => i !== index)
      );
  };

  const opendEditDimension = (index: number) => {
    if (
      !currentValue ||
      !Array.isArray(currentValue) ||
      currentValue.length < index + 1
    )
      return;

    if (editingIndex !== null) {
      setEditingIndex(null);
      resetForm();
      setShowAddRow(true);
      return;
    }

    const dimension = (currentValue as Dimension[])[index];
    if (dimension.inputRangeEndValue) {
      setMeasurementType('range');
      setInputRangeEndValue(dimension.inputRangeEndValue.toString());
    } else {
      setMeasurementType('single value');
    }
    setInputUnit(dimension.inputUnit);
    setIsImprecise(dimension.isImprecise);
    dimension.inputValue && setInputValue(dimension.inputValue.toString());
    dimension.measurementPosition &&
      setMeasurementPosition(dimension.measurementPosition as MeasuredBy);
    dimension.measurementComment &&
      setMeasurementComment(dimension.measurementComment);
    setEditingIndex(index);
    setShowAddRow(false);
  };

  const editDimensionHandler = () => {
    editingIndex != null && submitHandler(editingIndex);
  };

  const cancelBtnHandler = () => {
    setShowAddRow(true);
    setEditingIndex(null);
  };

  const resetForm = () => {
    setMeasurementType('single value');
    setInputValue(undefined);
    setInputRangeEndValue(undefined);
    setInputUnit('cm');
    setMeasurementPosition(null);
    setIsImprecise(false);
    setMeasurementComment(undefined);
    setShowAddRow(true);
    setEditingIndex(null);
  };

  const generateLabel = (dimension: Dimension) =>
    Dimension.generateLabel(
      dimension,
      (value: number) => value.toLocaleString(languages),
      getTranslation(languages)
    );

  return (
    <View style={styles.container}>
      <FieldLabel field={field} />
      <FlatList
        data={currentValue as Dimension[]}
        keyExtractor={(item: Dimension) => generateLabel(item)}
        renderItem={({ item, index }: { item: Dimension; index: number }) => (
          <Row style={styles.currentValues}>
            <Text>{generateLabel(item)}</Text>
            <Row style={{ marginLeft: 'auto' }}>
              <Button
                style={{ marginRight: 5 }}
                variant="danger"
                onPress={() => removeDimension(index)}
                icon={
                  <Ionicons
                    name="trash"
                    size={15}
                    testID={`dimDelete_${index}`}
                  />
                }
              />
              <Button
                variant="primary"
                onPress={() => opendEditDimension(index)}
                icon={
                  <Ionicons
                    name="create-outline"
                    size={15}
                    testID={`dimEdit_${index}`}
                  />
                }
              />
            </Row>
          </Row>
        )}
      />
      {showAddRow ? (
        <Row style={styles.addDimension}>
          <Text style={{ paddingRight: 2 }}>Add</Text>
          <TouchableOpacity onPress={addDimensionHandler} testID="addDim">
            <MaterialCommunityIcons
              name="plus-circle"
              size={ICON_SIZE}
              color={colors.success}
            />
          </TouchableOpacity>
        </Row>
      ) : (
        <View>
          <BooleanRadio<MeasurementType>
            labels={['single value', 'range']}
            selectedValue={measurementType}
            clickHandler={(value) => setMeasurementType(value)}
          />
          <Row style={{ alignItems: 'center' }}>
            <TextInput
              placeholder="input value"
              onChangeText={setInputValue}
              value={inputValue}
              style={styles.inputText}
              keyboardType="numeric"
              testID="dimInput"
            />
            {measurementType === 'range' && (
              <>
                <Text style={{ padding: 15 }}>-</Text>
                <TextInput
                  placeholder="Range end"
                  onChangeText={setInputRangeEndValue}
                  value={inputRangeEndValue}
                  style={styles.inputText}
                  keyboardType="numeric"
                />
              </>
            )}
            <Picker
              style={styles.picker}
              selectedValue={inputUnit}
              mode="dropdown"
              onValueChange={(itemValue) =>
                setInputUnit(itemValue as Dimension.InputUnits)
              }
              itemStyle={styles.pickerItem}
              testID="dimUnit"
            >
              {Dimension.VALID_INPUT_UNITS.map((unit) => (
                <Picker.Item value={unit} label={unit} key={unit} />
              ))}
            </Picker>
          </Row>
          <Row style={{ alignItems: 'center' }}>
            <Text>As measured by</Text>
            <BooleanRadio<MeasuredBy>
              labels={['mininum expansion', 'maximum expansion']}
              selectedValue={measurementPosition}
              undefinedPossible={true}
              clickHandler={(value) => setMeasurementPosition(value)}
            />
          </Row>
          <Row style={{ alignItems: 'center' }}>
            <Switch
              testID="isImprecise"
              trackColor={{ true: colors.primary, false: colors.lightgray }}
              thumbColor={'white'}
              value={isImprecise}
              onValueChange={() => setIsImprecise(!isImprecise)}
              style={{ margin: 5 }}
            />
            <Text>Imprecise</Text>
          </Row>
          <TextInput
            placeholder="Comment"
            onChangeText={setMeasurementComment}
            value={measurementComment}
            style={styles.inputText}
            testID="measurementComment"
          />
          <Row style={styles.buttonGroup}>
            {editingIndex !== null ? (
              <Button
                onPress={editDimensionHandler}
                style={[styles.button, { width: '15%' }]}
                variant="primary"
                title="Ok"
                testID="okDim"
              />
            ) : (
              <Button
                testID="submitDim"
                onPress={() => submitHandler()}
                style={styles.button}
                variant="primary"
                title="Submit"
              />
            )}
            <Button
              onPress={cancelBtnHandler}
              style={styles.button}
              variant="lightgray"
              title="Cancel"
            />
          </Row>
        </View>
      )}
    </View>
  );
};

const getTranslation = (_languages: string[]) => (key: string) =>
  translations[key];

const styles = StyleSheet.create({
  container: {
    margin: 5,
    padding: 5,
    width: '100%',
  },
  currentValues: {
    marginTop: 3,
    padding: 3,
    borderColor: colors.lightgray,
    borderWidth: 1,
    alignItems: 'center',
  },
  addDimension: {
    marginTop: 3,
    padding: 3,
    borderColor: colors.lightgray,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  picker: {
    width: 100,
    height: 100,
    marginLeft: 5,
    marginRight: '40%',
  },
  pickerItem: {
    height: 100,
    fontSize: 18,
  },
  inputText: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.lightgray,
    marginTop: 10,
    padding: 5,
  },
  buttonGroup: {
    margin: 5,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  button: {
    margin: 5,
  },
});

export default DimensionField;
