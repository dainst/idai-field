import { Document, ProjectConfiguration } from 'idai-field-core';
import React, { ReactElement } from 'react';
import {
    NativeSyntheticEvent, NativeTouchEvent, StyleSheet,
    Text, TouchableOpacity, View, ViewStyle
} from 'react-native';
import CategoryIcon from './CategoryIcon';


interface DocumentButtonProps {
    config: ProjectConfiguration;
    document: Document;
    size: number;
    style?: ViewStyle;
    onPress?: (e: NativeSyntheticEvent<NativeTouchEvent>) => void;
    disabled?: boolean
}


const DocumentButton = ({
    config, document, size,
    style, onPress, disabled = false }: DocumentButtonProps): ReactElement => {

    return <TouchableOpacity
        onPress={ onPress }
        style={ [style, styles.button] }
        activeOpacity={ .9 }
        disabled={ disabled }
    >
        <View style={ styles.container }>
            <CategoryIcon config={ config } category={ document.resource.category } size={ size } />
            <Text style={ styles.title }>{ document.resource.identifier }</Text>
        </View>
    </TouchableOpacity>;
};

export default DocumentButton;


const styles = StyleSheet.create({
    button: {
        paddingHorizontal: 15,
        paddingVertical: 10,
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
