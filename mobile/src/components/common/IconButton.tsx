import { Category, I18N, ProjectConfiguration } from 'idai-field-core';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import CategoryIcon from './CategoryIcon';

export interface IconButtonBaseProps extends TouchableOpacityProps {
    size: number;
    config: ProjectConfiguration;
    languages: string[];
}

interface IconButtonProps extends IconButtonBaseProps {
    category: Category;
}

const IconButton: React.FC<IconButtonProps> = ({ size, category, config, languages, ...btnProps }) => {

    return <TouchableOpacity { ...btnProps } activeOpacity={ .9 }>
        <View style={ styles.container }>
            <CategoryIcon config={ config } category={ category } size={ size } languages={ languages } />
            <Text style={ styles.title }>{ I18N.getLabel(category, languages) }</Text>
        </View>
    </TouchableOpacity>;
};

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    container: {
        paddingLeft: 5,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    title: {
        paddingLeft: 15,
    }
});

export default IconButton;