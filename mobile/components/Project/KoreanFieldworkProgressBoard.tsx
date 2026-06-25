import { MaterialIcons } from '@expo/vector-icons';
import {
  Document,
  KoreanFieldworkTodaySummary,
} from 'idai-field-core';
import React, { useMemo } from 'react';
import {
  GestureResponderEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/utils/colors';
import {
  getKoreanFieldworkProgressItems,
  KoreanFieldworkProgressAction,
  KoreanFieldworkProgressItem,
  KOREAN_FIELDWORK_PROGRESS_STAGES,
} from './korean-fieldwork-progress';
import { KoreanFieldworkStatusTone } from './korean-fieldwork-record-summary';
import { KoreanFieldworkInvestigationModeId } from './korean-fieldwork-investigation-mode';

interface KoreanFieldworkProgressBoardProps {
  summary: KoreanFieldworkTodaySummary;
  documents: Document[];
  onAddDocumentOfCategory?: (parentDoc: Document, categoryName: string) => void;
  onOpenDocument: (document: Document) => void;
  onOpenMap?: () => void;
  maxItems?: number;
  investigationModeId?: KoreanFieldworkInvestigationModeId;
}

const KoreanFieldworkProgressBoard: React.FC<KoreanFieldworkProgressBoardProps> = ({
  summary,
  documents,
  onAddDocumentOfCategory,
  onOpenDocument,
  onOpenMap,
  maxItems = 8,
  investigationModeId,
}) => {
  const documentsById = useMemo(
    () => new Map(documents.map((document) => [document.resource.id, document])),
    [documents]
  );
  const items = useMemo(
    () => getKoreanFieldworkProgressItems(
      summary,
      documents,
      maxItems,
      investigationModeId
    ),
    [documents, investigationModeId, maxItems, summary]
  );

  if (items.length === 0) return null;

  const runAction = (action: KoreanFieldworkProgressAction) => {
    switch (action.type) {
      case 'openDocument': {
        const document = documentsById.get(action.documentId);
        if (document) onOpenDocument(document);
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
        onOpenMap?.();
        return;
    }
  };

  const isActionDisabled = (action: KoreanFieldworkProgressAction): boolean => {
    switch (action.type) {
      case 'openDocument':
        return !documentsById.has(action.documentId);
      case 'createDocument':
        return !onAddDocumentOfCategory
          || !documentsById.has(action.parentDocumentId);
      case 'openMap':
        return !onOpenMap;
    }
  };

  return (
    <View style={styles.container} testID="koreanFieldworkProgressBoard">
      <View style={styles.titleRow}>
        <MaterialIcons name="timeline" size={18} color="#2f5f4a" />
        <Text style={styles.title}>현장 진행표</Text>
        <Text style={styles.count}>{items.length}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardRow}
      >
        {items.map((item) => (
          <ProgressCard
            key={item.id}
            item={item}
            isActionDisabled={isActionDisabled(item.action)}
            onOpen={() => onOpenDocument(item.document)}
            onRunAction={(event) => {
              event?.stopPropagation?.();
              runAction(item.action);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const ProgressCard: React.FC<{
  item: KoreanFieldworkProgressItem;
  isActionDisabled: boolean;
  onOpen: () => void;
  onRunAction: (event?: GestureResponderEvent) => void;
}> = ({
  item,
  isActionDisabled,
  onOpen,
  onRunAction,
}) => (
  <TouchableOpacity
    activeOpacity={0.88}
    onPress={onOpen}
    style={[styles.card, cardToneStyle(item.tone)]}
    testID={`progressItem_${item.id}`}
  >
    <View style={styles.cardHeader}>
      <Text style={styles.categoryLabel} numberOfLines={1}>
        {item.categoryLabel}
      </Text>
      <Text style={[styles.stagePill, stageToneStyle(item.tone)]}>
        {item.stageLabel}
      </Text>
    </View>
    <Text style={styles.cardTitle} numberOfLines={1}>
      {item.title}
    </Text>
    {!!item.parentPath && (
      <Text style={styles.parentPath} numberOfLines={1}>
        {item.parentPath}
      </Text>
    )}
    <ProgressSteps activeIndex={item.stageIndex} tone={item.tone} />
    <Text style={styles.detail} numberOfLines={2}>
      {item.detail}
    </Text>
    <View style={styles.metricRow}>
      <Metric label="이어진 기록" value={item.metrics.hierarchyCount} />
      <Metric label="자료" value={item.metrics.evidenceCount} />
      <Metric
        label="확인"
        value={item.metrics.issueCount}
        warning={item.metrics.issueCount > 0}
      />
      {item.metrics.checklistTotal > 0 && (
        <Metric
          label="과정"
          value={`${item.metrics.checklistDone}/${item.metrics.checklistTotal}`}
        />
      )}
    </View>
    <TouchableOpacity
      activeOpacity={0.84}
      disabled={isActionDisabled}
      onPress={onRunAction}
      style={[
        styles.actionButton,
        actionToneStyle(item.tone),
        isActionDisabled && styles.actionButtonDisabled,
      ]}
      testID={`progressAction_${item.id}`}
    >
      <Text style={[styles.actionText, actionTextToneStyle(item.tone)]}>
        {item.actionLabel}
      </Text>
      {!isActionDisabled && (
        <MaterialIcons
          name="chevron-right"
          size={16}
          color={actionTextColor(item.tone)}
        />
      )}
    </TouchableOpacity>
  </TouchableOpacity>
);

const ProgressSteps: React.FC<{
  activeIndex: number;
  tone: KoreanFieldworkStatusTone;
}> = ({ activeIndex, tone }) => (
  <View style={styles.progressRow}>
    {KOREAN_FIELDWORK_PROGRESS_STAGES.map((stage, index) => (
      <View
        key={stage.id}
        style={[
          styles.progressStep,
          index < activeIndex && styles.progressStepDone,
          index === activeIndex && progressStepActiveToneStyle(tone),
        ]}
      />
    ))}
  </View>
);

const Metric: React.FC<{
  label: string;
  value: number | string;
  warning?: boolean;
}> = ({ label, value, warning = false }) => (
  <View style={[styles.metric, warning && styles.metricWarning]}>
    <Text style={[styles.metricValue, warning && styles.warningText]}>
      {value}
    </Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const cardToneStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.cardDanger;
    case 'warning':
      return styles.cardWarning;
    case 'info':
      return styles.cardInfo;
    case 'success':
      return styles.cardSuccess;
    default:
      return styles.cardNeutral;
  }
};

const stageToneStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.stageDanger;
    case 'warning':
      return styles.stageWarning;
    case 'info':
      return styles.stageInfo;
    case 'success':
      return styles.stageSuccess;
    default:
      return styles.stageNeutral;
  }
};

const progressStepActiveToneStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.progressStepDanger;
    case 'warning':
      return styles.progressStepWarning;
    case 'info':
      return styles.progressStepInfo;
    case 'success':
      return styles.progressStepSuccess;
    default:
      return styles.progressStepNeutral;
  }
};

const actionToneStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.actionDanger;
    case 'warning':
      return styles.actionWarning;
    case 'info':
      return styles.actionInfo;
    case 'success':
      return styles.actionSuccess;
    default:
      return styles.actionNeutral;
  }
};

const actionTextToneStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.actionTextDanger;
    case 'warning':
      return styles.actionTextWarning;
    case 'info':
      return styles.actionTextInfo;
    case 'success':
      return styles.actionTextSuccess;
    default:
      return styles.actionTextNeutral;
  }
};

