import { MaterialIcons } from '@expo/vector-icons';
import { Document } from 'idai-field-core';
import React, { useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/utils/colors';
import {
  getKoreanFieldworkNotebookEntries,
  KoreanFieldworkNotebookEntry,
} from './korean-fieldwork-field-notes';

type NotebookLedgerFilter = 'recent'|'nextWork'|'needsEvidence';

interface KoreanFieldworkNotebookLedgerProps {
  documents: Document[];
  maxEntries?: number;
  onOpenDocument: (document: Document) => void;
  onContinueEntry?: (entry: KoreanFieldworkNotebookEntry) => void;
}

const KoreanFieldworkNotebookLedger: React.FC<
  KoreanFieldworkNotebookLedgerProps
> = ({
  documents,
  maxEntries = 5,
  onOpenDocument,
  onContinueEntry,
}) => {
  const [activeFilter, setActiveFilter] =
    useState<NotebookLedgerFilter>('recent');
  const entries = useMemo(
    () => getKoreanFieldworkNotebookEntries(documents, maxEntries),
    [documents, maxEntries]
  );
  const nextWorkEntries = useMemo(
    () => entries.filter((entry) => entry.nextWork),
    [entries]
  );
  const evidenceMissingEntries = useMemo(
    () => entries.filter((entry) => entry.needsEvidenceNumbers),
    [entries]
  );
  const visibleEntries = getVisibleNotebookEntries(
    activeFilter,
    entries,
    nextWorkEntries,
    evidenceMissingEntries
  );

  if (entries.length === 0) return null;

  return (
    <View style={styles.container} testID="fieldNotebookLedger">
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <MaterialIcons name="subject" size={18} color="#175cd3" />
          <Text style={styles.title}>야장 흐름</Text>
        </View>
        <View style={styles.metricRow}>
          <LedgerFilterChip
            filterId="recent"
            isActive={activeFilter === 'recent'}
            label="최근"
            onPress={setActiveFilter}
            value={entries.length}
          />
          <LedgerFilterChip
            filterId="nextWork"
            isActive={activeFilter === 'nextWork'}
            label="다음"
            onPress={setActiveFilter}
            value={nextWorkEntries.length}
          />
          <LedgerFilterChip
            filterId="needsEvidence"
            isActive={activeFilter === 'needsEvidence'}
            label="번호"
            onPress={setActiveFilter}
            value={evidenceMissingEntries.length}
            warning={evidenceMissingEntries.length > 0}
          />
        </View>
      </View>
      {visibleEntries.map((entry) => (
        <NotebookEntryRow
          entry={entry}
          key={entry.id}
          onContinueEntry={onContinueEntry}
          onOpenDocument={onOpenDocument}
        />
      ))}
    </View>
  );
};

const getVisibleNotebookEntries = (
  filter: NotebookLedgerFilter,
  entries: KoreanFieldworkNotebookEntry[],
  nextWorkEntries: KoreanFieldworkNotebookEntry[],
  evidenceMissingEntries: KoreanFieldworkNotebookEntry[]
): KoreanFieldworkNotebookEntry[] => {
  switch (filter) {
    case 'nextWork':
      return nextWorkEntries;
    case 'needsEvidence':
      return evidenceMissingEntries;
    default:
      return entries;
  }
};

const NotebookEntryRow: React.FC<{
  entry: KoreanFieldworkNotebookEntry;
  onContinueEntry?: (entry: KoreanFieldworkNotebookEntry) => void;
  onOpenDocument: (document: Document) => void;
}> = ({ entry, onContinueEntry, onOpenDocument }) => {
  const documentToOpen = entry.targetDocument ?? entry.sourceDocument;
  const continueEntry = (event?: GestureResponderEvent) => {
    event?.stopPropagation?.();
    onContinueEntry?.(entry);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={() => onOpenDocument(documentToOpen)}
      style={[
        styles.entryRow,
        entry.nextWork && styles.entryRowNextWork,
        entry.needsEvidenceNumbers && styles.entryRowNeedsEvidence,
      ]}
      testID={`fieldNotebookEntry_${entry.id}`}
    >
      <View style={styles.entryIcon}>
        <MaterialIcons
          name={entry.nextWork ? 'task-alt' : 'notes'}
          size={17}
          color={entry.nextWork ? '#b54708' : '#175cd3'}
        />
      </View>
      <View style={styles.entryText}>
        <View style={styles.entryMetaRow}>
          <Text style={styles.entryCategory} numberOfLines={1}>
            {entry.targetCategoryLabel}
          </Text>
          <Text style={styles.entryTarget} numberOfLines={1}>
            {entry.targetLabel}
          </Text>
          {!!entry.dateLabel && (
            <Text style={styles.entryDate} numberOfLines={1}>
              {entry.dateLabel}
            </Text>
          )}
        </View>
        <Text style={styles.entryDetail} numberOfLines={2}>
          {entry.detail}
        </Text>
        <View style={styles.chipRow}>
          <Text style={styles.sourceChip}>{entry.sourceLabel}</Text>
          {!!entry.nextWork && (
            <Text style={[styles.infoChip, styles.nextWorkChip]} numberOfLines={1}>
              다음: {entry.nextWork}
            </Text>
          )}
          {!!entry.evidenceNumbers && (
            <Text style={[styles.infoChip, styles.evidenceChip]} numberOfLines={1}>
              번호: {entry.evidenceNumbers}
            </Text>
          )}
          {entry.needsEvidenceNumbers && (
            <Text style={[styles.infoChip, styles.warningChip]}>
              번호 보강
            </Text>
          )}
        </View>
      </View>
      {!!onContinueEntry && (
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={continueEntry}
          style={styles.continueButton}
          testID={`fieldNotebookContinue_${entry.id}`}
        >
          <MaterialIcons name="edit-note" size={15} color="#2f5f4a" />
          <Text style={styles.continueButtonText}>이어쓰기</Text>
        </TouchableOpacity>
      )}
      <MaterialIcons name="chevron-right" size={18} color="#667085" />
    </TouchableOpacity>
  );
};

const LedgerFilterChip: React.FC<{
  filterId: NotebookLedgerFilter;
  isActive: boolean;
  label: string;
  onPress: (filterId: NotebookLedgerFilter) => void;
  value: number;
  warning?: boolean;
}> = ({
  filterId,
  isActive,
  label,
  onPress,
  value,
  warning = false,
}) => (
  <TouchableOpacity
    activeOpacity={0.86}
    disabled={value === 0}
    onPress={() => onPress(filterId)}
    style={[
      styles.metric,
      isActive && styles.metricActive,
      warning && styles.metricWarning,
      value === 0 && styles.metricDisabled,
    ]}
    testID={`fieldNotebookFilter_${filterId}`}
  >
    <Text
      style={[
        styles.metricValue,
        isActive && styles.metricValueActive,
        warning && styles.warningText,
        value === 0 && styles.metricTextDisabled,
      ]}
    >
      {value}
    </Text>
    <Text
      style={[
        styles.metricLabel,
        isActive && styles.metricLabelActive,
        value === 0 && styles.metricTextDisabled,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomColor: '#d0d5dd',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  titleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    paddingRight: 8,
  },
  title: {
    color: '#27343b',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 6,
  },
  metricRow: {
    flexDirection: 'row',
  },
  metric: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 5,
    minWidth: 42,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  metricActive: {
    backgroundColor: '#eff8ff',
    borderColor: '#175cd3',
  },
  metricWarning: {
    backgroundColor: '#fff1f3',
    borderColor: '#fecdca',
  },
  metricDisabled: {
    backgroundColor: '#f2f4f7',
    borderColor: '#eaecf0',
  },
  metricValue: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '900',
  },
  metricValueActive: {
    color: '#175cd3',
  },
  metricLabel: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1,
  },
  metricLabelActive: {
    color: '#175cd3',
  },
  metricTextDisabled: {
    color: '#98a2b3',
  },
  warningText: {
    color: colors.danger,
  },
  entryRow: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 6,
    minHeight: 72,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  entryRowNextWork: {
    borderColor: '#fedf89',
  },
  entryRowNeedsEvidence: {
    backgroundColor: '#fffbeb',
  },
  entryIcon: {
    alignItems: 'center',
    backgroundColor: '#eff8ff',
    borderRadius: 6,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  entryText: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
  },
  entryMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  entryCategory: {
    color: '#175cd3',
    fontSize: 10,
    fontWeight: '900',
    marginRight: 5,
  },
  entryTarget: {
    color: '#27343b',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
    marginRight: 5,
  },
  entryDate: {
    color: '#667085',
    flexShrink: 2,
    fontSize: 10,
    fontWeight: '700',
  },
  entryDetail: {
    color: '#344054',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  sourceChip: {
    backgroundColor: '#f2f4f7',
    borderColor: '#d0d5dd',
    borderRadius: 5,
    borderWidth: 1,
    color: '#475467',
    fontSize: 10,
    fontWeight: '900',
    marginRight: 4,
    marginTop: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  infoChip: {
    borderRadius: 5,
    borderWidth: 1,
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '900',
    marginRight: 4,
    marginTop: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  nextWorkChip: {
    backgroundColor: '#fffaeb',
    borderColor: '#fedf89',
    color: '#b54708',
  },
  evidenceChip: {
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
    color: '#175cd3',
  },
  warningChip: {
    backgroundColor: '#fff1f3',
    borderColor: '#fecdca',
    color: colors.danger,
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 30,
    paddingHorizontal: 7,
  },
  continueButtonText: {
    color: '#2f5f4a',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 3,
  },
});

export default KoreanFieldworkNotebookLedger;
