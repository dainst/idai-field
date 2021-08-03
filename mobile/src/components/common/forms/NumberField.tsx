import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../../../utils/colors';
import { FieldBaseProps } from './common-props';
import FieldTitle from './FieldTitle';


const NumberField: React.FC<FieldBaseProps> = ({ setFunction, field, currentValue }) => {

    const [value, setValue] = useState<string>('');

    useEffect(() => {
    
        setValue(currentValue && typeof currentValue === 'string' ? currentValue : currentValue?.toString() || '');
    },[currentValue]);


    return (
        <View style={ styles.container }>
            <FieldTitle>{field.name}</FieldTitle>
            <TextInput
                multiline={ false }
                value={ value }
                onChangeText={ setValue }
                onEndEditing={ () => setFunction(field.name, value) }
                style={ styles.textInputStyle }
                keyboardType={ field.inputType === 'float' ? 'numeric' : 'number-pad' }
                autoCompleteType="off"
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
    }
});

export default NumberField;