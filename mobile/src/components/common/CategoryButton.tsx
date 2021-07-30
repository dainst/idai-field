import { Category, I18N, ProjectConfiguration } from 'idai-field-core';
import React, { useContext } from 'react';
import { TouchableOpacityProps } from 'react-native';
import { PreferencesContext } from '../../contexts/preferences-context';
import CategoryIconButton from './CategoryIconButton';

interface CategoryButtonProps extends TouchableOpacityProps {
    size: number;
    category: Category;
    config: ProjectConfiguration;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ category ,...btnProps }) => {

    const languages = useContext(PreferencesContext).preferences.languages;

    return <CategoryIconButton
        category={ category }
        label={ I18N.getLabel(category, languages) }
        { ...btnProps }
    />;
};

export default CategoryButton;
