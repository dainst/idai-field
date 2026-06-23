import { MaterialIcons } from '@expo/vector-icons';
import { Document } from 'idai-field-core';
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/utils/colors';
import {
  getKoreanFieldworkDailyNotebookDigest,
  KoreanFieldworkNotebookEntry,
  KoreanFieldworkNotebookContinuationFocus,
} from './korean-fieldwork-field-notes';

interface KoreanFieldworkDailyNotebookDigestProps {
  canOpenDailyLog?: boolean;
  documents: Document[];
  maxEntries?: number;
  now?: Date;
  onContinueEntry: (
    entry: KoreanFieldworkNotebookEntry,
    focus?: KoreanFieldworkNotebookContinuationFocus
  ) => void;
  onOpenDailyLog: () => void;
}

const KoreanFieldworkDailyNotebookDigest: React.FC<
  KoreanFieldworkDailyNotebookDigestProps
> = ({
  canOpenDailyLog = true,
  documents,
  maxEntries = 8,
  now,
  onContinueEntry,
  onOpenDailyLog,
}) => {
  const digest = useMemo(
    () => getKoreanFieldworkDailyNotebookDigest(
      documents,
      now ?? new Date(),
      maxEntries
    ),
    [documents, maxEntries, now]
  );

  if (
    digest.entries.length === 0
    && digest.dailyLogDocuments.length === 0
  ) {
    return null;
  }

  const nextWorkItems = digest.nextWorkEntries.slice(0, 3);
  const evidenceItems = digest.evidenceMissingEntries.slice(0, 3);

  return (
    <View style={styles.container} testID="dailyNotebookDigest">
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.titleRow}>
            <MaterialIcons name="event-note" size={18} color="#2f5f4a" />
            <Text style={styles.title}>오늘 정리</Text>
          </View>
          <Text style={styles.dateLabel}>{digest.dateLabel}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.86}
          disabled={!canOpenDailyLog}
          onPress={onOpenDailyLog}
          style={[
            styles.dailyLogButton,
            !canOpenDailyLog && styles.dailyLogButtonDisabled,
          ]}
          testID="dailyNotebookOpenDailyLog"
        >
          <MaterialIcons
            name={digest.primaryDailyLog ? 'open-in-new' : 'add'}
            size={15}
            color={canOpenDailyLog ? '#2f5f4a' : '#98a2b3'}
          />
          <Text
            style={[
              styles.dailyLogButtonText,
              !canOpenDailyLog && styles.dailyLogButtonTextDisabled,
            ]}
          >
            {digest.primaryDailyLog ? '일지 열기' : '일지 만들기'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricRow}>
        <DigestMetric label="기록" value={digest.entries.length} />
        <DigestMetric label="다음" value={digest.nextWorkEntries.length} />
        <DigestMetric
          label="번호"
          value={digest.evidenceMissingEntries.length}
          warning={digest.evidenceMissingEntries.length > 0}
        />
      </View>

      {nextWorkItems.length > 0 && (
        <DigestSection
          icon="task-alt"
          items={nextWorkItems}
          label="남은 작업"
          focus="nextWork"
          onContinueEntry={onContinueEntry}
          textForEntry={(entry) => entry.nextWork}
        />
      )}

      {evidenceItems.length > 0 && (
        <DigestSection
          icon="tag"
          items={evidenceItems}
          label="번호 보강"
          focus="evidenceNumbers"
          onContinueEntry={onContinueEntry}
          textForEntry={() => '사진·도면·유물·시료 번호를 이어서 적으세요.'}
          warning
        />
      )}

      {nextWorkItems.length === 0 && evidenceItems.length === 0 && (
        <View style={styles.emptyRow} testID="dailyNotebookDigestEmpty">
          <MaterialIcons name="check-circle" size={16} color="#027a48" />
          <Text style={styles.emptyText}>
            오늘 야장에서 바로 보강할 항목은 없습니다.
          </Text>
        </View>
      )}
    </View>
  );
};

const DigestSection: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  items: KoreanFieldworkNotebookEntry[];
  label: string;
  focus: KoreanFieldworkNotebookContinuationFocus;
  onContinueEntry: (
    entry: KoreanFieldworkNotebookEntry,
    focus?: KoreanFieldworkNotebookContinuationFocus
  ) => void;
  textForEntry: (entry: KoreanFieldworkNotebookEntry) => string;
  warning?: boolean;
}> = ({
  focus,
  icon,
  items,
  label,
  onContinueEntry,
  textForEntry,
  warning = false,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionTitleRow}>
      <MaterialIcons
        name={icon}
        size={15}
        color={warning ? colors.danger : '#344054'}
      />
      <Text style={[styles.sectionTitle, warning && styles.warningText]}>
        {label}
      </Text>
    </View>
    {items.map((entry) => (
      <TouchableOpacity
        activeOpacity={0.86}
        key={`${label}-${entry.id}`}
        onPress={() => onContinueEntry(entry, focus)}
        style={[styles.itemRow, warning && styles.itemRowWarning]}
        testID={`dailyNotebookContinue_${label}_${entry.id}`}
      >
        <View style={styles.itemText}>
          <Text style={styles.itemMeta} numberOfLines={1}>
            {entry.targetCategoryLabel} · {entry.targetLabel}
          </Text>
          <Text style={styles.itemDetail} numberOfLines={2}>
            {textForEntry(entry)}
          </Text>
        </View>
        <View style={styles.continuePill}>
          <MaterialIcons name="edit-note" size={14} color="#2f5f4a" />
          <Text style={styles.continueText}>이어쓰기</Text>
        </View>
      </TouchableOpacity>
    ))}
  </View>
);

const DigestMetric: React.FC<{
  label: string;
  value: number;
  warning?: boolean;
}> = ({ label, value, warning = false }) => (
  <View style={[styles.metric, warning && styles.metricWarning]}>
    <Text style={[styles.metricValue, warning && styles.warningText]}>
      {value}
    </Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderColor: '#a9c8b4',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    color: '#244d3c',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 6,
  },
  dateLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  dailyLogButton: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 34,
    paddingHorizontal: 9,
  },
  dailyLogButtonDisabled: {
    backgroundColor: '#f2f4f7',
    borderColor: '#d0d5dd',
  },
  dailyLogButtonText: {
    color: '#2f5f4a',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 4,
  },
  dailyLogButtonTextDisabled: {
    color: '#98a2b3',
  },
  metricRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  metric: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
    minWidth: 54,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  metricWarning: {
    backgroundColor: '#fff1f3',
    borderColor: '#fecdca',
  },
  metricValue: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1,
  },
  warningText: {
    color: colors.danger,
  },
  section: {
    marginTop: 10,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 5,
  },
  sectionTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  itemRow: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 5,
    minHeight: 54,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  itemRowWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fedf89',
  },
  itemText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 7,
  },
  itemMeta: {
    color: '#175cd3',
    fontSize: 10,
    fontWeight: '900',
  },
  itemDetail: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 2,
  },
  continuePill: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#bbf7d0',
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 30,
    paddingHorizontal: 7,
  },
  continueText: {
    color: '#2f5f4a',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 3,
  },
  emptyRow: {
    alignItems: 'center',
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 38,
    paddingHorizontal: 9,
  },
  emptyText: {
    color: '#027a48',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 5,
  },
});

export default KoreanFieldworkDailyNotebookDigest;
