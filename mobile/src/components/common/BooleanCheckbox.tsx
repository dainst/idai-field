import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, ViewStyle } from 'react-native';
import Row from './Row';

interface BooleanCheckboxProps {
    title: string;
    value: boolean | undefined;
    setValue: (value: boolean) => void;
    style?: ViewStyle;
    testID?: string
}


const BooleanCheckbox: React.FC<BooleanCheckboxProps> = ({ title, value, setValue, style, testID }) => {
    return (
        <Row style={ style } testID={ testID }>
            <TouchableOpacity onPress={ () => setValue(!value) } testID={ testID ? `${testID}Btn` : undefined }>
                <Ionicons name={ value ? 'checkbox-outline' : 'stop-outline' } size={ 24 } color="black" />
            </TouchableOpacity>
            <Text>{title}</Text>
        </Row>
    );
};


export default BooleanCheckbox;