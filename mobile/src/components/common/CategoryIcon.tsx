import { Category, I18N, ProjectConfiguration } from 'idai-field-core';
import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PreferencesContext } from '../../contexts/preferences-context';


interface CategoryIconProps {
    config: ProjectConfiguration;
    category: Category;
    size: number;
}


const CategoryIcon: React.FC<CategoryIconProps> = ({ category, size }: CategoryIconProps) => {

    const languages = useContext(PreferencesContext).preferences.languages;

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
