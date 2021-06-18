import { FieldDefinition } from 'idai-field-core';
import React from 'react';
import { Text, View } from 'react-native';
import { FieldsBaseProps, FormBaseProps } from './common-props';
import InputField from './InputField';

interface EditFormFieldProps extends FormBaseProps {
    fieldDefinition: FieldDefinition;
}

const EditFormField: React.FC<EditFormFieldProps> = ({ fieldDefinition, ...baseProps }) => {

    return (
    <View key={ fieldDefinition.name } >
        {renderInputField(baseProps, fieldDefinition)}
    </View>);
};

const renderInputField = (formBaseProps: FormBaseProps, fieldDefinition: FieldDefinition) => {
    
    const fieldProps: FieldsBaseProps = {
        ...formBaseProps,
        name: fieldDefinition.name
    };

    switch (fieldDefinition.inputType) {
        case 'input':
            return <InputField { ...fieldProps } />;
        default:
            return <Text>{fieldDefinition.name}</Text>;
    }
};


export default EditFormField;