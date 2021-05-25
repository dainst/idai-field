import { Document, ProjectConfiguration } from 'idai-field-core';
import React, { ReactElement } from 'react';
import { NativeSyntheticEvent, NativeTouchEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../utils/colors';
import CategoryIcon from './CategoryIcon';


interface CategoryButtonProps {
    config: ProjectConfiguration;
    document: Document;
    size: number;
    onPress: (e: NativeSyntheticEvent<NativeTouchEvent>) => void;
}


const CategoryButton = ({ config, document, size, onPress }: CategoryButtonProps): ReactElement => {

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

export default CategoryButton;


const styles = StyleSheet.create({
    button: {
        backgroundColor: colors['secondary'],
        padding: 10,
        borderRadius: 5,
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        paddingLeft: 5,
    }
});
