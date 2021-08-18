import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OptionalRange } from 'idai-field-core';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../utils/colors';
import Row from '../Row';
import { FieldBaseProps } from './common-props';
import FieldLabel from './FieldLabel';

const DropdownRangeField: React.FC<FieldBaseProps> = ({ field, setFunction, currentValue }) => {

    const [showEndElements, setShowEndElements] = useState<boolean>(false);
    const [value, setValue] = useState<string>('');
    const [endValue, setEndValue] = useState<string>('');

    useEffect(() => {
        if(!currentValue) return;
        const currentValueRange = currentValue as OptionalRange<string>;

        setValue(currentValueRange.value);
        if( currentValueRange.endValue ){
            setShowEndElements(true);
            setEndValue(currentValueRange.endValue);
        }
    },[currentValue]);

    return (
        <View style={ styles.container }>
            <FieldLabel field={ field } />
            <Row style={ styles.selectionRow }>
                <View style={ styles.selectionField }>
                    <Text testID="valueText">{value}</Text>
                </View>
                { showEndElements ?
                    <>
                        <Text style={ { paddingHorizontal: 5 } }>to</Text>
                        <View style={ styles.selectionField }>
                            <Text testID="endValueText">{endValue}</Text>
                        </View>
                    </> :
                    <TouchableOpacity onPress={ () => setShowEndElements(prev => !prev) } testID="arrowIconBtn">
                        <MaterialCommunityIcons name="arrow-expand-horizontal" size={ 20 } testID="arrowIcon" />
                    </TouchableOpacity>}
            </Row>
            
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%',
    },
    selectionRow: {
        alignItems: 'center',
    },
    selectionField: {
        marginTop: 3,
        borderColor: colors.lightgray,
        borderWidth: 1,
        width: '45%'
    }
});

export default DropdownRangeField;