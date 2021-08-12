import React from 'react';
import { Text, View } from 'react-native';
import BooleanField from './BooleanField';
import CheckboxField from './CheckboxField';
import { FieldBaseProps } from './common-props';
import DimensionField from './DimensionField';
import InputField from './InputField';
import NumberField from './NumberField';
import RadioField from './RadioField';
import TextField from './TextField';


const EditFormField: React.FC<FieldBaseProps> = (props) => {

    return (
    <View >
        {renderInputField(props)}
    </View>);
};


const renderInputField = (fieldBaseProps: FieldBaseProps) => {
    

    const { field } = fieldBaseProps;

    switch (field.inputType) {
        case 'input':
            return <InputField { ...fieldBaseProps } />;
        case 'float':
        case 'unsignedFloat':
        case 'unsignedInt':
            return <NumberField { ...fieldBaseProps } />;
        case 'text':
            return <TextField { ...fieldBaseProps } />;
        case 'checkboxes':
            return <CheckboxField { ...fieldBaseProps } />;
        case 'radio':
        case 'dropdown':
            return <RadioField { ...fieldBaseProps } />;
        case 'boolean':
            return <BooleanField { ...fieldBaseProps } />;
        case 'dimension':
            return <DimensionField { ...fieldBaseProps } />;
        default:
            return <Text>{field.name} - {field.inputType}</Text>;
    }
};


export default EditFormField;