import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DatingElement } from 'idai-field-core';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../../../../utils/colors';
import Row from '../../Row';
import DatingElementField from './DatingElementField';
import SourceField from './SourceField';

interface ScientificFormProps {
    begin: DatingElement | undefined
    setBegin: (dating: DatingElement) => void;
    margin: number | undefined;
    setMargin: (margin: number) => void;
    source: string;
    setSource: (text: string) => void;
}

const ScientificForm: React.FC<ScientificFormProps> = (props) => {
    return (
        <View testID="scientificForm">
            <Row>
                <DatingElementField dating={ props.begin } setDating={ props.setBegin } type="begin" />
                <MaterialCommunityIcons name="plus-minus" size={ 20 } color="black" />
                <TextInput
                    value={ props.margin ? props.margin.toString() : '' }
                    placeholder="0"
                    onChangeText={ (text) => props.setMargin(parseInt(text)) }
                    keyboardType="numeric"
                    style={ styles.marginField }
                    testID="marginField" />
            </Row>
            <SourceField source={ props.source } setSource={ props.setSource } />
        </View>
    );
};

const styles = StyleSheet.create({
    marginField: {
        borderWidth: 1,
        borderColor: colors.lightgray,
        margin: 5,
        padding: 5,
        width: '25%'
    }
});

export default ScientificForm;