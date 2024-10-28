import React, { ReactElement } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../../utils/colors';


interface InputProps extends TextInputProps {
    label?: string;
    helpText?: string;
    invalidText?: string;
    isValid?: boolean;
    hideBorder?: boolean;
}


const Input = (props: InputProps): ReactElement => {

    return <View style={ [props.style, styles.container] }>
        { props.label && <Text style={ styles.label }>{ props.label }</Text> }
        <TextInput { ...props } style={ getInputStyles(props.isValid, props.hideBorder) } />
        { props.isValid === false && props.invalidText && <Text style={ styles.invalidText }>
            { props.invalidText }
        </Text> }
        { props.helpText && <Text style={ styles.helpText }>{ props.helpText }</Text> }
    </View>;
};

export default Input;

const getInputStyles = (isValid?: boolean, hideBorder?: boolean) => [
    styles.input,
    isValid === false && styles.invalidInput,
    hideBorder && { borderBottomWidth: 0 }
];

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
        height: 30,
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
