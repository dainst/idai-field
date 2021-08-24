import { DatingElement } from 'idai-field-core';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import BooleanCheckbox from '../../BooleanCheckbox';
import Row from '../../Row';
import { IS_IMPRECISE_ID, IS_UNCERTAIN_ID } from './constants';
import DatingElementField from './DatingElementField';
import SourceField from './SourceField';

interface AfterFormProps {
    begin: DatingElement | undefined
    setBegin: (dating: DatingElement) => void;
    isImprecise: boolean;
    setIsImprecise: (imprecise: boolean) => void;
    isUncertian: boolean;
    setIsUncertian: (uncertain: boolean) => void;
    source: string;
    setSource: (text: string) => void;
}

const AfterForm: React.FC<AfterFormProps> = (props) => {
    return (
        <View testID="afterForm">
            <DatingElementField
                dating={ props.begin }
                setDating={ props.setBegin }
                type="begin" />
            <Row>
                <BooleanCheckbox
                    value={ props.isImprecise } setValue={ props.setIsImprecise }
                    title="Imprecise" style={ styles.checkbox }
                    testID={ IS_IMPRECISE_ID } />
                <BooleanCheckbox
                    value={ props.isUncertian } setValue={ props.setIsUncertian }
                    title="Uncertain" style={ styles.checkbox }
                    testID={ IS_UNCERTAIN_ID } />
            </Row>
            <SourceField source={ props.source } setSource={ props.setSource } />
        </View>
    );
};

const styles = StyleSheet.create({
    checkbox: {
        margin: 5,
    }
});

export default AfterForm;