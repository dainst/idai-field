import React from 'react';
import { StyleSheet, Text, TextProps, ViewStyle } from 'react-native';
import { colors } from '../../../utils/colors';

const FieldTitle: React.FC<TextProps> = (props) => {
    return <Text style={ { ...styles.title, ...props.style as ViewStyle } }>
        {props.children}
    </Text>;
};

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