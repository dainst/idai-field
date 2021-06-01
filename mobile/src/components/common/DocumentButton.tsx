import { Document, ProjectConfiguration } from 'idai-field-core';
import React, { ReactElement } from 'react';
import { NativeSyntheticEvent, NativeTouchEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../utils/colors';
import CategoryIcon from './CategoryIcon';


interface DocumentButtonProps {
    config: ProjectConfiguration;
    document: Document;
    size: number;
    onPress: (e: NativeSyntheticEvent<NativeTouchEvent>) => void;
}


const DocumentButton = ({ config, document, size, onPress }: DocumentButtonProps): ReactElement => {

    return <TouchableOpacity
        onPress={ onPress }
        style={ styles.button }
        activeOpacity={ .9 }
    >
        <View style={ styles.container }>
            <CategoryIcon config={ config } document={ document } size={ size } />
            <Text style={ styles.title }>{ document.resource.identifier }</Text>
        </View>
    </TouchableOpacity>;
};

export default DocumentButton;


const styles = StyleSheet.create({
    button: {
        backgroundColor: colors['secondary'],
        padding: 10,
        borderRadius: 5,
        flex: 1,
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    title: {
        paddingLeft: 15,
    }
});
