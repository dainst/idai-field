import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { Field, Labels, Valuelist } from 'idai-field-core';
import React from 'react';
import LabelsContext from '../../../contexts/labels/labels-context';
import ChoiceModal from './ChoiceModal';
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
    }
};
const mockField: Field = {
    name: fieldName,
    inputType: 'radio',
    valuelist: valueList,
};
const currentValue = 'one';

// Mock core Labels class
jest.mock('idai-field-core', () => {
    // Works and lets you check for constructor calls:
    return {
        Labels: jest.fn().mockImplementation(() => {
            const valueList = {
                id: 'valuelist',
                values: {
                    1: { label: { de: 'eins', en: 'one' } },
                    2: { label: { de: 'zwei', en: 'two' } },
                    3: { label: { de: 'drei', en: 'three' } },
                    4: { label: { de: 'vier', en: 'four' } },
                    5: { label: { de: 'fünf', en: 'five' } },
                }
            };

            return {
                orderKeysByLabels: () => Object.keys(valueList.values).map(key => {
                    const label = valueList.values[key].label;
                    if(label && label['en']){
                        return label['en'];
                    } else return '';
                }),
                get: () => fieldName
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

describe('RadioField',() => {

    
    afterEach(() => {
        jest.clearAllMocks();
    });


    it('should have only show choices modal if field button is clicked', () => {
        const { getByTestId } = render(
            <LabelsContext.Provider value={ { labels: new Labels(() => ['en']) } }>
                <RadioField
                    field={ mockField }
                    setFunction={ jest.fn() }
                    currentValue=""
                />
            </LabelsContext.Provider>);

        expect(getByTestId('fieldBtn')).toBeTruthy();
        expect(ChoiceModal).not.toBeCalled();
        fireEvent.press(getByTestId('fieldBtn'));
        expect(ChoiceModal).toBeCalled();
    });
    
    
    it('should have only one field selected',() => {
        
        const expectedChoices = {
            one: { selected: true, label: 'one' },
            two: { selected: false, label: 'two' },
            three: { selected: false, label: 'three' },
            four: { selected: false, label: 'four' },
            five: { selected: false, label: 'five' },
        };
        const { getByTestId } = render(
                    <LabelsContext.Provider value={ { labels: new Labels(() => ['en']) } }>
                        <RadioField
                            field={ mockField }
                            setFunction={ jest.fn() }
                            currentValue={ currentValue }
                            />
                    </LabelsContext.Provider>
        );
        fireEvent.press(getByTestId('fieldBtn'));
        
        expect(ChoiceModal).toHaveBeenCalledWith(
            expect.objectContaining({ choices: expectedChoices }),
            expect.anything());


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
        };
        const setFunciton = jest.fn();
        const { getByTestId } = render(
            <LabelsContext.Provider value={ { labels: new Labels(() => ['en']) } }>
                <RadioField
                    field={ mockField }
                    setFunction={ setFunciton }
                    currentValue=""
                />
            </LabelsContext.Provider>);
        fireEvent.press(getByTestId('fieldBtn'));//open module

        
        fireEvent.press(getByTestId(`press_${newValue}`));

        expect(setFunciton).toBeCalledWith(fieldName,newValue);
        expect(ChoiceModal).toHaveBeenCalledTimes(2);
        expect((ChoiceModal as jest.Mock).mock.calls.slice(-1)[0][0]).toEqual(
            expect.objectContaining({ choices: expectedNewChoices }));
    });

    afterAll(() => {
        cleanup();
    });
});
