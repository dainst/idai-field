import { DatingElement } from 'idai-field-core';
import React from 'react';
import { StyleSheet } from 'react-native';
import BooleanCheckbox from '../../BooleanCheckbox';
import BaseForm from './BaseForm';
import { FormBaseProps, IS_UNCERTAIN_ID } from './constants';
import DatingElementField from './DatingElementField';

interface ExactFormProps extends FormBaseProps {
  end: DatingElement | undefined;
  setEnd: (dating: DatingElement) => void;
  isUncertain: boolean | undefined;
  setIsUncertian: (uncertain: boolean) => void;
}

const ExactForm: React.FC<ExactFormProps> = (props) => {
  return (
    <BaseForm
      onSubmit={props.onSubmit}
      onCancel={props.onCancel}
      setSource={props.setSource}
      source={props.source}
      testID="afterForm"
    >
      <DatingElementField
        dating={props.end}
        setDating={props.setEnd}
        type="end"
      />
      <BooleanCheckbox
        value={props.isUncertain}
        setValue={props.setIsUncertian}
        title="Uncertain"
        style={styles.checkbox}
        testID={IS_UNCERTAIN_ID}
      />
    </BaseForm>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    margin: 5,
  },
});

export default ExactForm;
