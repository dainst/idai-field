import { fireEvent, render } from '@testing-library/react-native';
import { Dating, Field } from 'idai-field-core';
import React from 'react';
import { IS_IMPRECISE_ID, IS_UNCERTAIN_ID, SOURCE_TEST_ID } from './constants';
import DatingField from './DatingField';

const fieldName = 'dating';
const mockField: Field = {
  name: fieldName,
  inputType: 'dating',
};

const dating1: Dating = {
  type: 'single',
  end: {
    year: 1946,
    inputYear: 4,
    inputType: 'bp',
  },
  source: 'Dating1',
};
const dating2: Dating = {
  type: 'before',
  end: {
    year: 7,
    inputYear: 7,
    inputType: 'ce',
  },
  source: 'Dating2',
};

describe('DatingField', () => {
  it('should show form if add button is pressed', () => {
    const { getByTestId, queryByTestId } = render(
      <DatingField field={mockField} setFunction={jest.fn()} />
    );

    expect(queryByTestId('datingForm')).toBeNull();
    expect(queryByTestId('addRow')).not.toBeNull();

    fireEvent.press(getByTestId('addDating'));

    expect(queryByTestId('datingForm')).not.toBeNull();
    expect(queryByTestId('addRow')).toBeNull();
  });

  it('should display form with: begin, end, isImprecise, isUncertrain, source fields for type RANGE', () => {
    const { getByTestId, queryByTestId } = render(
      <DatingField field={mockField} setFunction={jest.fn()} />
    );

    fireEvent.press(getByTestId('addDating')); //press add button
    fireEvent(getByTestId('typePicker'), 'onValueChange', 'range');

    expect(queryByTestId('begin_DatingElement')).not.toBeNull();
    expect(queryByTestId('end_DatingElement')).not.toBeNull();
    expect(queryByTestId(IS_IMPRECISE_ID)).not.toBeNull();
    expect(queryByTestId(IS_UNCERTAIN_ID)).not.toBeNull();
    expect(queryByTestId(SOURCE_TEST_ID)).not.toBeNull();
  });

  it('should display form with end, isUncertrain, source fields for type EXACT', () => {
    const { getByTestId, queryByTestId } = render(
      <DatingField field={mockField} setFunction={jest.fn()} />
    );

    fireEvent.press(getByTestId('addDating')); //press add button
    fireEvent(getByTestId('typePicker'), 'onValueChange', 'single');

    expect(queryByTestId('end_DatingElement')).not.toBeNull();
    expect(queryByTestId(IS_UNCERTAIN_ID)).not.toBeNull();
    expect(queryByTestId(SOURCE_TEST_ID)).not.toBeNull();
  });

  it('should display form with begin, isImprecise, isUncertrain, source fields for type BEFORE', () => {
    const { getByTestId, queryByTestId } = render(
      <DatingField field={mockField} setFunction={jest.fn()} />
    );

    fireEvent.press(getByTestId('addDating')); //press add button
    fireEvent(getByTestId('typePicker'), 'onValueChange', 'before');

    expect(queryByTestId('beforeForm')).not.toBeNull();
    expect(queryByTestId('end_DatingElement')).not.toBeNull();
    expect(queryByTestId(IS_IMPRECISE_ID)).not.toBeNull();
    expect(queryByTestId(IS_UNCERTAIN_ID)).not.toBeNull();
    expect(queryByTestId(SOURCE_TEST_ID)).not.toBeNull();
  });

  it('should display form with begin, isImprecise, isUncertrain, source fields for type AFTER', () => {
    const { getByTestId, queryByTestId } = render(
      <DatingField field={mockField} setFunction={jest.fn()} />
    );

    fireEvent.press(getByTestId('addDating')); //press add button
    fireEvent(getByTestId('typePicker'), 'onValueChange', 'after');

    expect(queryByTestId('afterForm')).not.toBeNull();
    expect(queryByTestId('begin_DatingElement')).not.toBeNull();
    expect(queryByTestId(IS_IMPRECISE_ID)).not.toBeNull();
    expect(queryByTestId(IS_UNCERTAIN_ID)).not.toBeNull();
    expect(queryByTestId(SOURCE_TEST_ID)).not.toBeNull();
  });

  it('should display from with begin, margin, source field for type SCIENTIFIC', () => {
    const { getByTestId, queryByTestId } = render(
      <DatingField field={mockField} setFunction={jest.fn()} />
    );

    fireEvent.press(getByTestId('addDating')); //press add button
    fireEvent(getByTestId('typePicker'), 'onValueChange', 'scientific');

    expect(queryByTestId('scientificForm')).not.toBeNull();
    expect(queryByTestId('end_DatingElement')).not.toBeNull();
    expect(queryByTestId('marginField')).not.toBeNull();
    expect(queryByTestId(SOURCE_TEST_ID)).not.toBeNull();
  });

  it('should call setFunction with correct values for type RANGE', () => {
    const setFunc = jest.fn();
    const source = 'Test';
    const begin = 5;
    const beginUnit = 'bce';
    const end = 8;
    const endUnit = 'ce';
    const expectedDating: Dating[] = [
      {
        type: 'range',
        begin: {
          year: -5,
          inputYear: begin,
          inputType: beginUnit,
        },
        end: {
          year: end,
          inputYear: end,
          inputType: endUnit,
        },
        isImprecise: true,
        source,
      },
    ];
    const { getByTestId } = render(
      <DatingField field={mockField} setFunction={setFunc} />
    );

    fireEvent.press(getByTestId('addDating')); //press add button
    fireEvent(getByTestId('typePicker'), 'onValueChange', 'range');

    //fill Period Form
    fireEvent.changeText(
      getByTestId('begin_DatingElementText'),
      begin.toString()
    );
    fireEvent(
      getByTestId('begin_DatingElementPicker'),
      'onValueChange',
      beginUnit
    );
    fireEvent.changeText(getByTestId('end_DatingElementText'), end.toString());
    fireEvent(getByTestId('end_DatingElementPicker'), 'onValueChange', endUnit);
    fireEvent.changeText(getByTestId(SOURCE_TEST_ID), source);
    fireEvent.press(getByTestId(`${IS_IMPRECISE_ID}Btn`));

    fireEvent.press(getByTestId('datingSubmitBtn'));

    expect(setFunc).toBeCalledWith(fieldName, expectedDating);
  });

  it('should call setFunction with correct values for type EXACT', () => {
    const setFunc = jest.fn();
    const source = 'Test';
    const end = 4;
    const endUnit = 'bp';
    const expectedDating: Dating[] = [
      {
        type: 'single',
        end: {
          year: 1946,
          inputYear: end,
          inputType: endUnit,
        },
        source,
      },
    ];

    const { getByTestId } = render(
      <DatingField field={mockField} setFunction={setFunc} />
    );

    fireEvent.press(getByTestId('addDating')); //press add button
    fireEvent(getByTestId('typePicker'), 'onValueChange', 'single'); //select exact

    //fill Exact Form
    fireEvent.changeText(getByTestId('end_DatingElementText'), end.toString());
    fireEvent(getByTestId('end_DatingElementPicker'), 'onValueChange', endUnit);
    fireEvent.changeText(getByTestId(SOURCE_TEST_ID), source);

    fireEvent.press(getByTestId('datingSubmitBtn'));

    expect(setFunc).toBeCalledWith(fieldName, expectedDating);
  });

  it('should call setFunction with correct values for type BEFORE', () => {
    const setFunc = jest.fn();
    const source = 'Test';
    const end = 7;
    const endUnit = 'ce';
    const expectedDating: Dating[] = [
      {
        type: 'before',
        end: {
          year: end,
          inputYear: end,
          inputType: endUnit,
        },
        isImprecise: true,
        source,
      },
    ];

    const { getByTestId } = render(
      <DatingField field={mockField} setFunction={setFunc} />
    );

    fireEvent.press(getByTestId('addDating')); //press add button
    fireEvent(getByTestId('typePicker'), 'onValueChange', 'before'); //select before

    //fill Before Form
    fireEvent.changeText(getByTestId('end_DatingElementText'), end.toString());
    fireEvent(getByTestId('end_DatingElementPicker'), 'onValueChange', endUnit);
    fireEvent.changeText(getByTestId(SOURCE_TEST_ID), source);
    fireEvent.press(getByTestId(`${IS_IMPRECISE_ID}Btn`));

    fireEvent.press(getByTestId('datingSubmitBtn'));

    expect(setFunc).toBeCalledWith(fieldName, expectedDating);
  });

  it('should call setFunction with correct values for type AFTER', () => {
    const setFunc = jest.fn();
    const source = 'Test';
    const end = 100;
    const endUnit = 'bce';
    const expectedDating: Dating[] = [
      {
        type: 'after',
        begin: {
          year: -end,
          inputYear: end,
          inputType: endUnit,
        },
        isImprecise: true,
        source,
      },
    ];

    const { getByTestId } = render(
      <DatingField field={mockField} setFunction={setFunc} />
    );

    fireEvent.press(getByTestId('addDating')); //press add button
    fireEvent(getByTestId('typePicker'), 'onValueChange', 'after'); //select after

    //fill After Form
    fireEvent.changeText(
      getByTestId('begin_DatingElementText'),
      end.toString()
    );
    fireEvent(
      getByTestId('begin_DatingElementPicker'),
      'onValueChange',
      endUnit
    );
    fireEvent.changeText(getByTestId(SOURCE_TEST_ID), source);
    fireEvent.press(getByTestId(`${IS_IMPRECISE_ID}Btn`));

    fireEvent.press(getByTestId('datingSubmitBtn'));

    expect(setFunc).toBeCalledWith(fieldName, expectedDating);
  });

  it('should call setFunction with correct values for type SCIENTIFIC', () => {
    const setFunc = jest.fn();
    const end = 3;
    const endUnit = 'bce';
    const margin = 4;
    const expectedDating: Dating[] = [
      {
        type: 'scientific',
        begin: {
          year: -1,
          inputYear: end,
          inputType: 'bce',
        },
        end: {
          year: 7,
          inputYear: end,
          inputType: 'bce',
        },
        margin,
      },
    ];

    const { getByTestId } = render(
      <DatingField field={mockField} setFunction={setFunc} />
    );

    fireEvent.press(getByTestId('addDating')); //press add button
    fireEvent(getByTestId('typePicker'), 'onValueChange', 'scientific'); //select scientific

    //fill Scientific Form
    fireEvent.changeText(getByTestId('end_DatingElementText'), end.toString());
    fireEvent(getByTestId('end_DatingElementPicker'), 'onValueChange', endUnit);
    fireEvent.changeText(getByTestId('marginField'), margin.toString());

    fireEvent.press(getByTestId('datingSubmitBtn'));

    expect(setFunc).toBeCalledWith(fieldName, expectedDating);
  });

  it('should display all Datings from currentValueProp', () => {
    const currentValue: Dating[] = [dating1, dating2];

    const { queryByTestId } = render(
      <DatingField
        field={mockField}
        setFunction={jest.fn()}
        currentValue={currentValue}
      />
    );

    expect(queryByTestId('currentValueDating_0')).not.toBeNull();
    expect(queryByTestId('currentValueDating_1')).not.toBeNull();
    expect(queryByTestId('datingRemove_0')).not.toBeNull();
    expect(queryByTestId('datingRemove_1')).not.toBeNull();
  });

  it('should append new Dating to currentValue Array', () => {
    const currentValue: Dating[] = [dating1, dating2];

    const source = 'Test';
    const end = 7;
    const endUnit = 'ce';
    const newDating: Dating = {
      type: 'before',
      end: {
        year: end,
        inputYear: end,
        inputType: endUnit,
      },
      isImprecise: true,
      source,
    };
    const setFunc = jest.fn();

    const { getByTestId } = render(
      <DatingField
        field={mockField}
        setFunction={setFunc}
        currentValue={currentValue}
      />
    );
    fireEvent.press(getByTestId('addDating')); //press add button
    fireEvent(getByTestId('typePicker'), 'onValueChange', 'before'); //select before

    //fill Before Form
    fireEvent.changeText(getByTestId('end_DatingElementText'), end.toString());
    fireEvent(getByTestId('end_DatingElementPicker'), 'onValueChange', endUnit);
    fireEvent.changeText(getByTestId(SOURCE_TEST_ID), source);
    fireEvent.press(getByTestId(`${IS_IMPRECISE_ID}Btn`));

    fireEvent.press(getByTestId('datingSubmitBtn'));

    expect(setFunc).toBeCalledWith(fieldName, [...currentValue, newDating]);
  });

  it('should remove correct Dating when pressing remove button', () => {
    const currentValue: Dating[] = [dating1, dating2];
    const setFunc = jest.fn();
    const { getByTestId } = render(
      <DatingField
        field={mockField}
        setFunction={setFunc}
        currentValue={currentValue}
      />
    );

    fireEvent.press(getByTestId('datingRemove_0'));
    expect(setFunc).toBeCalledWith(fieldName, [dating2]);
  });
});
