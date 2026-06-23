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
  getKoreanFieldworkWorkbenchItems,
  KoreanFieldworkWorkbenchItem,
} from './korean-fieldwork-workbench';
import {
  getKoreanFieldworkRecordActionSummary,
  KoreanFieldworkRecordActionItem,
} from './korean-fieldwork-record-actions';
import { KoreanFieldworkStatusTone } from './korean-fieldwork-record-summary';
import { KoreanFieldworkInvestigationModeId } from './korean-fieldwork-investigation-mode';

interface KoreanFieldworkWorkbenchPanelProps {
  summary: KoreanFieldworkTodaySummary;
  documents: Document[];
  investigationModeId?: KoreanFieldworkInvestigationModeId;
  onEditDocument: (docId: string, categoryName: string) => void;
  onAddDocumentOfCategory?: (parentDoc: Document, categoryName: string) => void;
  getAllowedAddCategoryNames?: (document: Document) => string[];
  maxItems?: number;
}

const KoreanFieldworkWorkbenchPanel: React.FC<KoreanFieldworkWorkbenchPanelProps> = ({
  summary,
  documents,
  investigationModeId,
  onEditDocument,
  onAddDocumentOfCategory,
  getAllowedAddCategoryNames,
  maxItems = 8,
}) => {
  const items = useMemo(
    () => getKoreanFieldworkWorkbenchItems(summary, documents, maxItems),
    [documents, maxItems, summary]
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.container} testID="koreanFieldworkWorkbenchPanel">
      <View style={styles.titleRow}>
        <MaterialIcons name="dashboard-customize" size={18} color="#175cd3" />
        <Text style={styles.title}>현장 작업대</Text>
        <Text style={styles.count}>{items.length}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.itemRow}
      >
        {items.map((item) => (
          <WorkbenchCard
            key={item.id}
            actions={getKoreanFieldworkRecordActionSummary(
              item.document,
              documents,
              getAllowedAddCategoryNames?.(item.document) ?? [],
              investigationModeId
            ).actions.slice(0, 2)}
            item={item}
            onActionPress={(action) => {
              if (action.type === 'openDocument' && action.document) {
                onEditDocument(
                  action.document.resource.id,
                  action.document.resource.category
                );
                return;
              }

              if (
                action.type === 'createDocument'
                && action.categoryName
                && onAddDocumentOfCategory
              ) {
                onAddDocumentOfCategory(item.document, action.categoryName);
              }
            }}
            onPress={() => onEditDocument(
              item.document.resource.id,
              item.document.resource.category
            )}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const WorkbenchCard: React.FC<{
  item: KoreanFieldworkWorkbenchItem;
  actions: KoreanFieldworkRecordActionItem[];
  onActionPress: (action: KoreanFieldworkRecordActionItem) => void;
  onPress: () => void;
}> = ({
  item,
  actions,
  onActionPress,
  onPress,
}) => (
  <TouchableOpacity
    activeOpacity={0.86}
    onPress={onPress}
    style={[styles.card, toneCardStyle(item.tone)]}
    testID={`workbenchItem_${item.id}`}
  >
    <View style={styles.cardHeader}>
      <Text style={styles.categoryLabel} numberOfLines={1}>
        {item.categoryLabel}
      </Text>
      <MaterialIcons name="edit-note" size={16} color={toneIconColor(item.tone)} />
    </View>
    <Text style={styles.cardTitle} numberOfLines={1}>
      {item.title}
    </Text>
    {!!item.parentPath && (
      <Text style={styles.parentPath} numberOfLines={1}>
        {item.parentPath}
      </Text>
    )}
    <View style={styles.reasonRow}>
      {item.reasons.map((reason) => (
        <Text key={reason} style={[styles.reasonChip, toneReasonStyle(item.tone)]}>
          {reason}
        </Text>
      ))}
    </View>
    {item.statusChips.length > 0 && (
      <View style={styles.statusRow}>
        {item.statusChips.slice(0, 3).map((chip) => (
          <Text
            key={chip.label}
            style={[styles.statusChip, statusChipStyle(chip.tone)]}
            numberOfLines={1}
          >
            {chip.label}
          </Text>
        ))}
      </View>
    )}
    <View style={styles.actionRow}>
      <WorkbenchAction
        icon="open-in-new"
        label="열기"
        onPress={(event) => {
          event?.stopPropagation?.();
          onPress();
        }}
        testID={`workbenchOpen_${item.id}`}
        tone={item.tone}
      />
      {actions.map((action) => (
        <WorkbenchAction
          key={action.id}
          icon={action.icon as keyof typeof MaterialIcons.glyphMap}
          label={action.label}
          onPress={(event) => {
            event?.stopPropagation?.();
            onActionPress(action);
          }}
          testID={`workbenchAction_${item.id}_${action.id}`}
          tone={action.tone}
        />
      ))}
    </View>
  </TouchableOpacity>
);

const WorkbenchAction: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: (event?: GestureResponderEvent) => void;
  testID: string;
  tone: KoreanFieldworkStatusTone;
}> = ({
  icon,
  label,
  onPress,
  testID,
  tone,
}) => (
  <TouchableOpacity
    accessibilityLabel={label}
    activeOpacity={0.84}
    onPress={onPress}
    style={[styles.actionButton, actionButtonToneStyle(tone)]}
    testID={testID}
  >
    <MaterialIcons name={icon} size={14} color={toneIconColor(tone)} />
    <Text
      style={[styles.actionLabel, actionLabelToneStyle(tone)]}
      numberOfLines={1}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const toneCardStyle = (tone: KoreanFieldworkStatusTone) => {
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

const toneReasonStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.reasonDanger;
    case 'warning':
      return styles.reasonWarning;
    case 'info':
      return styles.reasonInfo;
    case 'success':
      return styles.reasonSuccess;
    default:
      return styles.reasonNeutral;
  }
};

const toneIconColor = (tone: KoreanFieldworkStatusTone): string => {
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

const statusChipStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.statusDanger;
    case 'warning':
      return styles.statusWarning;
    case 'info':
      return styles.statusInfo;
    case 'success':
      return styles.statusSuccess;
    default:
      return styles.statusNeutral;
  }
};

const actionButtonToneStyle = (tone: KoreanFieldworkStatusTone) => {
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

const actionLabelToneStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.actionLabelDanger;
    case 'warning':
      return styles.actionLabelWarning;
    case 'info':
      return styles.actionLabelInfo;
    case 'success':
      return styles.actionLabelSuccess;
    default:
      return styles.actionLabelNeutral;
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5fbff',
    borderColor: '#b9d9ea',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 7,
  },
  title: {
    color: '#175cd3',
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
  itemRow: {
    paddingRight: 6,
  },
  card: {
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 166,
    padding: 9,
    width: 214,
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
  cardTitle: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 5,
  },
  parentPath: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 7,
  },
  reasonChip: {
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '900',
    marginRight: 4,
    marginTop: 4,
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  reasonNeutral: {
    backgroundColor: '#eef2f6',
    color: '#475467',
  },
  reasonInfo: {
    backgroundColor: '#eff8ff',
    color: '#175cd3',
  },
  reasonSuccess: {
    backgroundColor: '#ecfdf3',
    color: '#027a48',
  },
  reasonWarning: {
    backgroundColor: '#fffaeb',
    color: '#b54708',
  },
  reasonDanger: {
    backgroundColor: '#fff1f3',
    color: colors.danger,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  statusChip: {
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '800',
    marginRight: 4,
    marginTop: 4,
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  statusNeutral: {
    backgroundColor: '#f2f4f7',
    color: '#475467',
  },
  statusInfo: {
    backgroundColor: '#eff8ff',
    color: '#175cd3',
  },
  statusSuccess: {
    backgroundColor: '#ecfdf3',
    color: '#027a48',
  },
  statusWarning: {
    backgroundColor: '#fffaeb',
    color: '#b54708',
  },
  statusDanger: {
    backgroundColor: '#fff1f3',
    color: colors.danger,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 7,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 5,
    marginTop: 5,
    minHeight: 30,
    maxWidth: 112,
    paddingHorizontal: 6,
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
  actionLabel: {
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 3,
  },
  actionLabelNeutral: {
    color: '#475467',
  },
  actionLabelInfo: {
    color: '#175cd3',
  },
  actionLabelSuccess: {
    color: '#027a48',
  },
  actionLabelWarning: {
    color: '#b54708',
  },
  actionLabelDanger: {
    color: colors.danger,
  },
});

export default KoreanFieldworkWorkbenchPanel;
