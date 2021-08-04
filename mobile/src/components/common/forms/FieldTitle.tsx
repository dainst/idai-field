import { I18N } from 'idai-field-core';
import React from 'react';
import { StyleSheet, TextProps, ViewStyle } from 'react-native';
import { colors } from '../../../utils/colors';
import I18NLabel from '../I18NLabel';

interface FieldTitleProps extends TextProps {
    label: I18N.LabeledValue
}

const FieldTitle: React.FC<FieldTitleProps> = (props) =>
    <I18NLabel style={ { ...styles.title, ...props.style as ViewStyle } } label={ props.label } /> ;


const styles = StyleSheet.create({
    title: {
        backgroundColor: colors.lightgray,
        textTransform: 'capitalize',
        borderBottomColor: 'gray',
        borderBottomWidth: 1,
        padding: 5
    }
});

export default FieldTitle;