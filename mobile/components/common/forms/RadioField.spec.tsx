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
const currentValue = 'one';

// Mocking modules
jest.mock('idai-field-core');
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
      one: { selected: true, label: 'one' },
      two: { selected: false, label: 'two' },
      three: { selected: false, label: 'three' },
      four: { selected: false, label: 'four' },
      five: { selected: false, label: 'five' },
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
    const newValue = 'two';
    const expectedNewChoices = {
      one: { selected: false, label: 'one' },
      two: { selected: true, label: 'two' },
      three: { selected: false, label: 'three' },
      four: { selected: false, label: 'four' },
      five: { selected: false, label: 'five' },
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
