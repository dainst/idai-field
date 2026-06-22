import {
  Document,
  KoreanFieldworkTodaySummary,
} from 'idai-field-core';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '@/utils/colors';
import DocumentButton from '@/components/common/DocumentButton';

interface KoreanFieldworkTodayBoardProps {
  summary: KoreanFieldworkTodaySummary;
  onEditDocument: (docId: string, categoryName: string) => void;
}

const KoreanFieldworkTodayBoard: React.FC<KoreanFieldworkTodayBoardProps> = ({
  summary,
  onEditDocument,
}) => (
  <View style={styles.container} testID="koreanFieldworkTodayBoard">
    <View style={styles.statsRow}>
      <Stat label="일지" value={summary.dailyLogs.length} />
      <Stat label="경계" value={summary.surveyBoundaries.length} />
      <Stat label="유구 후보" value={summary.featureCandidates.length} />
      <Stat label="확인" value={summary.openIssues.length} warning={summary.openIssues.length > 0} />
    </View>
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
          />
        ))}
      </ScrollView>
    )}
  </View>
);

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
}> = ({ document, issueCount, onEditDocument }) => (
  <View style={styles.candidate}>
    <DocumentButton
      document={document}
      size={18}
      onPress={() => onEditDocument(document.resource.id, document.resource.category)}
    />
    {issueCount > 0 && (
      <Text style={styles.candidateWarning}>확인 {issueCount}</Text>
    )}
  </View>
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
