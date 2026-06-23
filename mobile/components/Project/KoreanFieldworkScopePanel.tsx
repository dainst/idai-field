import { MaterialIcons } from '@expo/vector-icons';
import { Document } from 'idai-field-core';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getKoreanFieldworkCategoryLabel,
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';

interface KoreanFieldworkScopePanelProps {
  documents: Document[];
  hierarchyPath: Document[];
  issueCount: number;
  onAddChild: (document: Document) => void;
  onBackScope: () => void;
  onClearScope: () => void;
  onOpenMap: () => void;
}

const C = KOREAN_FIELDWORK_CATEGORIES;

const STRUCTURE_CATEGORIES = [
  C.OPERATION,
  C.TRENCH,
  C.FEATURE_GROUP,
  C.FEATURE,
  C.FEATURE_SEGMENT,
  C.LAYER,
];

const EVIDENCE_CATEGORIES = [
  C.FIND,
  C.FIND_COLLECTION,
  C.SAMPLE,
  C.PHOTO,
  C.SOIL_PROFILE_PHOTO,
  C.DRAWING,
  C.PEN_MEMO,
];

const REVIEW_CATEGORIES = [
  C.DAILY_LOG,
  C.FIELD_RECORD_QUALITY_REVIEW,
  C.SOURCE_EVIDENCE_INDEX,
  C.SURVEY_BOUNDARY,
];

const KoreanFieldworkScopePanel: React.FC<KoreanFieldworkScopePanelProps> = ({
  documents,
  hierarchyPath,
  issueCount,
  onAddChild,
  onBackScope,
  onClearScope,
  onOpenMap,
}) => {
  const currentParent = hierarchyPath[hierarchyPath.length - 1];
  const fallbackOperation = useMemo(
    () => documents.find((document) => document.resource.category === C.OPERATION),
    [documents]
  );
  const addTarget = currentParent ?? fallbackOperation;
  const stats = useMemo(() => getScopeStats(documents, issueCount), [
    documents,
    issueCount,
  ]);

  return (
    <View style={styles.container} testID="koreanFieldworkScopePanel">
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.kicker}>현재 야장 범위</Text>
          <Text style={styles.title} numberOfLines={1}>
            {currentParent
              ? `${getKoreanFieldworkCategoryLabel(currentParent.resource.category)} · ${currentParent.resource.identifier}`
              : '전체 조사자료'}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.86}
          style={styles.mapButton}
          onPress={onOpenMap}
          testID="scopeOpenMap"
        >
          <MaterialIcons name="map" size={18} color="#2f5f4a" />
          <Text style={styles.mapButtonText}>지도</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pathRow}
      >
        <ScopePathChip label="전체" isActive={hierarchyPath.length === 0} />
        {hierarchyPath.map((document) => (
          <ScopePathChip
            key={document.resource.id}
            label={document.resource.identifier}
            isActive={document.resource.id === currentParent?.resource.id}
          />
        ))}
      </ScrollView>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statChip}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        {hierarchyPath.length > 0 && (
          <>
            <ScopeAction
              icon="home"
              label="전체"
              onPress={onClearScope}
              testID="scopeClear"
            />
            <ScopeAction
              icon="arrow-upward"
              label="상위"
              onPress={onBackScope}
              testID="scopeBack"
            />
          </>
        )}
        <ScopeAction
          icon="add"
          label={currentParent ? '하위추가' : '조사구역에 추가'}
          isDisabled={!addTarget}
          onPress={() => addTarget && onAddChild(addTarget)}
          testID="scopeAddChild"
        />
      </View>
    </View>
  );
};

const ScopePathChip: React.FC<{
  label: string;
  isActive: boolean;
}> = ({ label, isActive }) => (
  <View style={[styles.pathChip, isActive && styles.pathChipActive]}>
    <Text
      numberOfLines={1}
      style={[styles.pathChipText, isActive && styles.pathChipTextActive]}
    >
      {label}
    </Text>
  </View>
);

const ScopeAction: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
  testID: string;
}> = ({
  icon,
  label,
  onPress,
  isDisabled = false,
  testID,
}) => (
  <TouchableOpacity
    activeOpacity={0.86}
    disabled={isDisabled}
    onPress={onPress}
    style={[styles.scopeAction, isDisabled && styles.scopeActionDisabled]}
    testID={testID}
  >
    <MaterialIcons name={icon} size={17} color={isDisabled ? '#98a2b3' : '#2f5f4a'} />
    <Text style={[styles.scopeActionText, isDisabled && styles.scopeActionTextDisabled]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const getScopeStats = (
  documents: Document[],
  issueCount: number
) => [
  {
    label: '구조',
    value: countCategories(documents, STRUCTURE_CATEGORIES),
  },
  {
    label: '자료',
    value: countCategories(documents, EVIDENCE_CATEGORIES),
  },
  {
    label: '일지·점검',
    value: countCategories(documents, REVIEW_CATEGORIES),
  },
  {
    label: '확인',
    value: issueCount,
  },
];

const countCategories = (
  documents: Document[],
  categories: readonly string[]
): number => {
  const categorySet = new Set(categories);

  return documents.filter((document) =>
    categorySet.has(document.resource.category)
  ).length;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderBottomColor: '#d0d5dd',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  titleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  kicker: {
    color: '#2f6f4e',
    fontSize: 11,
    fontWeight: '900',
  },
  title: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  mapButton: {
    alignItems: 'center',
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 34,
    paddingHorizontal: 9,
  },
  mapButtonText: {
    color: '#027a48',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 4,
  },
  pathRow: {
    alignItems: 'center',
    paddingTop: 9,
  },
  pathChip: {
    backgroundColor: 'white',
    borderColor: '#cbd5e1',
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
    maxWidth: 180,
    minHeight: 30,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  pathChipActive: {
    backgroundColor: '#27343b',
    borderColor: '#27343b',
  },
  pathChipText: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '800',
  },
  pathChipTextActive: {
    color: 'white',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  statChip: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    marginRight: 6,
    minHeight: 46,
    paddingVertical: 5,
  },
  statValue: {
    color: '#263238',
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  scopeAction: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 7,
    minHeight: 36,
    paddingHorizontal: 10,
  },
  scopeActionDisabled: {
    backgroundColor: '#f2f4f7',
  },
  scopeActionText: {
    color: '#2f5f4a',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 4,
  },
  scopeActionTextDisabled: {
    color: '#98a2b3',
  },
});

export default KoreanFieldworkScopePanel;
