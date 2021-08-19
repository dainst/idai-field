import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FieldBaseProps } from './common-props';
import FieldLabel from './FieldLabel';


const DatingField: React.FC<FieldBaseProps> = ({ field, setFunction, currentValue }) => {
    return (
        <View style={ styles.container }>
            <FieldLabel field={ field } />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%'
    },
});

export default DatingField;