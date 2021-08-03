import React from 'react';
import { Text, View } from 'react-native';
import { FieldBaseProps } from './common-props';
import InputField from './InputField';


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
        default:
            return <Text>{field.name}</Text>;
    }
};


export default EditFormField;