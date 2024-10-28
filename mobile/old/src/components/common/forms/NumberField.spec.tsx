import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { Field } from 'idai-field-core';
import React from 'react';
import NumberField from './NumberField';

const fieldName = 'numberField';
const mockField: Field = {
  name: fieldName,
  inputType: 'unsignedInt',
};
const currentValue = '50';
const mockSetValueFn = jest.fn();

describe('NumberField', () => {
  it('should display currentValue prop in TextInput', () => {
    const { getByTestId } = render(
      <NumberField
        field={mockField}
        setFunction={mockSetValueFn}
        currentValue={currentValue}
      />
    );

    expect(getByTestId('input').props.value).toEqual(currentValue);
  });

  it('should show the correct keyboard regarding field.inputType', () => {
    const { getByTestId, rerender } = render(
      <NumberField
        field={mockField}
        setFunction={mockSetValueFn}
        currentValue={currentValue}
      />
    );

    expect(getByTestId('input').props.keyboardType).toEqual('number-pad');

    rerender(
      <NumberField
        field={{ name: fieldName, inputType: 'float' }}
        setFunction={mockSetValueFn}
        currentValue="60.4"
      />
    );

    expect(getByTestId('input').props.keyboardType).toEqual('numeric');
  });

  it('should display the entered input text', () => {
    const { getByTestId } = render(
      <NumberField
        field={mockField}
        setFunction={mockSetValueFn}
        currentValue={currentValue}
      />
    );
    const changedText = '60';

    fireEvent.changeText(getByTestId('input'), changedText);
    expect(getByTestId('input').props.value).toEqual(changedText);
  });

  it('should call setFunction on onChangeText with correct parameters for unsignedInt', () => {
    const { getByTestId } = render(
      <NumberField
        field={mockField}
        setFunction={mockSetValueFn}
        currentValue={currentValue}
      />
    );
    const changedText = '-80';

    fireEvent.changeText(getByTestId('input'), changedText);
    expect(mockSetValueFn).toHaveBeenCalledWith(fieldName, '');

    const validInput = '80';
    fireEvent.changeText(getByTestId('input'), validInput);
    expect(mockSetValueFn.mock.calls.slice(-1)[0]).toEqual([
      fieldName,
      validInput,
    ]);
  });

  it('should call setFunction on onChangeText with correct parameters for float', () => {
    const floatField: Field = {
      name: fieldName,
      inputType: 'float',
    };
    const { getByTestId } = render(
      <NumberField
        field={floatField}
        setFunction={mockSetValueFn}
        currentValue={currentValue}
      />
    );
    const invalidValue = 'two';

    fireEvent.changeText(getByTestId('input'), invalidValue);
    expect(mockSetValueFn.mock.calls.slice(-1)[0]).toEqual([fieldName, '']);

    const validInput = '80.0';
    fireEvent.changeText(getByTestId('input'), validInput);
    expect(mockSetValueFn.mock.calls.slice(-1)[0]).toEqual([
      fieldName,
      validInput,
    ]);
  });

  afterAll(() => {
    cleanup();
  });
});
