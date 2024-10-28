import { CategoryForm } from 'idai-field-core';
import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LabelsContext from '../../contexts/labels/labels-context';

interface CategoryIconProps {
  category: CategoryForm;
  size: number;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size,
}: CategoryIconProps) => {
  const { labels } = useContext(LabelsContext);

  const styles = getStyles(category, size);

  if (!labels) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{labels.get(category).substr(0, 1)}</Text>
    </View>
  );
};

export default CategoryIcon;

const getStyles = (category: CategoryForm, size: number) =>
  StyleSheet.create({
    container: {
      height: size,
      width: size,
      backgroundColor: category.color,
      borderRadius: size / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: CategoryForm.getTextColorForCategory(category),
      fontSize: size / 1.5,
    },
  });
