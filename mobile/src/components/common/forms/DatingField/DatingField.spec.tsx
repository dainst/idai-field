import { fireEvent, render } from '@testing-library/react-native';
import { Field } from 'idai-field-core';
import React from 'react';
import { IS_IMPRECISE_ID, IS_UNCERTAIN_ID, SOURCE_TEST_ID } from './constants';
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
        Ionicons: View,
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

    it('should display form with: begin, end, isImprecise, isUncertrain, source fields for type PERIOD', () => {
        const { getByTestId, queryByTestId } = render(<DatingField field={ mockField } setFunction={ jest.fn() } />);
        
        fireEvent.press(getByTestId('addDating')); //press add button
        fireEvent(getByTestId('typePicker'),'onValueChange','range');
 
        expect(queryByTestId('begin_DatingElement')).not.toBeNull();
        expect(queryByTestId('end_DatingElement')).not.toBeNull();
        expect(queryByTestId(IS_IMPRECISE_ID)).not.toBeNull();
        expect(queryByTestId(IS_UNCERTAIN_ID)).not.toBeNull();
        expect(queryByTestId(SOURCE_TEST_ID)).not.toBeNull();
    });

    it('should display form with begin, isUncertrain, source fields for type EXACT', () => {

        const { getByTestId, queryByTestId } = render(<DatingField field={ mockField } setFunction={ jest.fn() } />);

        fireEvent.press(getByTestId('addDating')); //press add button
        fireEvent(getByTestId('typePicker'),'onValueChange','exact');

        expect(queryByTestId('begin_DatingElement')).not.toBeNull();
        expect(queryByTestId(IS_UNCERTAIN_ID)).not.toBeNull();
        expect(queryByTestId(SOURCE_TEST_ID)).not.toBeNull();
    });

    it('should display form with begin, isImprecise, isUncertrain, source fields for type BEFORE',() => {

        const { getByTestId, queryByTestId } = render(<DatingField field={ mockField } setFunction={ jest.fn() } />);

        fireEvent.press(getByTestId('addDating')); //press add button
        fireEvent(getByTestId('typePicker'),'onValueChange','before');

        expect(queryByTestId('beforeForm')).not.toBeNull();
        expect(queryByTestId('begin_DatingElement')).not.toBeNull();
        expect(queryByTestId(IS_IMPRECISE_ID)).not.toBeNull();
        expect(queryByTestId(IS_UNCERTAIN_ID)).not.toBeNull();
        expect(queryByTestId(SOURCE_TEST_ID)).not.toBeNull();

    });

    it('should display form with begin, isImprecise, isUncertrain, source fields for type AFTER',() => {

        const { getByTestId, queryByTestId } = render(<DatingField field={ mockField } setFunction={ jest.fn() } />);
        
        fireEvent.press(getByTestId('addDating')); //press add button
        fireEvent(getByTestId('typePicker'),'onValueChange','after');

        expect(queryByTestId('afterForm')).not.toBeNull();
        expect(queryByTestId('begin_DatingElement')).not.toBeNull();
        expect(queryByTestId(IS_IMPRECISE_ID)).not.toBeNull();
        expect(queryByTestId(IS_UNCERTAIN_ID)).not.toBeNull();
        expect(queryByTestId(SOURCE_TEST_ID)).not.toBeNull();

    });
    
    it('should display from with begin, margin, source field for type SCIENTIFIC',() => {

        const { getByTestId, queryByTestId } = render(<DatingField field={ mockField } setFunction={ jest.fn() } />);

        fireEvent.press(getByTestId('addDating')); //press add button
        fireEvent(getByTestId('typePicker'),'onValueChange','scientific');

        expect(queryByTestId('scientificForm')).not.toBeNull();
        expect(queryByTestId('begin_DatingElement')).not.toBeNull();
        expect(queryByTestId('marginField')).not.toBeNull();
        expect(queryByTestId(SOURCE_TEST_ID)).not.toBeNull();
    });

});