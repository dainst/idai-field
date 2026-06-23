import { fireEvent, render } from '@testing-library/react-native';
import { Field } from 'idai-field-core';
import React from 'react';
import ChoiceModal, { ItemsObject } from './ChoiceModal';

const fieldName = 'choiceModal';
const mockField: Field = {
  name: fieldName,
  inputType: 'checkboxes',
};

const choices: ItemsObject = {
  1: { selected: true, label: '1' },
  2: { selected: true, label: '2' },
  3: { selected: false, label: '3' },
  4: { selected: false, label: '4' },
  5: { selected: false, label: '5' },
};
const mockSetValueFn = jest.fn();
const closeFuntion = jest.fn();

const baseProps: { type: 'checkbox' | 'radio'; field: Field } = {
  type: 'checkbox',
  field: mockField,
};

describe('ChoiceModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display all choices', () => {
    const { getByTestId } = render(
      <ChoiceModal
        {...baseProps}
        resetValues={closeFuntion}
        choices={choices}
        setValue={jest.fn()}
      />
    );

    Object.keys(choices).forEach((key) => {
      expect(getByTestId(key)).toBeTruthy();
    });
  });

  it('should call setValue with correct arguments', () => {
    const keys = Object.keys(choices);
    const itemChosen = keys[Math.floor(Math.random() * keys.length)];
    const { getByTestId } = render(
      <ChoiceModal
        {...baseProps}
        resetValues={jest.fn()}
        choices={choices}
        setValue={mockSetValueFn}
      />
    );
    fireEvent.press(getByTestId(`press_${itemChosen}`));
    expect(mockSetValueFn).toBeCalledWith(itemChosen);
  });

  it('should call onClose prop if close button is pressed', () => {
    const { getByTestId } = render(
      <ChoiceModal
        {...baseProps}
        resetValues={closeFuntion}
        choices={choices}
        setValue={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('closeBtn'));
    expect(closeFuntion).toHaveBeenCalled();
  });

  it('should call onClose prop if backdrop is pressed', () => {
    const resetValues = jest.fn();
    const { getByTestId } = render(
      <ChoiceModal
        {...baseProps}
        resetValues={resetValues}
        choices={choices}
        setValue={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('choiceModalBackdrop'));

    expect(resetValues).toHaveBeenCalled();
  });

  it('should render correct icons for prop type', () => {
    //test type checkbox
    const { getByTestId, rerender } = render(
      <ChoiceModal
        {...baseProps}
        resetValues={closeFuntion}
        choices={choices}
        setValue={jest.fn()}
      />
    );

    Object.keys(choices).forEach((key) => {
      expect(getByTestId(`icon_${key}`)).toBeTruthy();
    });

    //check type radio
    rerender(
      <ChoiceModal
        {...baseProps}
        resetValues={closeFuntion}
        choices={choices}
        setValue={jest.fn()}
        type="radio"
      />
    );

    Object.keys(choices).forEach((key) => {
      expect(getByTestId(`icon_${key}`)).toBeTruthy();
    });
  });

  it('should display submit button only for type === checkbox', () => {
    const submitBtn = jest.fn();
    const { getByTestId, rerender, queryByTestId } = render(
      <ChoiceModal
        {...baseProps}
        resetValues={jest.fn()}
        choices={choices}
        setValue={jest.fn()}
        submitValue={submitBtn}
      />
    );

    fireEvent.press(getByTestId('submitBtnChoiceModal'));
    expect(submitBtn).toHaveBeenCalled();

    rerender(
      <ChoiceModal
        {...baseProps}
        resetValues={jest.fn()}
        choices={choices}
        setValue={jest.fn()}
        submitValue={submitBtn}
        type="radio"
      />
    );
    expect(queryByTestId('submitBtnChoiceModal')).toBeNull();
  });
});
