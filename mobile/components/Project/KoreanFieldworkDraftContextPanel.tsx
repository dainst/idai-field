import { MaterialIcons } from '@expo/vector-icons';
import {
  Document,
  NewResource,
} from 'idai-field-core';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getKoreanFieldworkCategoryLabel,
} from './korean-fieldwork-categories';

interface KoreanFieldworkDraftContextPanelProps {
  parentDocument: Document;
  resource: NewResource;
}

const RELATION_LABELS: Readonly<Record<string, string>> = {
  depicts: '묘사',
  isDepictedIn: '사진·도면',
  isMapLayerOf: '지도 레이어',
  isRecordedIn: '조사구역',
  isRecordedInFeature: '유구 기록',
  liesWithin: '소속',
};

const KoreanFieldworkDraftContextPanel: React.FC<KoreanFieldworkDraftContextPanelProps> = ({
  parentDocument,
  resource,
}) => {
  const relationChips = getRelationChips(resource, parentDocument.resource.id);

  return (
    <View style={styles.container} testID="koreanFieldworkDraftContextPanel">
      <View style={styles.titleRow}>
        <MaterialIcons name="account-tree" size={18} color="#175cd3" />
        <Text style={styles.title}>새 기록 맥락</Text>
      </View>
      <View style={styles.contextRow}>
        <View style={styles.contextBlock}>
          <Text style={styles.contextLabel}>상위 기록</Text>
          <Text style={styles.contextValue} numberOfLines={1}>
            {formatDocumentLabel(parentDocument)}
          </Text>
        </View>
        <View style={styles.contextBlock}>
          <Text style={styles.contextLabel}>새 기록</Text>
          <Text style={styles.contextValue} numberOfLines={1}>
            {getKoreanFieldworkCategoryLabel(resource.category)}
          </Text>
        </View>
      </View>
      {relationChips.length > 0 && (
        <View style={styles.relationRow}>
          {relationChips.map((chip) => (
            <Text key={chip} style={styles.relationChip}>
              {chip}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const getRelationChips = (
  resource: NewResource,
  parentDocumentId: string
): string[] => Object.entries(resource.relations ?? {})
  .filter(([, targets]) =>
    Array.isArray(targets) && targets.includes(parentDocumentId)
  )
  .map(([relationName]) => RELATION_LABELS[relationName] ?? relationName);

const formatDocumentLabel = (document: Document): string => {
  const categoryLabel = getKoreanFieldworkCategoryLabel(document.resource.category);
  const identifier = document.resource.identifier || document.resource.id;

  return `${categoryLabel} · ${identifier}`;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    color: '#175cd3',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 5,
  },
  contextRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  contextBlock: {
    flex: 1,
    paddingRight: 8,
  },
  contextLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
  },
  contextValue: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  relationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  relationChip: {
    backgroundColor: '#eff8ff',
    borderRadius: 4,
    color: '#175cd3',
    fontSize: 11,
    fontWeight: '900',
    marginRight: 5,
    marginTop: 4,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
});

export default KoreanFieldworkDraftContextPanel;
