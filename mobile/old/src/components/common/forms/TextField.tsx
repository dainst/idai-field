import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../../../utils/colors';
import { FieldBaseProps } from './common-props';
import FieldLabel from './FieldLabel';

const numberOfLines = 4;

const TextField: React.FC<FieldBaseProps> = ({ setFunction, field, currentValue }) => {

    const [value, setValue] = useState<string>('');

    useEffect(() => {
    
        setValue(currentValue && typeof currentValue === 'string' ? currentValue : '');
    },[currentValue]);

    return (
        <View style={ styles.container }>
            <FieldLabel field={ field } />
            <TextInput
                multiline={ true }
                numberOfLines={ numberOfLines }
                value={ value }
                onChangeText={ (text) => setValue(text) }
                onEndEditing={ () => setFunction(field.name, value) }
                style={ styles.textInputStyle }
                textAlign="left"
                textAlignVertical="top"
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
        padding: 5
    }
});

export default TextField;