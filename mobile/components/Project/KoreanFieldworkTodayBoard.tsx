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
import {
  getKoreanFieldworkPriorityTasks,
  getKoreanFieldworkQuickActionStates,
  getKoreanFieldworkTodayActionTargets,
  KoreanFieldworkPriorityTaskAction,
} from './korean-fieldwork-today-actions';
import { KoreanFieldworkInvestigationModeId } from './korean-fieldwork-investigation-mode';

interface KoreanFieldworkTodayBoardProps {
  summary: KoreanFieldworkTodaySummary;
  documents?: Document[];
  onEditDocument: (docId: string, categoryName: string) => void;
  onAddDocumentOfCategory?: (parentDoc: Document, categoryName: string) => void;
  onOpenDocument?: (document: Document) => void;
  onOpenMap?: () => void;
  investigationModeId?: KoreanFieldworkInvestigationModeId;
}

const KoreanFieldworkTodayBoard: React.FC<KoreanFieldworkTodayBoardProps> = ({
  summary,
  documents = [],
  onEditDocument,
  onAddDocumentOfCategory,
  onOpenDocument,
  onOpenMap,
  investigationModeId,
}) => {
  const documentsById = useMemo(
    () => new Map(documents.map((document) => [document.resource.id, document])),
    [documents]
  );
  const actionTargets = useMemo(
    () => getKoreanFieldworkTodayActionTargets(
      summary,
      documents,
      investigationModeId
    ),
    [documents, investigationModeId, summary]
  );
  const quickActions = useMemo(
    () => getKoreanFieldworkQuickActionStates(
      summary,
      actionTargets,
      undefined,
      investigationModeId
    ),
    [actionTargets, investigationModeId, summary]
  );
  const priorityTasks = useMemo(
    () => getKoreanFieldworkPriorityTasks(
      summary,
      documents,
      4,
      investigationModeId
    ),
    [documents, investigationModeId, summary]
  );
  const featureStatLabel = investigationModeId === 'trialTrench'
    ? '확인 유구'
    : '검출 유구';

  const openDocument = (document: Document | undefined) => {
    if (!document) return;
    if (onOpenDocument) {
      onOpenDocument(document);
      return;
    }

    onEditDocument(document.resource.id, document.resource.category);
  };
  const runQuickAction = (action?: KoreanFieldworkPriorityTaskAction) => {
    if (!action) return;

    switch (action.type) {
      case 'openDocument': {
        openDocument(documentsById.get(action.documentId));
        return;
      }
      case 'createDocument': {
        const parentDocument = documentsById.get(action.parentDocumentId);
        if (parentDocument && onAddDocumentOfCategory) {
          onAddDocumentOfCategory(parentDocument, action.categoryName);
        }
        return;
      }
      case 'openMap':
        if (onOpenMap) onOpenMap();
    }
  };
  const isQuickActionDisabled = (
    action: KoreanFieldworkPriorityTaskAction | undefined,
    disabled: boolean | undefined
  ): boolean =>
    !!disabled
    || (action?.type === 'createDocument' && !onAddDocumentOfCategory)
    || (action?.type === 'openMap' && !onOpenMap);

  return (
    <View style={styles.container} testID="koreanFieldworkTodayBoard">
      <View style={styles.statsRow}>
        <Stat label="일지" value={summary.dailyLogs.length} />
        <Stat label="경계" value={summary.surveyBoundaries.length} />
        <Stat label={featureStatLabel} value={summary.featureCandidates.length} />
        <Stat
          label="확인"
          value={summary.openIssues.length}
          warning={summary.openIssues.length > 0}
        />
      </View>
      <View style={styles.actionsRow}>
        <SummaryAction
          icon={quickActions.dailyLog.icon}
          label={quickActions.dailyLog.label}
          detail={quickActions.dailyLog.detail}
          isDisabled={isQuickActionDisabled(
            quickActions.dailyLog.action,
            quickActions.dailyLog.disabled
          )}
          onPress={() => runQuickAction(quickActions.dailyLog.action)}
        />
        <SummaryAction
          icon={quickActions.featureCandidate.icon}
          label={quickActions.featureCandidate.label}
          detail={quickActions.featureCandidate.detail}
          isDisabled={isQuickActionDisabled(
            quickActions.featureCandidate.action,
            quickActions.featureCandidate.disabled
          )}
          onPress={() => runQuickAction(quickActions.featureCandidate.action)}
        />
        <SummaryAction
          icon={quickActions.closeout.icon}
          label={quickActions.closeout.label}
          detail={quickActions.closeout.detail}
          warning={quickActions.closeout.warning}
          isDisabled={isQuickActionDisabled(
            quickActions.closeout.action,
            quickActions.closeout.disabled
          )}
          onPress={() => runQuickAction(quickActions.closeout.action)}
        />
      </View>
      <KoreanFieldworkWorkbenchPanel
        summary={summary}
        documents={documents}
        investigationModeId={investigationModeId}
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
