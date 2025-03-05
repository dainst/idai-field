import React from 'react';
import { View, ViewProps } from 'react-native';
import ButtonsRow from './ButtonsRow';
import { FormBaseProps } from './constants';
import SourceField from './SourceField';

interface BaseFormProps extends FormBaseProps, ViewProps {}

const BaseForm: React.FC<BaseFormProps> = (props) => {
    return (
        <View testID={ props.testID }>
            {props.children}
            <SourceField source={ props.source } setSource={ props.setSource } />
            <ButtonsRow onCancel={ props.onCancel } onSubmit={ props.onSubmit } />
        </View>
    );
};

export default BaseForm;