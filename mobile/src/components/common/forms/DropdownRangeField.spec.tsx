import { fireEvent, render } from '@testing-library/react-native';
import { Field, OptionalRange } from 'idai-field-core';
import React from 'react';
import DropdownRangeField from './DropdownRangeField';

const fieldName = 'period';
const mockField: Field = {
    name: fieldName,
    inputType: 'dropdownRange',
};

jest.mock('@expo/vector-icons', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { View } = require('react-native');
    return {
        MaterialCommunityIcons: View,
    };
});


describe('DropdownRangeField',() => {
   
    it('should display second input field if arrow-expand-horizontal icon is pressed', () => {
        
        const { getByTestId, queryByTestId } = render(
                                                <DropdownRangeField
                                                    field={ mockField }
                                                    setFunction={ jest.fn() } />);

        expect(queryByTestId('endValueText')).toBeNull();
        expect(queryByTestId('arrowIcon')).not.toBeNull();
        expect(queryByTestId('valueText')).not.toBeNull();

        fireEvent.press(getByTestId('arrowIconBtn'));

        expect(queryByTestId('endValueText')).not.toBeNull();
        expect(queryByTestId('arrowIcon')).toBeNull();
        expect(queryByTestId('valueText')).not.toBeNull();
    });

    it('should only display one field if currentValue is undefined or has only VALUE key',() => {

        const { getByTestId, queryByTestId, rerender, queryByText } = render(
                                                    <DropdownRangeField
                                                        field={ mockField }
                                                        setFunction={ jest.fn() } />);
        
        expect(queryByTestId('endValueText')).toBeNull();
        expect(queryByTestId('arrowIcon')).not.toBeNull();
        expect(queryByTestId('valueText')).not.toBeNull();
        
        // test currentValue with only VALUE key
        const value = 'from';
        const relation: OptionalRange<string> = { value };
        rerender( <DropdownRangeField field={ mockField } setFunction={ jest.fn() } currentValue={ relation } />);

        expect(queryByTestId('endValueText')).toBeNull();
        expect(queryByTestId('arrowIcon')).not.toBeNull();
        expect(queryByTestId('valueText')).not.toBeNull();
        expect(getByTestId('valueText').props.children).toEqual(value);

        // test currentValue with only ENDVALUE key
        const endValue = 'to';
        const relation2: OptionalRange<string> = { value , endValue };
        rerender( <DropdownRangeField field={ mockField } setFunction={ jest.fn() } currentValue={ relation2 } />);

        expect(queryByTestId('endValueText')).not.toBeNull();
        expect(getByTestId('endValueText').props.children).toEqual(endValue);
        expect(queryByTestId('arrowIcon')).toBeNull();
        expect(queryByTestId('valueText')).not.toBeNull();
        expect(getByTestId('valueText').props.children).toEqual(value);

    });

});