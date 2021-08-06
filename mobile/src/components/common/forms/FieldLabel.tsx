import { Ionicons } from '@expo/vector-icons';
import { I18N } from 'idai-field-core';
import React from 'react';
import { StyleSheet, TextProps, TouchableOpacity } from 'react-native';
import { colors } from '../../../utils/colors';
import I18NLabel from '../I18NLabel';
import Row from '../Row';

interface FieldLabelProps extends TextProps {
    field: I18N.LabeledValue
    openModal?: () => void;
}

const FieldLabel: React.FC<FieldLabelProps> = (props) => (
    <Row style={ styles.row }>
        {props.openModal &&
            <TouchableOpacity onPress={ props.openModal }>
                <Ionicons name="chevron-down-circle-outline" color="black" size={ 18 } />
            </TouchableOpacity>}
        <I18NLabel style={ props.style } label={ props.field } />
    </Row>);


const styles = StyleSheet.create({
    row: {
        backgroundColor: colors.lightgray,
        textTransform: 'capitalize',
        borderBottomColor: 'gray',
        borderBottomWidth: 1,
        padding: 1,
        alignItems: 'center'
    }
});

export default FieldLabel;