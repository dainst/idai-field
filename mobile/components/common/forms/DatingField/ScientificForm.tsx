import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DatingElement } from 'idai-field-core';
import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { colors } from '../../../../utils/colors';
import Row from '../../Row';
import BaseForm from './BaseForm';
import { FormBaseProps } from './constants';
import DatingElementField from './DatingElementField';

interface ScientificFormProps extends FormBaseProps {
  end: DatingElement | undefined;
  setEnd: (dating: DatingElement) => void;
  margin: number | undefined;
  setMargin: (margin: number) => void;
}

const ScientificForm: React.FC<ScientificFormProps> = (props) => {
  return (
    <BaseForm
      onSubmit={props.onSubmit}
      onCancel={props.onCancel}
      setSource={props.setSource}
      source={props.source}
      testID="scientificForm"
    >
      <Row>
        <DatingElementField
          dating={props.end}
          setDating={props.setEnd}
          type="end"
        />
        <MaterialCommunityIcons name="plus-minus" size={20} color="black" />
        <TextInput
          value={props.margin ? props.margin.toString() : ''}
          placeholder="0"
          onChangeText={(text) => props.setMargin(parseInt(text))}
          keyboardType="numeric"
          style={styles.marginField}
          testID="marginField"
        />
      </Row>
    </BaseForm>
  );
};

const styles = StyleSheet.create({
  marginField: {
    borderWidth: 1,
    borderColor: colors.lightgray,
    margin: 5,
    padding: 5,
    width: '25%',
  },
});

export default ScientificForm;
