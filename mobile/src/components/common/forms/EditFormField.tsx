import { FieldDefinition } from 'idai-field-core';
import React from 'react';
import { Text, View } from 'react-native';
import { FieldsBaseProps } from './common-props';
import InputField from './InputField';

interface EditFormFieldProps extends FieldsBaseProps {
    fieldDefinition: FieldDefinition;
}

const EditFormField: React.FC<EditFormFieldProps> = ({ fieldDefinition, ...baseProps }) => {

    return (
    <View key={ fieldDefinition.name } >
        {renderInputField(baseProps, fieldDefinition)}
    </View>);
};

const renderInputField = (baseProps: FieldsBaseProps, fieldDefinition: FieldDefinition) => {
    
    switch (fieldDefinition.inputType) {
        case 'input':
            return <InputField { ...baseProps } name={ fieldDefinition.name } />;
    
        default:
            return <Text>{fieldDefinition.name}</Text>;
    }
};


export default EditFormField;