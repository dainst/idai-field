import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../../../utils/colors';
import { FieldBaseProps } from './common-props';
import { FORM_FONT_SIZE } from './constants';
import FieldLabel from './FieldLabel';


const NumberField: React.FC<FieldBaseProps> = ({ setFunction, field, currentValue }) => {

    const [value, setValue] = useState<string>('');

    useEffect(() => {
    
        setValue(currentValue && typeof currentValue === 'string' ? currentValue : currentValue?.toString() || '');
    },[currentValue]);


    const changeTextHandler = (text: string) => {

        if((field.inputType === 'unsignedInt' && text.indexOf('.') === -1 && parseInt(text) >= 0) ||
            (field.inputType === 'float' && parseFloat(text)) ||
            (field.inputType === 'unsignedFloat' && parseFloat(text) && parseFloat(text) >= 0)){
                setValue(text);
                setFunction(field.name, text.trimEnd());
        } else {
                setValue(text.substring(0, text.length - 1 ));
                setFunction(field.name, '');
        }
    };

    return (
        <View style={ styles.container }>
            <FieldLabel field={ field } />
            <TextInput
                multiline={ false }
                value={ value }
                onChangeText={ changeTextHandler }
                style={ styles.textInputStyle }
                keyboardType={ field.inputType === 'float' ? 'numeric' : 'number-pad' }
                autoCompleteType="off"
                testID="input"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%'
    },
    textInputStyle: {
        marginTop: 3,
        borderColor: colors.lightgray,
        borderWidth: 1,
        padding: 5,
        fontSize: FORM_FONT_SIZE
    }
});

export default NumberField;