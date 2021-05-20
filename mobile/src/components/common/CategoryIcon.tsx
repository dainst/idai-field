import { Document, ProjectConfiguration } from 'idai-field-core';
import React, { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';


interface CategoryIconProps {
    config: ProjectConfiguration;
    document: Document;
    size: number;
}


const CategoryIcon = ({ config, document, size }: CategoryIconProps): ReactElement => {

    const styles = getStyles(config, document, size);

    return <View style={ styles.container }>
        <Text style={ styles.text }>{ document.resource.category[0].toUpperCase() }</Text>
    </View>;
};

export default CategoryIcon;


const getStyles = (config: ProjectConfiguration, document: Document, size: number) => StyleSheet.create({
    container: {
        height: size,
        width: size,
        backgroundColor: config.getColorForCategory(document.resource.category),
        borderRadius: size / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: config.getTextColorForCategory(document.resource.category),
        fontSize: size / 1.5,
    },
});
