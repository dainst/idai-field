import React from 'react';
import { Text, View } from 'react-native';
import { FieldBaseProps } from './common-props';
import InputField from './InputField';
import NumberField from './NumberField';
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
        default:
            return <Text>{field.name}</Text>;
    }
};


export default EditFormField;