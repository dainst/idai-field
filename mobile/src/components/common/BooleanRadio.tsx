import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import Row from './Row';

interface BooleanRadioProps<T> {
    labels: [T, T];
    selectedValue: T;
    clickHandler: (value: T) => void
    style?: ViewStyle
}

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
                        size={ 24 } />
                </TouchableOpacity>
                <Text style={ { textTransform: 'capitalize' } }>{label}</Text>
            </Row>)}
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