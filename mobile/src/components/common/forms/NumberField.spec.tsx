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


describe('NumberField',() => {

    it('should display currentValue prop in TextInput',() => {

        const { getByTestId } = render(<NumberField
                                field={ mockField }
                                setFunction={ mockSetValueFn }
                                currentValue={ currentValue } />);
        
                                
        expect(getByTestId('input').props.value).toEqual(currentValue);
    });

    it('should show the correct keyboard regarding field.inputType', () => {

        const { getByTestId, rerender } = render(<NumberField
            field={ mockField }
            setFunction={ mockSetValueFn }
            currentValue={ currentValue } />);

            
        expect(getByTestId('input').props.keyboardType).toEqual('number-pad');

        rerender(<NumberField
            field={ { name: fieldName, inputType : 'float' } }
            setFunction={ mockSetValueFn }
            currentValue="60.4" />);

        expect(getByTestId('input').props.keyboardType).toEqual('numeric');
    });


    it('should display the entered input text',() => {

        const { getByTestId } = render(<NumberField
            field={ mockField }
            setFunction={ mockSetValueFn }
            currentValue={ currentValue } />);
        const changedText = 'Find2';

        fireEvent.changeText(getByTestId('input'),changedText);
        expect(getByTestId('input').props.value).toEqual(changedText);

    });

    
    it('should call setFunction on onChangeText with correct parameters', () => {

        const { getByTestId } = render(<NumberField
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