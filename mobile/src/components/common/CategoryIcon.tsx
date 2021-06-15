import { ProjectConfiguration } from 'idai-field-core';
import React, { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';


interface CategoryIconProps {
    config: ProjectConfiguration;
    category: string;
    size: number;
}


const CategoryIcon = ({ config, category, size }: CategoryIconProps): ReactElement => {

    const styles = getStyles(config, category, size);

    return <View style={ styles.container }>
        <Text style={ styles.text }>{ config.getLabelForCategory(category).substr(0, 1) }</Text>
    </View>;
};

export default CategoryIcon;


const getStyles = (config: ProjectConfiguration, category: string, size: number) => StyleSheet.create({
    container: {
        height: size,
        width: size,
        backgroundColor: config.getColorForCategory(category),
        borderRadius: size / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: config.getTextColorForCategory(category),
        fontSize: size / 1.5,
    },
});
