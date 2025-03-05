import { CategoryForm } from 'idai-field-core';
import React, { useContext } from 'react';
import { TouchableOpacityProps } from 'react-native';
import LabelsContext from '@/contexts/labels/labels-context';
import CategoryIconButton from './CategoryIconButton';

interface CategoryButtonProps extends TouchableOpacityProps {
  size: number;
  category: CategoryForm;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({
  category,
  ...btnProps
}) => {
  const { labels } = useContext(LabelsContext);

  if (!labels) return null;

  return (
    <CategoryIconButton
      category={category}
      label={labels.get(category)}
      {...btnProps}
    />
  );
};

export default CategoryButton;
