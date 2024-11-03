import { CategoryForm } from 'idai-field-core';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import CategoryIcon from './CategoryIcon';

export interface CategoryIconButtonProps extends TouchableOpacityProps {
  size: number;
  category: CategoryForm;
  label: string;
}

const CategoryIconButton: React.FC<CategoryIconButtonProps> = ({
  size,
  category,
  label,
  ...btnProps
}) => {
  return (
    <TouchableOpacity {...btnProps} activeOpacity={0.9}>
      <View style={styles.container}>
        <CategoryIcon category={category} size={size} />
        <Text style={styles.title}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  container: {
    paddingLeft: 5,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  title: {
    paddingLeft: 15,
  },
});

export default CategoryIconButton;
