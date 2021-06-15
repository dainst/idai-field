import React from 'react';
import IconButton, { IconButtonBaseProps } from './IconButton';

interface CategoryButtonProps extends IconButtonBaseProps{
    category: string
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ category, ...btnProps }) => {
    return <IconButton
        text={ category }
        category={ category }
        { ...btnProps } />;
};

export default CategoryButton;