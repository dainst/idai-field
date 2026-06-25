import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { Field, Labels, Valuelist } from 'idai-field-core';
import React from 'react';
import LabelsContext from '@/contexts/labels/labels-context';
import ChoiceModal from './ChoiceModal/ChoiceModal';
import { NO_VAL } from './constants';
import RadioField from './RadioField';

const fieldName = 'RadioField';
const valueList: Valuelist = {
  id: 'valuelist',
  values: {
    1: { label: { de: 'eins', en: 'one' } },
    2: { label: { de: 'zwei', en: 'two' } },
    3: { label: { de: 'drei', en: 'three' } },
    4: { label: { de: 'vier', en: 'four' } },
    5: { label: { de: 'fünf', en: 'five' } },
  },
};
const mockField: Field = {
  name: fieldName,
  inputType: 'radio',
  valuelist: valueList,
};
const currentValue = '1';

// Mocking modules
jest.mock('./ChoiceModal/ChoiceModal');

describe('RadioField', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should only show choices modal if field button is clicked', () => {
    const { getByTestId } = render(
      <LabelsContext.Provider value={{ labels: new Labels(() => ['en']) }}>
        <RadioField field={mockField} setFunction={jest.fn()} currentValue="" />
      </LabelsContext.Provider>
    );

    expect(getByTestId('fieldBtn')).toBeTruthy();
    expect(ChoiceModal).not.toBeCalled();
    fireEvent.press(getByTestId('fieldBtn'));
    expect(ChoiceModal).toBeCalled();
  });

  it('should have only one field selected', () => {
    const expectedChoices = {
      5: { selected: false, label: '5' },
      4: { selected: false, label: '4' },
      1: { selected: true, label: '1' },
      3: { selected: false, label: '3' },
      2: { selected: false, label: '2' },
      [NO_VAL]: { selected: false, label: NO_VAL },
    };
    const { getByTestId } = render(
      <LabelsContext.Provider value={{ labels: new Labels(() => ['en']) }}>
        <RadioField
          field={mockField}
          setFunction={jest.fn()}
          currentValue={currentValue}
        />
      </LabelsContext.Provider>
    );
    fireEvent.press(getByTestId('fieldBtn'));

    expect(ChoiceModal).toHaveBeenCalledWith(
      expect.objectContaining({ choices: expectedChoices }),
      expect.anything()
    );
  });

  // eslint-disable-next-line max-len
  it('should call setFunction with correct props if labels button is pressed and should update valuesObject state', () => {
    const newValue = '2';
    const expectedNewChoices = {
      5: { selected: false, label: '5' },
      4: { selected: false, label: '4' },
      1: { selected: false, label: '1' },
      3: { selected: false, label: '3' },
      2: { selected: true, label: '2' },
      [NO_VAL]: { selected: false, label: NO_VAL },
    };
    const setFunciton = jest.fn();
    const { getByTestId } = render(
      <LabelsContext.Provider value={{ labels: new Labels(() => ['en']) }}>
        <RadioField
          field={mockField}
          setFunction={setFunciton}
          currentValue=""
        />
      </LabelsContext.Provider>
    );
    fireEvent.press(getByTestId('fieldBtn')); //open Modal

    fireEvent.press(getByTestId(`press_${newValue}`));

    expect(setFunciton).toBeCalledWith(fieldName, newValue);
    expect(ChoiceModal).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId('fieldBtn')); //open Modal again to check correct value
    expect((ChoiceModal as jest.Mock).mock.calls.slice(-1)[0][0]).toEqual(
      expect.objectContaining({ choices: expectedNewChoices })
    );
  });

  afterAll(() => {
    cleanup();
  });
});
