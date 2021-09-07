import { fireEvent, render } from '@testing-library/react-native';
import { Field, Labels, OptionalRange, Valuelist } from 'idai-field-core';
import React from 'react';
import LabelsContext from '../../../contexts/labels/labels-context';
import ChoiceModal from './ChoiceModal/ChoiceModal';
import { NO_VAL } from './constants';
import DropdownRangeField from './DropdownRangeField';

const fieldName = 'period';
const valuelist: Valuelist = {
    id: 'valuelist',
    values: {
        eins: { label: { de: 'eins', en: 'one' } },
        zwei: { label: { de: 'zwei', en: 'two' } },
        drei: { label: { de: 'drei', en: 'three' } },
        vier: { label: { de: 'vier', en: 'four' } },
        fünf: { label: { de: 'fünf', en: 'five' } },
    }
};
const value = 'one';
const endValue = 'two';
const mockField: Field = {
    name: fieldName,
    inputType: 'dropdownRange',
    valuelist: valuelist
};

// Mock core Labels class
jest.mock('idai-field-core', () => {
    // Works and lets you check for constructor calls:
    return {
        Labels: jest.fn().mockImplementation(() => {
            const valueList = {
                id: 'valuelist',
                values: {
                    eins: { label: { de: 'eins', en: 'one' } },
                    zwei: { label: { de: 'zwei', en: 'two' } },
                    drei: { label: { de: 'drei', en: 'three' } },
                    vier: { label: { de: 'vier', en: 'four' } },
                    fünf: { label: { de: 'fünf', en: 'five' } },
                }
            };
            const fieldName = 'period';

            return {
                orderKeysByLabels: () => Object.keys(valueList.values).map(key => {
                    const label = valueList.values[key].label;
                    if(label && label['en']){
                        return label['en'];
                    } else return '';
                }),
                get: () => fieldName,
                getLabelAndDescription: () => ({ description: 'description' })
            };
        }),
    };
});


// Mock Choice Modal component
jest.mock('./ChoiceModal', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Text, TouchableOpacity } = require('react-native');
    return jest.fn((props) => Object.keys(props.choices).map(key => (
        <TouchableOpacity
            onPress={ () => props.setValue(props.choices[key].label) }
            testID={ `press_${props.choices[key].label}` }
            key={ props.choices[key].label }>
                <Text>{props.choices[key].label}</Text>
        </TouchableOpacity>
    )));
    
});


