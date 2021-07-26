import { Field } from 'idai-field-core';
import React from 'react';
import { Text, View } from 'react-native';
import { FieldsBaseProps, FormBaseProps } from './common-props';
import InputField from './InputField';

interface EditFormFieldProps extends FormBaseProps {
    field: Field;
}

const EditFormField: React.FC<EditFormFieldProps> = ({ field, ...baseProps }) => {

    return (
    <View >
        {renderInputField(baseProps, field)}
    </View>);
};

const renderInputField = (formBaseProps: FormBaseProps, field: Field) => {
    
    const fieldProps: FieldsBaseProps = {
        ...formBaseProps,
        name: field.name
    };

    switch (field.inputType) {
        case 'input':
            return <InputField { ...fieldProps } />;
        default:
            return <Text>{field.name}</Text>;
    }
};


export default EditFormField;