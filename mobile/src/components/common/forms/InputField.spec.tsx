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

describe('InputField',() => {


    it('should display currentValue prop in TextInput',() => {

        const { getByTestId } = render(<InputField
                                field={ mockField }
                                setFunction={ mockSetValueFn }
                                currentValue={ currentValue } />);
        
                                
        expect(getByTestId('input').props.value).toEqual(currentValue);
    });


    it('should display the entered input text',() => {

        const { getByTestId } = render(<InputField
            field={ mockField }
            setFunction={ mockSetValueFn }
            currentValue={ currentValue } />);
        const changedText = 'Find2';

        fireEvent.changeText(getByTestId('input'),changedText);
        expect(getByTestId('input').props.value).toEqual(changedText);

    });

    
    it('should call setFunction on onChangeText with correct parameters', () => {

        const { getByTestId } = render(<InputField
            field={ mockField }
            setFunction={ mockSetValueFn }
            currentValue={ currentValue } />);
        const changedText = 'Find2';

        fireEvent.changeText(getByTestId('input'), changedText);
        expect(mockSetValueFn).toHaveBeenCalledWith(fieldName,changedText);
    });

    afterAll(() => {
        cleanup();
    });
});