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

interface KoreanFieldworkTodayBoardProps {
  summary: KoreanFieldworkTodaySummary;
  documents?: Document[];
  onEditDocument: (docId: string, categoryName: string) => void;
  onOpenDocument?: (document: Document) => void;
}

const KoreanFieldworkTodayBoard: React.FC<KoreanFieldworkTodayBoardProps> = ({
  summary,
  documents = [],
  onEditDocument,
  onOpenDocument,
}) => {
  const [dailyLog] = summary.dailyLogs;
  const [featureCandidate] = summary.featureCandidates;
  const issueDocument = useMemo(() => {
    const documentsById = new Map(documents.map((document) => [
      document.resource.id,
      document,
    ]));

    return summary.openIssues
      .map((issue) => documentsById.get(issue.documentId))
      .find((document): document is Document => !!document);
  }, [documents, summary.openIssues]);

  const openDocument = (document: Document | undefined) => {
    if (!document) return;
    onOpenDocument
      ? onOpenDocument(document)
      : onEditDocument(document.resource.id, document.resource.category);
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
          detail={dailyLog ? dailyLog.resource.identifier : '아직 없음'}
          isDisabled={!dailyLog}
          onPress={() => openDocument(dailyLog)}
        />
        <SummaryAction
          icon="add-location-alt"
          label="유구 후보"
          detail={featureCandidate
            ? `${summary.featureCandidates.length}건`
            : 'GPS로 생성'}
          isDisabled={!featureCandidate}
          onPress={() => openDocument(featureCandidate)}
        />
        <SummaryAction
          icon="fact-check"
          label="마감 점검"
          detail={summary.openIssues.length > 0
            ? `${summary.openIssues.length}건 확인`
            : '문제 없음'}
          warning={summary.openIssues.length > 0}
          isDisabled={summary.openIssues.length === 0 || !issueDocument}
          onPress={() => openDocument(issueDocument)}
        />
      </View>
      {summary.openIssues.length > 0 && (
        <View style={styles.warningPanel}>
          <Text style={styles.warningTitle}>현장 마감 전 확인</Text>
          {summary.openIssues.slice(0, 2).map((issue) => (
            <Text
              key={`${issue.documentId}-${issue.ruleId}`}
              style={styles.warningMessage}
              numberOfLines={2}
            >
              {issue.identifier}: {issue.recommendedAction}
            </Text>
          ))}
        </View>
      )}
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
  warningPanel: {
    backgroundColor: '#fff6f6',
    borderLeftColor: colors.danger,
    borderLeftWidth: 3,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  warningTitle: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },
  warningMessage: {
    color: '#5f2525',
    fontSize: 11,
    marginTop: 2,
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
