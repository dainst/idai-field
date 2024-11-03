import { fireEvent, render } from '@testing-library/react-native';
import { Field } from 'idai-field-core';
import React from 'react';
import BooleanField from './BooleanField';

const SWITCH_TESTID = 'switch';
const fieldName = 'boolean';
const mockField: Field = {
  name: fieldName,
  inputType: 'boolean',
};

describe('BooleanField', () => {
  it('should have clicked currentValue prop', () => {
    //turn off console error due to warning regarding rendering react-native <Switch />
    //component with testing-library rerender function
    jest.spyOn(console, 'error').mockImplementation(jest.fn());
    const { getByTestId, rerender } = render(
      <BooleanField
        field={mockField}
        currentValue={true}
        setFunction={jest.fn()}
      />
    );

    expect(getByTestId(SWITCH_TESTID).props.value).toBe(true);

    rerender(
      <BooleanField
        field={mockField}
        currentValue={false}
        setFunction={jest.fn()}
      />
    );

    expect(getByTestId(SWITCH_TESTID).props.value).toBe(false);
  });

  it('should call setFunction with correct value', () => {
    const setFunctionMock = jest.fn();
    const { getByTestId } = render(
      <BooleanField
        field={mockField}
        currentValue={true}
        setFunction={setFunctionMock}
      />
    );

    fireEvent(getByTestId(SWITCH_TESTID), 'onValueChange');
    expect(setFunctionMock).toBeCalledWith(fieldName, false);
  });
});
