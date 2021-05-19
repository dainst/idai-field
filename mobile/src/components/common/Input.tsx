import React, { ReactElement } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../../utils/colors';


interface InputProps extends TextInputProps {
    label?: string;
    helpText?: string;
    invalidText?: string;
    isValid?: boolean;
}


const Input = (props: InputProps): ReactElement => {

    return <View style={ [props.style, styles.container] }>
        { props.label && <Text style={ styles.label }>{ props.label }</Text> }
        <TextInput { ...props } style={ [styles.input, props.isValid === false && styles.invalidInput] } />
        { props.isValid === false && props.invalidText && <Text style={ styles.invalidText }>
            { props.invalidText }
        </Text> }
        { props.helpText && <Text style={ styles.helpText }>{ props.helpText }</Text> }
    </View>;
};

export default Input;

const styles = StyleSheet.create({
    container: {
    },
    label: {
        fontSize: 16,
        margin: 5,
        fontWeight: '500'
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: 'black',
        paddingVertical: 5,
        margin: 5,
        fontSize: 16,
    },
    invalidInput: {
        borderBottomColor: colors.danger,
    },
    helpText: {
        color: 'gray',
        margin: 5,
    },
    invalidText: {
        color: colors.danger,
        margin: 5,
    },
});
