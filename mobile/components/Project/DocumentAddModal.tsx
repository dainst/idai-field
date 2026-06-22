import { Ionicons } from '@expo/vector-icons';
import { CategoryForm, Document, Tree } from 'idai-field-core';
import React, { useCallback, useContext, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ConfigurationContext } from '@/contexts/configuration-context';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import CategoryIcon from '@/components/common/CategoryIcon';
import Heading from '@/components/common/Heading';
import TitleBar from '@/components/common/TitleBar';
import LabelsContext from '@/contexts/labels/labels-context';
import {
  getKoreanFieldworkAddOptions,
  KoreanFieldworkAddOption,
  KOREAN_FIELDWORK_HIERARCHY_HELP,
} from './korean-fieldwork-add-options';
import {
  getKoreanFieldworkCategoryLabel,
  KOREAN_FIELDWORK_CATEGORY_ORDER,
} from './korean-fieldwork-categories';
import { canCreateKoreanFieldworkChildRecord } from './korean-fieldwork-child-records';

const ICON_SIZE = 34;

interface AddModalProps {
  onAddCategory: (
    categoryName: string,
    parentDoc: Document | undefined
  ) => void;
  onClose: () => void;
  parentDoc?: Document;
}

const DocumentAddModal: React.FC<AddModalProps> = ({
  onAddCategory,
  onClose,
  parentDoc,
}) => {
  const config = useContext(ConfigurationContext);
  const { labels } = useContext(LabelsContext);

  const isAllowedCategory = useCallback(
    (category: CategoryForm) =>
      !!parentDoc && canCreateKoreanFieldworkChildRecord(category, parentDoc, config),
    [parentDoc, config]
  );

  const allowedCategories = useMemo(
    () => Tree.flatten(config.getCategories())
      .filter(isAllowedCategory)
      .sort(compareKoreanFieldworkCategories),
    [config, isAllowedCategory]
  );

  const categoriesByName = useMemo(
    () => new Map(allowedCategories.map((category) => [category.name, category])),
    [allowedCategories]
  );

  const optionGroups = useMemo(
    () => getKoreanFieldworkAddOptions(
      parentDoc?.resource.category ?? '',
      allowedCategories.map((category) => category.name)
    ),
    [allowedCategories, parentDoc]
  );

  if (!parentDoc) return null;
  const parentCategory = config.getCategory(parentDoc.resource.category);
  if (!parentCategory) return null;
  const hasPrimaryOptions = optionGroups.primary.length > 0;
  const hasOtherOptions = optionGroups.other.length > 0;
  const parentCategoryLabel = labels?.get(parentCategory)
    ?? getKoreanFieldworkCategoryLabel(parentCategory.name);

  const renderOption = (option: KoreanFieldworkAddOption) => {
    const category = categoriesByName.get(option.categoryName);
    if (!category) return null;

    return (
      <TouchableOpacity
        key={option.categoryName}
        activeOpacity={0.86}
        style={styles.optionRow}
        onPress={() => onAddCategory(option.categoryName, parentDoc)}
      >
        <CategoryIcon category={category} size={ICON_SIZE} />
        <View style={styles.optionText}>
          <Text style={styles.optionLabel}>{option.label}</Text>
          <Text style={styles.optionDescription} numberOfLines={2}>
            {option.description}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#475467" />
      </TouchableOpacity>
    );
  };

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
                  기록 종류 선택
                </Heading>
              </>
            }
            left={
              <Button
                title="닫기"
                variant="transparent"
                icon={<Ionicons name="close-outline" size={16} />}
                onPress={onClose}
              />
            }
          />
          <ScrollView style={styles.categories}>
            <View style={styles.parentPanel}>
              <Text style={styles.parentLabel} numberOfLines={1}>
                상위 기록: {parentDoc.resource.identifier}
              </Text>
              <Text style={styles.parentMeta}>
                {parentCategoryLabel}에서 이어서 만들 기록을 고르세요.
              </Text>
              <Text style={styles.hierarchyHelp}>
                {KOREAN_FIELDWORK_HIERARCHY_HELP}
              </Text>
            </View>

            {hasPrimaryOptions && (
              <View style={styles.optionSection}>
                <Text style={styles.sectionTitle}>권장 기록</Text>
                {optionGroups.primary.map(renderOption)}
              </View>
            )}

            {hasOtherOptions && (
              <View style={styles.optionSection}>
                <Text style={styles.sectionTitle}>그 밖의 기록</Text>
                {optionGroups.other.map(renderOption)}
              </View>
            )}

            {!hasPrimaryOptions && !hasOtherOptions && (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={24} color="#667085" />
                <Text style={styles.emptyTitle}>
                  바로 만들 수 있는 하위 기록이 없습니다
                </Text>
                <Text style={styles.emptyText}>
                  조사구역, 트렌치, 유구, 피트·유구 구간·층위 흐름에 맞는 상위 기록을 먼저 선택해 주세요.
                </Text>
              </View>
            )}
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
};

const compareKoreanFieldworkCategories = (
  categoryA: CategoryForm,
  categoryB: CategoryForm
): number => {
  const indexA = KOREAN_FIELDWORK_CATEGORY_ORDER.indexOf(categoryA.name);
  const indexB = KOREAN_FIELDWORK_CATEGORY_ORDER.indexOf(categoryB.name);
  const orderA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
  const orderB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

  return orderA === orderB
    ? categoryA.name.localeCompare(categoryB.name)
    : orderA - orderB;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.42)',
  },
  card: {
    maxHeight: '84%',
    padding: 10,
    width: '72%',
  },
  heading: {
    marginLeft: 10,
  },
  categories: {
    margin: 10,
  },
  parentPanel: {
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  parentLabel: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '800',
  },
  parentMeta: {
    color: '#526272',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  hierarchyHelp: {
    color: '#2f6f4e',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
  optionSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  optionRow: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionText: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 10,
  },
  optionLabel: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '900',
  },
  optionDescription: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  emptyState: {
    alignItems: 'center',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyTitle: {
    color: '#27343b',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 8,
  },
  emptyText: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default DocumentAddModal;
