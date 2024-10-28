import { Document } from 'idai-field-core';
import React, { useContext } from 'react';
import { TouchableOpacityProps } from 'react-native';
import { ConfigurationContext } from '../../contexts/configuration-context';
import CategoryIconButton from './CategoryIconButton';

interface DocumentButtonProps extends TouchableOpacityProps {
  size: number;
  document: Document;
}

const DocumentButton: React.FC<DocumentButtonProps> = ({
  document,
  ...btnProps
}) => {
  const category = useContext(ConfigurationContext).getCategory(
    document.resource.category
  );

  if (!category) return null;

  return (
    <CategoryIconButton
      category={category}
      label={document.resource.identifier}
      {...btnProps}
    />
  );
};

export default DocumentButton;
