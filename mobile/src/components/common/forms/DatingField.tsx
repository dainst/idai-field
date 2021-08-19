import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../utils/colors';
import Row from '../Row';
import { FieldBaseProps } from './common-props';
import FieldLabel from './FieldLabel';

const ICON_SIZE = 24;

const DatingField: React.FC<FieldBaseProps> = ({ field, setFunction, currentValue }) => {

    const [showAddRow, setShowAddRow] = useState<boolean>(true);

    return (
        <View style={ styles.container }>
            <FieldLabel field={ field } />
            { showAddRow ?
                <Row style={ styles.addDimension } testID="addRow">
                    <Text style={ { paddingRight: 2 } }>Add</Text>
                    <TouchableOpacity onPress={ () => setShowAddRow(false) } testID="addDating">
                        <MaterialCommunityIcons name="plus-circle" size={ ICON_SIZE } color={ colors.success } />
                    </TouchableOpacity>
                </Row> :
                <View testID="datingForm">
                    <Text testID="form">Form</Text>
                </View>
            }
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%'
    },
    addDimension: {
        marginTop: 3,
        padding: 3,
        borderColor: colors.lightgray,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
});

export default DatingField;