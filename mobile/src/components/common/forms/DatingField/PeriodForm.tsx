import { DatingElement } from 'idai-field-core';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BooleanCheckbox from '../../BooleanCheckbox';
import Row from '../../Row';
import { IS_IMPRECISE_ID, IS_UNCERTAIN_ID } from './constants';
import DatingElementField from './DatingElementField';
import SourceField from './SourceField';

interface PeriodFormProps {
    begin: DatingElement | undefined
    setBegin: (dating: DatingElement) => void;
    end: DatingElement | undefined;
    setEnd: (dating: DatingElement) => void;
    isImprecise: boolean;
    setIsImprecise: (imprecise: boolean) => void;
    isUncertian: boolean;
    setIsUncertian: (uncertain: boolean) => void;
    source: string;
    setSource: (text: string) => void;
}

const PeriodForm: React.FC<PeriodFormProps> = (props) => {
    return (
        <View testID="periodForm">
            <Row style={ styles.datingRow }>
                <DatingElementField
                    dating={ props.begin }
                    setDating={ props.setBegin }
                    type="begin" />
                <Text>until</Text>
                <DatingElementField
                    dating={ props.end }
                    setDating={ props.setEnd }
                    type="end" />
            </Row>
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
    datingRow: {
        width: '60%',
        alignItems: 'center',
    },
    checkbox: {
        margin: 5,
    }
});

export default PeriodForm;