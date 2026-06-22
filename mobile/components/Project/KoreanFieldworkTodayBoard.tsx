import {
  Document,
  KoreanFieldworkTodaySummary,
} from 'idai-field-core';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/utils/colors';
import DocumentButton from '@/components/common/DocumentButton';
import KoreanFieldworkPriorityTaskList from './KoreanFieldworkPriorityTaskList';
import KoreanFieldworkWorkbenchPanel from './KoreanFieldworkWorkbenchPanel';
import { KOREAN_FIELDWORK_CATEGORIES } from './korean-fieldwork-categories';
import {
  getKoreanFieldworkPriorityTasks,
  getKoreanFieldworkTodayActionTargets,
} from './korean-fieldwork-today-actions';

interface KoreanFieldworkTodayBoardProps {
  summary: KoreanFieldworkTodaySummary;
  documents?: Document[];
  onEditDocument: (docId: string, categoryName: string) => void;
  onAddDocumentOfCategory?: (parentDoc: Document, categoryName: string) => void;
  onOpenDocument?: (document: Document) => void;
  onOpenMap?: () => void;
}

const KoreanFieldworkTodayBoard: React.FC<KoreanFieldworkTodayBoardProps> = ({
  summary,
  documents = [],
  onEditDocument,
  onAddDocumentOfCategory,
  onOpenDocument,
  onOpenMap,
}) => {
  const documentsById = useMemo(
    () => new Map(documents.map((document) => [document.resource.id, document])),
    [documents]
  );
  const actionTargets = useMemo(
    () => getKoreanFieldworkTodayActionTargets(summary, documents),
    [documents, summary]
  );
  const priorityTasks = useMemo(
    () => getKoreanFieldworkPriorityTasks(summary, documents, 4),
    [documents, summary]
  );

  const openDocument = (document: Document | undefined) => {
    if (!document) return;
    if (onOpenDocument) {
      onOpenDocument(document);
      return;
    }

    onEditDocument(document.resource.id, document.resource.category);
  };
  const openDailyLog = () => {
    if (actionTargets.dailyLog) {
      openDocument(actionTargets.dailyLog);
      return;
    }

    if (actionTargets.primaryOperation && onAddDocumentOfCategory) {
      onAddDocumentOfCategory(
        actionTargets.primaryOperation,
        KOREAN_FIELDWORK_CATEGORIES.DAILY_LOG
      );
    }
  };
  const openFeatureCandidate = () => {
    if (actionTargets.featureCandidate) {
      openDocument(actionTargets.featureCandidate);
      return;
    }

    if (actionTargets.featureDraftParent && onAddDocumentOfCategory) {
      onAddDocumentOfCategory(
        actionTargets.featureDraftParent,
        KOREAN_FIELDWORK_CATEGORIES.FEATURE
      );
    }
  };

  return (
    <View style={styles.container} testID="koreanFieldworkTodayBoard">
      <View style={styles.statsRow}>
        <Stat label="일지" value={summary.dailyLogs.length} />
        <Stat label="경계" value={summary.surveyBoundaries.length} />
        <Stat label="유구 후보" value={summary.featureCandidates.length} />
        <Stat
          label="확인"
          value={summary.openIssues.length}
          warning={summary.openIssues.length > 0}
        />
      </View>
      <View style={styles.actionsRow}>
        <SummaryAction
          icon="event-note"
          label="오늘 일지"
          detail={actionTargets.dailyLog
            ? actionTargets.dailyLog.resource.identifier
            : actionTargets.primaryOperation ? '바로 작성' : '조사구역 필요'}
          isDisabled={
            !actionTargets.dailyLog
            && (!actionTargets.primaryOperation || !onAddDocumentOfCategory)
          }
          onPress={openDailyLog}
        />
        <SummaryAction
          icon="add-location-alt"
          label="유구 후보"
          detail={actionTargets.featureCandidate
            ? `${summary.featureCandidates.length}건`
            : actionTargets.featureDraftParent ? '후보 추가' : '조사구역 필요'}
          isDisabled={
            !actionTargets.featureCandidate
            && (!actionTargets.featureDraftParent || !onAddDocumentOfCategory)
          }
          onPress={openFeatureCandidate}
        />
        <SummaryAction
          icon="fact-check"
          label="마감 점검"
          detail={summary.openIssues.length > 0
            ? `${summary.openIssues.length}건 확인`
            : '문제 없음'}
          warning={summary.openIssues.length > 0}
          isDisabled={summary.openIssues.length === 0 || !actionTargets.issueDocument}
          onPress={() => openDocument(actionTargets.issueDocument)}
        />
      </View>
      <KoreanFieldworkWorkbenchPanel
        summary={summary}
        documents={documents}
        onEditDocument={onEditDocument}
      />
      <KoreanFieldworkPriorityTaskList
        tasks={priorityTasks}
        documentsById={documentsById}
        onAddDocumentOfCategory={onAddDocumentOfCategory}
        onOpenDocument={openDocument}
        onOpenMap={onOpenMap}
      />
      {summary.featureCandidates.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.candidates}
        >
          {summary.featureCandidates.slice(0, 8).map((document) => (
            <CandidateButton
              key={document.resource.id}
              document={document}
              issueCount={summary.issueCountByDocumentId[document.resource.id] ?? 0}
              onEditDocument={onEditDocument}
              onOpenDocument={onOpenDocument}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const Stat: React.FC<{ label: string; value: number; warning?: boolean }> = ({
  label,
  value,
  warning = false,
}) => (
  <View style={[styles.stat, warning && styles.warningStat]}>
    <Text style={[styles.statValue, warning && styles.warningText]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const CandidateButton: React.FC<{
  document: Document;
  issueCount: number;
  onEditDocument: (docId: string, categoryName: string) => void;
  onOpenDocument?: (document: Document) => void;
}> = ({ document, issueCount, onEditDocument, onOpenDocument }) => (
  <View style={styles.candidate}>
    <DocumentButton
      document={document}
      size={18}
      onPress={() => onOpenDocument
        ? onOpenDocument(document)
        : onEditDocument(document.resource.id, document.resource.category)}
    />
    {issueCount > 0 && (
      <Text style={styles.candidateWarning}>확인 {issueCount}</Text>
    )}
  </View>
);

const SummaryAction: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  detail: string;
  isDisabled: boolean;
  onPress: () => void;
  warning?: boolean;
}> = ({ icon, label, detail, isDisabled, onPress, warning = false }) => (
  <TouchableOpacity
    activeOpacity={0.86}
    disabled={isDisabled}
    onPress={onPress}
    style={[
      styles.summaryAction,
      warning && styles.summaryActionWarning,
      isDisabled && styles.summaryActionDisabled,
    ]}
  >
    <MaterialIcons
      name={icon}
      size={18}
      color={warning ? colors.danger : '#2f5f4a'}
    />
    <View style={styles.summaryActionText}>
      <Text style={styles.summaryActionLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.summaryActionDetail} numberOfLines={1}>{detail}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomColor: colors.lightgray,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  summaryAction: {
    alignItems: 'center',
    borderColor: colors.lightgray,
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 3,
    minHeight: 42,
    paddingHorizontal: 8,
  },
  summaryActionWarning: {
    backgroundColor: '#fff6f6',
    borderColor: '#f0b7bd',
  },
  summaryActionDisabled: {
    opacity: 0.48,
  },
  summaryActionText: {
    flex: 1,
    marginLeft: 6,
  },
  summaryActionLabel: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryActionDetail: {
    color: '#666',
    fontSize: 11,
    marginTop: 1,
  },
  stat: {
    alignItems: 'center',
    minWidth: 62,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  warningStat: {
    borderBottomColor: colors.danger,
    borderBottomWidth: 2,
  },
  statValue: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#555',
    fontSize: 12,
  },
  warningText: {
    color: colors.danger,
  },
  candidates: {
    alignItems: 'center',
    paddingTop: 8,
  },
  candidate: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 8,
  },
  candidateWarning: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default KoreanFieldworkTodayBoard;
