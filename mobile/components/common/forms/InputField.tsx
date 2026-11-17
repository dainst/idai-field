import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors } from '@/utils/colors';
import ScanBarcodeButton from '@/components/Project/ScanBarcodeButton';
import Row from '../Row';
import { FieldBaseProps } from './common-props';
import { FORM_FONT_SIZE } from './constants';
import FieldLabel from './FieldLabel';

const InputField: React.FC<FieldBaseProps> = ({ setFunction, field, currentValue }) => {

    const [value, setValue] = useState<string>('');

    useEffect(() => {
        setValue(currentValue && typeof currentValue === 'string' ? currentValue : '');
    },[currentValue]);

    const changeTextHandler = (text: string) => {
        setValue(text);
        setFunction(field.name, text.trimEnd());
    };

    return (
        <View style={ styles.container }>
            <FieldLabel field={ field } />
            <Row style={ styles.textInputContainer }>
                <TextInput
                    multiline={ false }
                    value={ value }
                    onChangeText={ changeTextHandler }
                    style={ styles.textInput }
                    autoComplete="off"
                    testID={ `inputField_${field.name}` } />
                {field.name === 'identifier' && <View style={ { marginLeft: 'auto' } }>
                    <ScanBarcodeButton onQrCodeScanned={ changeTextHandler } />
                </View>}
            </Row>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%'
    },
    textInputContainer: {
        marginTop: 3,
        borderColor: colors.lightgray,
        borderWidth: 1,
    },
    textInput: {
        flex: 1,
        fontSize: FORM_FONT_SIZE,
        padding: 5
    },
});

export default InputField;