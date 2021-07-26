import { Category, I18N, ProjectConfiguration } from 'idai-field-core';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';


interface CategoryIconProps {
    config: ProjectConfiguration;
    category: Category;
    size: number;
    languages: string[];
}


const CategoryIcon: React.FC<CategoryIconProps> = ({ category, size, languages }: CategoryIconProps) => {

    const styles = getStyles(category, size);

    return <View style={ styles.container }>
        <Text style={ styles.text }>{ I18N.getLabel(category, languages).substr(0, 1) }</Text>
    </View>;
};

export default CategoryIcon;


const getStyles = (category: Category, size: number) => StyleSheet.create({
    container: {
        height: size,
        width: size,
        backgroundColor: category.color,
        borderRadius: size / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: Category.getTextColorForCategory(category),
        fontSize: size / 1.5,
    },
});
