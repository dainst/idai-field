import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import Row from './Row';

interface BooleanRadioProps<T> {
    labels: [T, T];
    selectedValue: T | null;
    clickHandler: (value: T | null) => void;
    undefinedPossible?: boolean;
    style?: ViewStyle
}

const ICON_SIZE = 24;
const UNDEFINED_STR = '--';

const BooleanRadio: <T extends string>(p: BooleanRadioProps<T>) =>
    React.ReactElement<BooleanRadioProps<T>> = (props) => {
    
    return (
        <Row style={ [props.style, styles.container] }>
            {props.labels.map(label => <Row style={ styles.valueContainer } key={ label }>
                <TouchableOpacity onPress={ () => props.clickHandler(label) }>
                    <Ionicons
                        name={ label === props.selectedValue ?
                            'md-radio-button-on-outline' :
                            'md-radio-button-off-outline' }
                        size={ ICON_SIZE } />
                </TouchableOpacity>
                <Text style={ { textTransform: 'capitalize' } }>{label}</Text>
            </Row>)}
            {props.undefinedPossible && (
                <>
                    <TouchableOpacity onPress={ () => props.clickHandler(null) } >
                        <Ionicons
                            name={ props.selectedValue === null ?
                                'md-radio-button-on-outline' :
                                'md-radio-button-off-outline' }
                            size={ ICON_SIZE } />
                    </TouchableOpacity>
                    <Text>{UNDEFINED_STR}</Text>
                </>)}
        </Row>);
 };


const styles = StyleSheet.create({
    container: {
        alignItems: 'center'
    },
    valueContainer: {
        alignItems: 'center',
        padding: 5
    }
});

export default BooleanRadio;