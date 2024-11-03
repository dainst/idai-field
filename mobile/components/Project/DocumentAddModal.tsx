import { Ionicons } from '@expo/vector-icons';
import { CategoryForm, Document, Tree } from 'idai-field-core';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { ConfigurationContext } from '@/contexts/configuration-context';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import CategoryButton from '@/components/common/CategoryButton';
import CategoryIcon from '@/components/common/CategoryIcon';
import Heading from '@/components/common/Heading';
import TitleBar from '@/components/common/TitleBar';

const ICON_SIZE = 30;

interface AddModalProps {
  onAddCategory: (
    categoryName: string,
    parentDoc: Document | undefined
  ) => void;
  onClose: () => void;
  isInOverview: (category: string) => boolean;
  parentDoc?: Document;
}

const DocumentAddModal: React.FC<AddModalProps> = ({
  onAddCategory,
  onClose,
  isInOverview,
  parentDoc,
}) => {
  const config = useContext(ConfigurationContext);

  const [categories, setCategories] = useState<CategoryForm[]>([]);

  const isAllowedCategory = useCallback(
    (category: CategoryForm) => {
      if (category.name === 'Image' || !parentDoc) return false;
      if (isInOverview(parentDoc.resource.category)) {
        if (
          !config.isAllowedRelationDomainCategory(
            category.name,
            parentDoc.resource.category,
            'isRecordedIn'
          )
        )
          return false;
        return !category.mustLieWithin;
      } else {
        return config.isAllowedRelationDomainCategory(
          category.name,
          parentDoc.resource.category,
          'liesWithin'
        );
      }
    },
    [isInOverview, parentDoc, config]
  );

  useEffect(() => {
    const categories: CategoryForm[] = [];
    Tree.flatten(config.getCategories()).forEach((category) => {
      if (
        isAllowedCategory(category) &&
        (!category.parentCategory ||
          !isAllowedCategory(category.parentCategory))
      )
        categories.push(category);
    });
    setCategories(categories);
  }, [isAllowedCategory, config]);

  const renderButton = (
    category: CategoryForm,
    style: ViewStyle,
    key?: string
  ) => (
    <CategoryButton
      size={ICON_SIZE}
      category={category}
      style={style}
      key={key}
      onPress={() => onAddCategory(category.name, parentDoc)}
    />
  );

  const renderCategoryChilds = (category: CategoryForm) => (
    <View style={categoryChildStyles.container}>
      {category.children.map((category) =>
        renderButton(category, { margin: 2.5 }, category.name)
      )}
    </View>
  );

  if (!parentDoc) return null;
  const parentCategory = config.getCategory(parentDoc.resource.category);
  if (!parentCategory) return null;

  return (
    <Modal
      onRequestClose={onClose}
      animationType="fade"
      transparent
      visible={true}
    >
      <View style={styles.container}>
        <Card style={styles.card}>
          <TitleBar
            title={
              <>
                <CategoryIcon category={parentCategory} size={25} />
                <Heading style={styles.heading}>
                  Add child to {parentDoc?.resource.identifier}
                </Heading>
              </>
            }
            left={
              <Button
                title="Cancel"
                variant="transparent"
                icon={<Ionicons name="close-outline" size={16} />}
                onPress={onClose}
              />
            }
          />
          <ScrollView style={styles.categories}>
            {categories.map((category) => (
              <View key={category.name}>
                {renderButton(category, { margin: 5 })}
                {renderCategoryChilds(category)}
              </View>
            ))}
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
};

const categoryChildStyles = StyleSheet.create({
  container: {
    marginLeft: 20,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 200,
    alignItems: 'center',
  },
  card: {
    padding: 10,
    height: '60%',
    width: '60%',
    opacity: 0.9,
  },
  heading: {
    marginLeft: 10,
  },
  categories: {
    margin: 10,
  },
  categoryChildContainer: {
    marginLeft: 20,
  },
});

export default DocumentAddModal;
