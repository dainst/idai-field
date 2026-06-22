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
import { colors } from '@/utils/colors';
import {
  getKoreanFieldworkRecordActionSummary,
  KoreanFieldworkRecordActionItem,
} from './korean-fieldwork-record-actions';
import { KoreanFieldworkStatusTone } from './korean-fieldwork-record-summary';

interface KoreanFieldworkRecordActionPanelProps {
  document: Document;
  documents: Document[];
  allowedAddCategoryNames?: string[];
  onAddDocumentOfCategory: (parentDoc: Document, categoryName: string) => void;
  onOpenDocument: (document: Document) => void;
}

const KoreanFieldworkRecordActionPanel: React.FC<KoreanFieldworkRecordActionPanelProps> = ({
  document,
  documents,
  allowedAddCategoryNames = [],
  onAddDocumentOfCategory,
  onOpenDocument,
}) => {
  const summary = useMemo(
    () => getKoreanFieldworkRecordActionSummary(
      document,
      documents,
      allowedAddCategoryNames
    ),
    [allowedAddCategoryNames, document, documents]
  );

  if (!summary.isTracked && summary.actions.length === 0) return null;

  const runAction = (action: KoreanFieldworkRecordActionItem) => {
    if (action.type === 'openDocument' && action.document) {
      onOpenDocument(action.document);
      return;
    }

    if (action.type === 'createDocument' && action.categoryName) {
      onAddDocumentOfCategory(document, action.categoryName);
    }
  };

  return (
    <View style={styles.container} testID="koreanFieldworkRecordActionPanel">
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="dashboard-customize" size={18} color="#344054" />
          <Text style={styles.title}>현장 작업</Text>
        </View>
        <Text style={[styles.percentPill, percentToneStyle(summary.tone)]}>
          {summary.completionPercent}%
        </Text>
      </View>

      <Text style={styles.contextLine} numberOfLines={1}>
        {summary.categoryLabel}
        {summary.parentPath ? ` · ${summary.parentPath}` : ''}
      </Text>

      <View style={styles.metricRow}>
        <Metric label="하위" value={summary.structureCount} />
        <Metric label="증거" value={summary.evidenceCount} />
        <Metric label="확인" value={summary.issueCount} warning={summary.issueCount > 0} />
        {summary.checklistTotal > 0 && (
          <Metric
            label="과정"
            value={`${summary.checklistDone}/${summary.checklistTotal}`}
            warning={summary.checklistDone < summary.checklistTotal}
          />
        )}
      </View>

      {summary.actions.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionRow}
        >
          {summary.actions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              onPress={() => runAction(action)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyAction}>
          <MaterialIcons name="check-circle-outline" size={17} color="#027a48" />
          <Text style={styles.emptyActionText}>
            현재 기록에서 바로 이어갈 필수 작업은 없습니다.
          </Text>
        </View>
      )}
    </View>
  );
};

const Metric: React.FC<{
  label: string;
  value: number | string;
  warning?: boolean;
}> = ({ label, value, warning = false }) => (
  <View style={[styles.metric, warning && styles.metricWarning]}>
    <Text style={[styles.metricValue, warning && styles.metricValueWarning]}>
      {value}
    </Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const ActionButton: React.FC<{
  action: KoreanFieldworkRecordActionItem;
  onPress: () => void;
}> = ({ action, onPress }) => (
  <TouchableOpacity
    accessibilityLabel={action.label}
    activeOpacity={0.86}
    onPress={onPress}
    style={[styles.actionButton, actionToneStyle(action.tone)]}
    testID={`recordAction_${action.id}`}
  >
    <View style={[styles.actionIcon, actionIconToneStyle(action.tone)]}>
      <MaterialIcons
        name={action.icon as keyof typeof MaterialIcons.glyphMap}
        size={18}
        color={actionIconColor(action.tone)}
      />
    </View>
    <View style={styles.actionTextWrap}>
      <Text style={styles.actionLabel} numberOfLines={1}>
        {action.label}
      </Text>
      <Text style={styles.actionDetail} numberOfLines={2}>
        {action.detail}
      </Text>
    </View>
    <MaterialIcons name="chevron-right" size={18} color="#667085" />
  </TouchableOpacity>
);

const percentToneStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.percentDanger;
    case 'warning':
      return styles.percentWarning;
    case 'success':
      return styles.percentSuccess;
    case 'info':
      return styles.percentInfo;
    default:
      return styles.percentNeutral;
  }
};

const actionToneStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.actionDanger;
    case 'warning':
      return styles.actionWarning;
    case 'success':
      return styles.actionSuccess;
    case 'info':
      return styles.actionInfo;
    default:
      return styles.actionNeutral;
  }
};

const actionIconToneStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.actionIconDanger;
    case 'warning':
      return styles.actionIconWarning;
    case 'success':
      return styles.actionIconSuccess;
    case 'info':
      return styles.actionIconInfo;
    default:
      return styles.actionIconNeutral;
  }
};

const actionIconColor = (tone: KoreanFieldworkStatusTone): string => {
  switch (tone) {
    case 'danger':
      return colors.danger;
    case 'warning':
      return '#b54708';
    case 'success':
      return '#027a48';
    case 'info':
      return '#175cd3';
    default:
      return '#475467';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 5,
  },
  percentPill: {
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  percentNeutral: {
    backgroundColor: '#eef2f6',
    color: '#475467',
  },
  percentInfo: {
    backgroundColor: '#eff8ff',
    color: '#175cd3',
  },
  percentSuccess: {
    backgroundColor: '#ecfdf3',
    color: '#027a48',
  },
  percentWarning: {
    backgroundColor: '#fffaeb',
    color: '#b54708',
  },
  percentDanger: {
    backgroundColor: '#fff1f3',
    color: colors.danger,
  },
  contextLine: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  metric: {
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 5,
    borderWidth: 1,
    marginRight: 6,
    minWidth: 58,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  metricWarning: {
    backgroundColor: '#fffaeb',
    borderColor: '#fedf89',
  },
  metricValue: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '900',
  },
  metricValueWarning: {
    color: '#b54708',
  },
  metricLabel: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1,
  },
  actionRow: {
    paddingTop: 9,
    paddingRight: 8,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 8,
    minHeight: 58,
    paddingHorizontal: 9,
    paddingVertical: 8,
    width: 244,
  },
  actionNeutral: {
    borderColor: '#d0d5dd',
  },
  actionInfo: {
    borderColor: '#b2ddff',
  },
  actionSuccess: {
    borderColor: '#abefc6',
  },
  actionWarning: {
    borderColor: '#fedf89',
  },
  actionDanger: {
    borderColor: '#fecdca',
  },
  actionIcon: {
    alignItems: 'center',
    borderRadius: 5,
    height: 34,
    justifyContent: 'center',
    marginRight: 8,
    width: 34,
  },
  actionIconNeutral: {
    backgroundColor: '#eef2f6',
  },
  actionIconInfo: {
    backgroundColor: '#eff8ff',
  },
  actionIconSuccess: {
    backgroundColor: '#ecfdf3',
  },
  actionIconWarning: {
    backgroundColor: '#fffaeb',
  },
  actionIconDanger: {
    backgroundColor: '#fff1f3',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionLabel: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
  },
  actionDetail: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    marginTop: 3,
  },
  emptyAction: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 9,
  },
  emptyActionText: {
    color: '#027a48',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 5,
  },
});

export default KoreanFieldworkRecordActionPanel;