const actionTextColor = (tone: KoreanFieldworkStatusTone): string => {
  switch (tone) {
    case 'danger':
      return colors.danger;
    case 'warning':
      return '#b54708';
    case 'info':
      return '#175cd3';
    case 'success':
      return '#027a48';
    default:
      return '#475467';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f6fef9',
    borderColor: '#abefc6',
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 7,
  },
  title: {
    color: '#2f5f4a',
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 5,
  },
  count: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '900',
  },
  cardRow: {
    paddingRight: 6,
  },
  card: {
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 190,
    padding: 9,
    width: 236,
  },
  cardNeutral: {
    borderColor: '#d0d5dd',
  },
  cardInfo: {
    borderColor: '#b2ddff',
  },
  cardSuccess: {
    borderColor: '#abefc6',
  },
  cardWarning: {
    borderColor: '#fedf89',
  },
  cardDanger: {
    borderColor: '#fecdca',
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  categoryLabel: {
    color: '#475467',
    flex: 1,
    fontSize: 11,
    fontWeight: '900',
  },
  stagePill: {
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  stageNeutral: {
    backgroundColor: '#eef2f6',
    color: '#475467',
  },
  stageInfo: {
    backgroundColor: '#eff8ff',
    color: '#175cd3',
  },
  stageSuccess: {
    backgroundColor: '#ecfdf3',
    color: '#027a48',
  },
  stageWarning: {
    backgroundColor: '#fffaeb',
    color: '#b54708',
  },
  stageDanger: {
    backgroundColor: '#fff1f3',
    color: colors.danger,
  },
  cardTitle: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 6,
  },
  parentPath: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  progressRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  progressStep: {
    backgroundColor: '#eaecf0',
    borderRadius: 2,
    flex: 1,
    height: 5,
    marginRight: 3,
  },
  progressStepDone: {
    backgroundColor: '#98a2b3',
  },
  progressStepNeutral: {
    backgroundColor: '#667085',
  },
  progressStepInfo: {
    backgroundColor: '#1570ef',
  },
  progressStepSuccess: {
    backgroundColor: '#12b76a',
  },
  progressStepWarning: {
    backgroundColor: '#f79009',
  },
  progressStepDanger: {
    backgroundColor: colors.danger,
  },
  detail: {
    color: '#344054',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    minHeight: 34,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
    marginTop: 7,
  },
  metric: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#eaecf0',
    borderRadius: 5,
    borderWidth: 1,
    marginHorizontal: 2,
    minWidth: 44,
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  metricWarning: {
    backgroundColor: '#fff1f3',
    borderColor: '#fecdca',
  },
  metricValue: {
    color: '#344054',
    fontSize: 12,
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
  actionButton: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 9,
    minHeight: 34,
    paddingHorizontal: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionNeutral: {
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
  },
  actionInfo: {
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
  },
  actionSuccess: {
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
  },
  actionWarning: {
    backgroundColor: '#fffaeb',
    borderColor: '#fedf89',
  },
  actionDanger: {
    backgroundColor: '#fff1f3',
    borderColor: '#fecdca',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '900',
  },
  actionTextNeutral: {
    color: '#475467',
  },
  actionTextInfo: {
    color: '#175cd3',
  },
  actionTextSuccess: {
    color: '#027a48',
  },
  actionTextWarning: {
    color: '#b54708',
  },
  actionTextDanger: {
    color: colors.danger,
  },
});

export default KoreanFieldworkProgressBoard;
