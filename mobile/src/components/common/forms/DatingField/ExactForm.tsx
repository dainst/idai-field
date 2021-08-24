import { DatingElement } from 'idai-field-core';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import BooleanCheckbox from '../../BooleanCheckbox';
import { IS_UNCERTAIN_ID } from './constants';
import DatingElementField from './DatingElementField';
import SourceField from './SourceField';

interface ExactFormProps {
    begin: DatingElement | undefined;
    setBegin: (dating: DatingElement) => void;
    isUncertain: boolean;
    setIsUncertian: (uncertain: boolean) => void;
    source: string;
    setSource: (text: string) => void;
}

const ExactForm: React.FC<ExactFormProps> = (props) => {
    return (
        <View testID="exactForm">
            <DatingElementField
                dating={ props.begin }
                setDating={ props.setBegin }
                type="begin" />
            <BooleanCheckbox
                value={ props.isUncertain }
                setValue={ props.setIsUncertian }
                title="Uncertain"
                style={ styles.checkbox }
                testID={ IS_UNCERTAIN_ID } />
            <SourceField source={ props.source } setSource={ props.setSource } />
        </View>
    );
};

const styles = StyleSheet.create({
    checkbox: {
        margin: 5,
    }
});

export default ExactForm;