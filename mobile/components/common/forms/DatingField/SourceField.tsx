import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { colors } from '../../../../utils/colors';
import { SOURCE_TEST_ID } from './constants';

interface SourceFieldProps {
    source: string;
    setSource: (text: string) => void;
}

const SourceField: React.FC<SourceFieldProps> = ({ source, setSource }) => {
    return <TextInput
        placeholder="source"
        onChangeText={ setSource }
        value={ source }
        testID={ SOURCE_TEST_ID }
        style={ styles.source } />;
};

const styles = StyleSheet.create({
    source: {
        borderWidth: 1,
        borderColor: colors.lightgray,
        margin: 5,
        padding: 5
    }
});

export default SourceField;