import { fireEvent, render } from '@testing-library/react-native';
import { Field } from 'idai-field-core';
import React from 'react';
import DatingField from './DatingField';

const fieldName = 'dating';
const mockField: Field = {
    name: fieldName,
    inputType: 'dating',
};

//Mock vector icons
jest.mock('@expo/vector-icons', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { View } = require('react-native');
    return {
        MaterialCommunityIcons: View,
    };
});

describe('DatingField',() => {
    
    it('should show form if add button is pressed',() => {
        const { getByTestId, queryByTestId } = render(<DatingField field={ mockField } setFunction={ jest.fn() } />);

        expect(queryByTestId('datingForm')).toBeNull();
        expect(queryByTestId('addRow')).not.toBeNull();

        fireEvent.press(getByTestId('addDating'));

        expect(queryByTestId('datingForm')).not.toBeNull();
        expect(queryByTestId('addRow')).toBeNull();
        
    });
});