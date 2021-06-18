import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../../../utils/colors';
import { FieldsBaseProps } from './common-props';
import FieldTitle from './FieldTitle';


const InputField: React.FC<FieldsBaseProps> = ({ setFunction, name, resource }) => {

    const [value, setValue] = useState<string>(resource[name]);

    return (
        <View style={ styles.container }>
            <FieldTitle>{name}</FieldTitle>
            <TextInput
                multiline={ false }
                value={ value }
                onChangeText={ (text) => setValue(text) }
                onEndEditing={ () => setFunction(name, value) }
                style={ styles.textInputStyle }
                autoCompleteType="off" />
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

export default InputField;