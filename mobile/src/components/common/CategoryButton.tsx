import { Category, I18N, ProjectConfiguration } from 'idai-field-core';
import React from 'react';
import { TouchableOpacityProps } from 'react-native';
import IconButton from './IconButton';

interface CategoryButtonProps extends TouchableOpacityProps {
    size: number;
    category: Category;
    languages: string[];
    config: ProjectConfiguration;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ category, languages ,...btnProps }) => {
    return <IconButton
        category={ category }
        languages={ languages }
        label={ I18N.getLabel(category, languages) }
        { ...btnProps }
    />;
};

export default CategoryButton;
