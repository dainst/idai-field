import { Category } from 'idai-field-core';
import React from 'react';
import IconButton, { IconButtonBaseProps } from './IconButton';

interface CategoryButtonProps extends IconButtonBaseProps{
    category: Category;
    languages: string[]
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ category, languages ,...btnProps }) => {
    return <IconButton
        category={ category }
        languages={ languages }
        { ...btnProps } />;
};

export default CategoryButton;