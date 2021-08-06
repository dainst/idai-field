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

describe('ChoiceModal.spec',() => {
    
    it('should display all choices',() => {

        const { getByTestId } = render(
                    <ChoiceModal
                        field={ mockField }
                        onClose={ closeFuntion }
                        choices={ choices }
                        setValue={ jest.fn() } />);
        
        Object.keys(choices).forEach(key => {
            expect(getByTestId(key)).toBeTruthy();
        });
    });
    

    it('should call setValue with correct arguments',() => {
        
        const keys = Object.keys(choices);
        const itemChosen = keys[Math.floor(Math.random() * keys.length)];
        const { getByTestId } = render(
            <ChoiceModal
                field={ mockField }
                onClose={ jest.fn() }
                choices={ choices }
                setValue={ mockSetValueFn } />);
        fireEvent.press(getByTestId(`press_${itemChosen}`));
        expect(mockSetValueFn).toBeCalledWith(itemChosen);
        
    });


    it('should call onClose prop if close button is pressed', () => {
        const { getByTestId } = render(
            <ChoiceModal
                field={ mockField }
                onClose={ closeFuntion }
                choices={ choices }
                setValue={ jest.fn() } />);

        fireEvent.press(getByTestId('closeBtn'));
        expect(mockSetValueFn).toBeCalledTimes(1);
    });
});