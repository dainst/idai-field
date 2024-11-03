import { fireEvent, render } from '@testing-library/react-native';
import { Dimension, Field } from 'idai-field-core';
import React from 'react';
import { ToastProvider } from '../Toast/ToastProvider';
import DimensionField from './DimensionField';

const fieldName = 'dimension';
const mockField: Field = {
  name: fieldName,
  inputType: 'dimension',
};

describe('DimensionField', () => {
  afterEach(() => jest.clearAllMocks());

  it('should display cancel and submit button when creating new Document', () => {
    const { getByTestId, queryByTestId } = render(
      <ToastProvider>
        <DimensionField field={mockField} setFunction={jest.fn()} />
      </ToastProvider>
    );

    const addBtn = getByTestId('addDim');

    expect(queryByTestId('okDim')).toBeNull();
    expect(queryByTestId('submitDim')).toBeNull();

    fireEvent.press(addBtn);
    expect(queryByTestId('okDim')).toBeNull();
    expect(queryByTestId('submitDim')).not.toBeNull();
  });

  it('should NOT call setFunction if no input value is provided', () => {
    //switch off console.error regarding useRef in Toast component
    jest.spyOn(console, 'error').mockImplementation(jest.fn());
    const setFuncMock = jest.fn();
    const { getByTestId } = render(
      <ToastProvider>
        <DimensionField field={mockField} setFunction={setFuncMock} />
      </ToastProvider>
    );
    const addBtn = getByTestId('addDim');

    fireEvent.press(addBtn);
    fireEvent.press(getByTestId('submitDim'));

    expect(setFuncMock).not.toBeCalled();
  });

  it('should call setFunction with correct parameters if creating new Dimension', () => {
    const newInputValue = 12;
    const comment = 'comment';
    const setFuncMock = jest.fn();
    const expectedDimension: Dimension = {
      inputUnit: 'cm',
      inputValue: newInputValue,
      isImprecise: true,
      value: 120000,
      measurementComment: 'comment',
    };
    const { getByTestId } = render(
      <ToastProvider>
        <DimensionField field={mockField} setFunction={setFuncMock} />
      </ToastProvider>
    );

    fireEvent.press(getByTestId('addDim'));
    fireEvent.changeText(getByTestId('dimInput'), newInputValue.toString());
    fireEvent(getByTestId('isImprecise'), 'onValueChange');
    fireEvent.changeText(getByTestId('measurementComment'), comment);
    fireEvent.press(getByTestId('submitDim'));

    expect(setFuncMock).toBeCalledWith(fieldName, [expectedDimension]);
  });

  it('should append new Document to array of existing measurements in currentValue prop', () => {
    const existingDim: Dimension = {
      inputUnit: 'cm',
      inputValue: 5,
      isImprecise: true,
      value: 50000,
      measurementComment: 'comment',
    };
    const newInputValue = 300;
    const newDim: Dimension = {
      inputUnit: 'cm',
      inputValue: newInputValue,
      value: 3000000,
      isImprecise: false,
    };
    const setFuncMock = jest.fn();
    const { getByTestId } = render(
      <ToastProvider>
        <DimensionField
          field={mockField}
          setFunction={setFuncMock}
          currentValue={[existingDim]}
        />
      </ToastProvider>
    );

    fireEvent.press(getByTestId('addDim'));
    fireEvent.changeText(getByTestId('dimInput'), newInputValue.toString());
    fireEvent.press(getByTestId('submitDim'));

    expect(setFuncMock).toBeCalledWith(fieldName, [existingDim, newDim]);
  });

  it('should update correct dimension of currentValue prop', () => {
    const firstDim: Dimension = {
      inputUnit: 'cm',
      inputValue: 5,
      isImprecise: true,
      value: 50000,
      measurementComment: 'comment',
    };

    const comment = 'hello';
    const oldValue = 300;
    const secondDim: Dimension = {
      inputUnit: 'm',
      inputValue: oldValue,
      value: 3000000,
      isImprecise: false,
      measurementComment: comment,
    };
    const updatedInputValue = 200;
    const udpatedDim: Dimension = {
      ...secondDim,
      inputValue: updatedInputValue,
      value: updatedInputValue * 1000000,
    };
    const setFuncMock = jest.fn();
    const { getByTestId } = render(
      <ToastProvider>
        <DimensionField
          field={mockField}
          setFunction={setFuncMock}
          currentValue={[firstDim, secondDim]}
        />
      </ToastProvider>
    );

    // assert correct values of selected dimension
    fireEvent.press(getByTestId('dimEdit_1'));

    expect(getByTestId('measurementComment').props.value).toEqual(comment);
    expect(getByTestId('dimInput').props.value).toEqual(oldValue.toString());

    //change values and assert correct setFunction call
    fireEvent.changeText(getByTestId('dimInput'), updatedInputValue.toString());
    fireEvent.press(getByTestId('okDim'));

    expect(setFuncMock).toBeCalledWith(fieldName, [firstDim, udpatedDim]);
  });

  it('should be able to delete correct dimension', () => {
    const firstDim: Dimension = {
      inputUnit: 'cm',
      inputValue: 5,
      isImprecise: true,
      value: 50000,
      measurementComment: 'comment',
    };
    const secondDim: Dimension = {
      inputUnit: 'm',
      inputValue: 300,
      value: 3000000,
      isImprecise: false,
    };
    const setFuncMock = jest.fn();
    const { getByTestId } = render(
      <ToastProvider>
        <DimensionField
          field={mockField}
          setFunction={setFuncMock}
          currentValue={[firstDim, secondDim]}
        />
      </ToastProvider>
    );

    fireEvent.press(getByTestId('dimDelete_0'));
    expect(setFuncMock).toBeCalledWith(fieldName, [secondDim]);
  });
});
