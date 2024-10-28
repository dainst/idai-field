import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChoiceModalProps } from '../ChoiceModal';


const ChoiceModal: React.FC<ChoiceModalProps> = jest.fn((props) => {
    
    return <View>
        {Object.keys(props.choices).map(key => (
            <TouchableOpacity
                onPress={ () => props.setValue(props.choices[key].label) }
                testID={ `press_${props.choices[key].label}` }
                key={ props.choices[key].label }>
                    <Text>{props.choices[key].label}</Text>
            </TouchableOpacity>
        ))}
    </View>;
});

export default ChoiceModal;