import { MaterialIcons } from '@expo/vector-icons';
import { CategoryForm } from 'idai-field-core';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface CategoryIconProps {
  category: CategoryForm;
  size: number;
}

const CATEGORY_ICONS: Readonly<Record<string, keyof typeof MaterialIcons.glyphMap>> = {
  AerialMapLayer: 'satellite-alt',
  DailyLog: 'event-note',
  Drawing: 'architecture',
  Feature: 'account-tree',
  FeatureGroup: 'hub',
  FeatureSegment: 'crop-free',
  FieldRecordQualityReview: 'playlist-add-check',
  Find: 'category',
  FindCollection: 'inventory-2',
  Layer: 'layers',
  Operation: 'map',
  PenMemo: 'edit-note',
  Photo: 'photo-camera',
  Place: 'place',
  Sample: 'science',
  SoilProfilePhoto: 'terrain',
  SourceEvidenceIndex: 'folder-copy',
  Survey: 'travel-explore',
  SurveyBoundary: 'polyline',
  TermAlias: 'label',
  TermAuthority: 'menu-book',
  Trench: 'view-week',
};

const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size,
}: CategoryIconProps) => {
  const styles = getStyles(category, size);
  const iconSize = Math.max(13, Math.round(size * 0.58));

  return (
    <View style={styles.container}>
      <MaterialIcons
        name={getCategoryIconName(category)}
        size={iconSize}
        color={CategoryForm.getTextColorForCategory(category)}
      />
    </View>
  );
};

export default CategoryIcon;

const getCategoryIconName = (
  category: CategoryForm
): keyof typeof MaterialIcons.glyphMap =>
  CATEGORY_ICONS[category.name] ?? 'article';

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
  });
