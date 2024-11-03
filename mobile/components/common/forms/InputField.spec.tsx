import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { Field } from 'idai-field-core';
import React from 'react';
import InputField from './InputField';

const fieldName = 'test';
const mockField: Field = {
  name: fieldName,
  inputType: 'input',
};
const currentValue = 'Find1';
const mockSetValueFn = jest.fn();

jest.mock('expo-barcode-scanner');

describe('InputField', () => {
  it('should display currentValue prop in TextInput', () => {
    const { getByTestId } = render(
      <InputField
        field={mockField}
        setFunction={mockSetValueFn}
        currentValue={currentValue}
      />
    );

    expect(getByTestId(`inputField_${mockField.name}`).props.value).toEqual(
      currentValue
    );
  });

  it('should display the entered input text', () => {
    const { getByTestId } = render(
      <InputField
        field={mockField}
        setFunction={mockSetValueFn}
        currentValue={currentValue}
      />
    );
    const changedText = 'Find2';

    fireEvent.changeText(
      getByTestId(`inputField_${mockField.name}`),
      changedText
    );
    expect(getByTestId(`inputField_${mockField.name}`).props.value).toEqual(
      changedText
    );
  });

  it('should call setFunction on onChangeText with correct parameters', () => {
    const { getByTestId } = render(
      <InputField
        field={mockField}
        setFunction={mockSetValueFn}
        currentValue={currentValue}
      />
    );
    const changedText = 'Find2';

    fireEvent.changeText(
      getByTestId(`inputField_${mockField.name}`),
      changedText
    );
    expect(mockSetValueFn).toHaveBeenCalledWith(fieldName, changedText);
  });

  afterAll(() => {
    cleanup();
  });
});