describe('DropdownRangeField',() => {

    afterEach(() => {
        jest.clearAllMocks();
    });
   
    it('should display second input field if arrow-expand-horizontal icon is pressed', () => {
        
        const { getByTestId, queryByTestId } = render(
                                                <LabelsContext.Provider value={ { labels: new Labels(() => ['en']) } }>
                                                    <DropdownRangeField
                                                        field={ mockField }
                                                        setFunction={ jest.fn() } />
                                                </LabelsContext.Provider>);

        expect(queryByTestId('endValueText')).toBeNull();
        expect(queryByTestId('arrowIcon')).not.toBeNull();
        expect(queryByTestId('valueText')).not.toBeNull();

        fireEvent.press(getByTestId('arrowIconBtn'));

        expect(queryByTestId('endValueText')).not.toBeNull();
        expect(queryByTestId('arrowIcon')).toBeNull();
        expect(queryByTestId('valueText')).not.toBeNull();
    });

    // eslint-disable-next-line max-len
    it('should only display one field if currentValue is undefined or has only VALUE key and should display both field if ENDVALUE key exists',() => {

        const { getByTestId, queryByTestId, rerender } = render(
            <LabelsContext.Provider value={ { labels: new Labels(() => ['en']) } }>
                <DropdownRangeField
                    field={ mockField }
                    setFunction={ jest.fn() } />
            </LabelsContext.Provider>);
        
        expect(queryByTestId('endValueText')).toBeNull();
        expect(queryByTestId('arrowIcon')).not.toBeNull();
        expect(queryByTestId('valueText')).not.toBeNull();
        
        // test currentValue with only VALUE key
        const range: OptionalRange<string> = { value };
        rerender(<LabelsContext.Provider value={ { labels: new Labels(() => ['en']) } }>
                    <DropdownRangeField field={ mockField } setFunction={ jest.fn() } currentValue={ range } />
                </LabelsContext.Provider>);

        expect(queryByTestId('endValueText')).toBeNull();
        expect(queryByTestId('arrowIcon')).not.toBeNull();
        expect(queryByTestId('valueText')).not.toBeNull();
        expect(getByTestId('valueText').props.children).toEqual(value);

        // test currentValue with only ENDVALUE key
        const range2: OptionalRange<string> = { value , endValue };
        rerender(<LabelsContext.Provider value={ { labels: new Labels(() => ['en']) } }>
                    <DropdownRangeField field={ mockField } setFunction={ jest.fn() } currentValue={ range2 } />
                </LabelsContext.Provider>);

        expect(queryByTestId('endValueText')).not.toBeNull();
        expect(getByTestId('endValueText').props.children).toEqual(endValue);
        expect(queryByTestId('arrowIcon')).toBeNull();
        expect(queryByTestId('valueText')).not.toBeNull();
        expect(getByTestId('valueText').props.children).toEqual(value);

    });

    it('should provide all labels to regarding ChoiceModal',() => {

        const expectedValueChoices = {
            [value]: { selected: true, label: 'one' },
            two: { selected: false, label: 'two' },
            three: { selected: false, label: 'three' },
            four: { selected: false, label: 'four' },
            five: { selected: false, label: 'five' },
            [NO_VAL]: { selected: false, label: NO_VAL },
        };
        const expectedEndValueChoices = {
            [endValue]: { selected: true, label: 'two' },
            one: { selected: false, label: 'one' },
            three: { selected: false, label: 'three' },
            four: { selected: false, label: 'four' },
            five: { selected: false, label: 'five' },
            [NO_VAL]: { selected: false, label: NO_VAL },
        };
        const range: OptionalRange<string> = { value , endValue };
        const { getByTestId } = render(
            <LabelsContext.Provider value={ { labels: new Labels(() => ['en']) } }>
                <DropdownRangeField
                    field={ mockField }
                    setFunction={ jest.fn() }
                    currentValue={ range } />
            </LabelsContext.Provider>);

        fireEvent.press(getByTestId('valueTextBtn'));
        expect((ChoiceModal as jest.Mock).mock.calls.slice(-1)[0][0]).toEqual(
            expect.objectContaining({ choices: expectedValueChoices }));

        fireEvent.press(getByTestId('endValueTextBtn'));
        expect((ChoiceModal as jest.Mock).mock.calls.slice(-1)[0][0]).toEqual(
            expect.objectContaining({ choices: expectedEndValueChoices }));
    });

    it('should call setFunction with correct props if new value is selcted in ChoiceModal', () => {
        
        const setFunctionMock = jest.fn();
        const range: OptionalRange<string> = { value };
        const newValue = 'four';
        const newEndValue = 'two';
        const { getByTestId } = render(
            <LabelsContext.Provider value={ { labels: new Labels(() => ['en']) } }>
                <DropdownRangeField
                    field={ mockField }
                    setFunction={ setFunctionMock }
                    currentValue={ range } />
            </LabelsContext.Provider>);
        
        // select value
        const expectedRange: OptionalRange<string> = { value: newValue };
        fireEvent.press(getByTestId('valueTextBtn')); //open Modal
        fireEvent.press(getByTestId(`press_${newValue}`));
        
        expect(ChoiceModal).toHaveBeenCalledTimes(1);
        expect(setFunctionMock).toBeCalledWith(fieldName,expectedRange);


        // select endValue
        const newExpectedRange: OptionalRange<string> = { value: newValue, endValue: newEndValue };
        fireEvent.press(getByTestId('arrowIconBtn'));
        fireEvent.press(getByTestId('endValueTextBtn')); //open Modal
        fireEvent.press(getByTestId(`press_${newEndValue}`));
        expect(ChoiceModal).toHaveBeenCalledTimes(2);
        expect(setFunctionMock).toBeCalledWith(fieldName,newExpectedRange);
    });
});