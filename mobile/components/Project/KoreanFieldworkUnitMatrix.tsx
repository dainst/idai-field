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
  getKoreanFieldworkFeatureOverviewItems,
  getKoreanFieldworkUnitMatrixItems,
  KoreanFieldworkFeatureOverviewItem,
  KoreanFieldworkUnitMatrixItem,
} from './korean-fieldwork-unit-matrix';
import { KoreanFieldworkStatusTone } from './korean-fieldwork-record-summary';
import { KoreanFieldworkInvestigationModeId } from './korean-fieldwork-investigation-mode';

interface KoreanFieldworkUnitMatrixProps {
  summary: KoreanFieldworkTodaySummary;
  documents: Document[];
  scopeParent?: Document;
  onOpenDocument: (document: Document) => void;
  onAddDocumentOfCategory: (parentDoc: Document, categoryName: string) => void;
  maxItems?: number;
  investigationModeId?: KoreanFieldworkInvestigationModeId;
}

const KoreanFieldworkUnitMatrix: React.FC<KoreanFieldworkUnitMatrixProps> = ({
  summary,
  documents,
  scopeParent,
  onOpenDocument,
  onAddDocumentOfCategory,
  maxItems = 14,
  investigationModeId,
}) => {
  const items = useMemo(
    () => getKoreanFieldworkUnitMatrixItems(
      summary,
      documents,
      scopeParent,
      maxItems,
      investigationModeId
    ),
    [documents, investigationModeId, maxItems, scopeParent, summary]
  );
  const featureOverviewItems = useMemo(
    () => getKoreanFieldworkFeatureOverviewItems(
      summary,
      documents,
      scopeParent,
      80,
      investigationModeId
    ),
    [documents, investigationModeId, scopeParent, summary]
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.container} testID="koreanFieldworkUnitMatrix">
      {featureOverviewItems.length > 0 && (
        <FeatureOverviewTable
          items={featureOverviewItems}
          onOpenDocument={onOpenDocument}
        />
      )}

      <View style={styles.titleRow}>
        <MaterialIcons name="table-chart" size={18} color="#344054" />
        <Text style={styles.title}>자료 진행표</Text>
        <Text style={styles.count}>{items.length}</Text>
      </View>
      <Text style={styles.subtitle} numberOfLines={1}>
        {scopeParent
          ? `${scopeParent.resource.identifier || scopeParent.resource.id} 범위`
          : '전체 범위'}의 다음 기록과 관련 자료를 비교합니다.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tableScroll}
      >
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <HeaderCell label="단위" style={styles.unitColumn} />
            <HeaderCell label="진행" style={styles.progressColumn} />
            <HeaderCell label="자료" style={styles.evidenceColumn} />
            <HeaderCell label="동작" style={styles.actionColumn} />
            <HeaderCell label="보완" style={styles.issueColumn} />
          </View>
          {items.map((item) => (
            <UnitRow
              key={item.id}
              item={item}
              onOpenDocument={onOpenDocument}
              onAddDocumentOfCategory={onAddDocumentOfCategory}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const FeatureOverviewTable: React.FC<{
  items: KoreanFieldworkFeatureOverviewItem[];
  onOpenDocument: (document: Document) => void;
}> = ({
  items,
  onOpenDocument,
}) => (
  <View style={styles.featureOverview}>
    <View style={styles.titleRow}>
      <MaterialIcons name="view-list" size={18} color="#344054" />
      <Text style={styles.title}>전체 유구 현황</Text>
      <Text style={styles.count}>{items.length}</Text>
    </View>

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tableScroll}
    >
      <View style={styles.featureTable}>
        <View style={styles.headerRow}>
          <HeaderCell label="유구" style={styles.featureNameColumn} />
          <HeaderCell label="상태" style={styles.featureStatusColumn} />
          <HeaderCell label="근거" style={styles.featureEvidenceColumn} />
          <HeaderCell label="보완" style={styles.featureIssueColumn} />
          <HeaderCell label="다음" style={styles.featureNextColumn} />
          <HeaderCell label="열기" style={styles.featureActionColumn} />
        </View>
        {items.map((item) => (
          <View
            key={item.id}
            style={[styles.featureRow, rowToneStyle(item.tone)]}
            testID={`featureOverviewRow_${item.id}`}
          >
            <View style={styles.featureNameColumn}>
              <Text style={styles.unitTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {!!item.parentPath && (
                <Text style={styles.parentPath} numberOfLines={1}>
                  {item.parentPath}
                </Text>
              )}
            </View>
            <View style={styles.featureStatusColumn}>
              <Text style={[styles.statusChip, statusChipStyle(item.tone)]} numberOfLines={1}>
                {item.statusLabel}
              </Text>
              <Text style={styles.progressText}>{item.completionPercent}%</Text>
            </View>
            <View style={styles.featureEvidenceColumn}>
              <Text
                style={item.evidenceCount > 0 ? styles.featureEvidenceText : styles.emptyEvidence}
                numberOfLines={2}
              >
                {item.evidenceLabel}
              </Text>
            </View>
            <View style={styles.featureIssueColumn}>
              <Text
                style={[
                  styles.issueValue,
                  item.issueCount > 0 && styles.issueValueWarning,
                  item.hasCriticalIssue && styles.issueValueDanger,
                ]}
              >
                {item.issueCount}
              </Text>
            </View>
            <View style={styles.featureNextColumn}>
              <Text style={styles.featureNextText} numberOfLines={2}>
                {item.nextActionLabel}
              </Text>
            </View>
            <View style={styles.featureActionColumn}>
              <UnitAction
                icon="open-in-new"
                label="열기"
                onPress={(event) => {
                  event?.stopPropagation?.();
                  onOpenDocument(item.document);
                }}
                testID={`featureOverviewOpen_${item.id}`}
              />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
);

const HeaderCell: React.FC<{
  label: string;
  style: object;
}> = ({ label, style }) => (
  <View style={[styles.headerCell, style]}>
    <Text style={styles.headerText}>{label}</Text>
  </View>
);

const UnitRow: React.FC<{
  item: KoreanFieldworkUnitMatrixItem;
  onOpenDocument: (document: Document) => void;
  onAddDocumentOfCategory: (parentDoc: Document, categoryName: string) => void;
}> = ({
  item,
  onOpenDocument,
  onAddDocumentOfCategory,
}) => (
  <View
    accessible={false}
    style={[styles.row, rowToneStyle(item.tone)]}
    testID={`unitMatrixRow_${item.id}`}
  >
    <View style={styles.unitColumn}>
      <View style={styles.unitTitleRow}>
        <Text style={styles.categoryLabel} numberOfLines={1}>
          {item.categoryLabel}
        </Text>
        <Text style={[styles.tonePill, tonePillStyle(item.tone)]}>
          {item.completionPercent}%
        </Text>
      </View>
      <Text style={styles.unitTitle} numberOfLines={1}>
        {item.title}
      </Text>
      {!!item.parentPath && (
        <Text style={styles.parentPath} numberOfLines={1}>
          {item.parentPath}
        </Text>
      )}
      <View style={styles.statusRow}>
        {item.statusChips.slice(0, 2).map((chip) => (
          <Text
            key={chip.label}
            style={[styles.statusChip, statusChipStyle(chip.tone)]}
            numberOfLines={1}
          >
            {chip.label}
          </Text>
        ))}
      </View>
    </View>

    <View style={styles.progressColumn}>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            progressFillStyle(item.tone),
            { width: `${item.completionPercent}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        이어진 기록 {item.childStructureCount}
      </Text>
      {item.checklistTotal > 0 && (
        <Text style={styles.progressText}>
          과정 {item.checklistDone}/{item.checklistTotal}
        </Text>
      )}
    </View>

    <View style={styles.evidenceColumn}>
      <View style={styles.evidenceWrap}>
        {item.evidenceCount === 0 ? (
          <Text style={styles.emptyEvidence}>관련 자료 없음</Text>
        ) : item.evidenceChips
          .filter((chip) => chip.count > 0)
          .slice(0, 3)
          .map((chip) => (
            <Text key={chip.id} style={styles.evidenceChip}>
              {chip.label} {chip.count}
            </Text>
          ))}
      </View>
    </View>

    <View style={styles.actionColumn}>
      <UnitAction
        icon="open-in-new"
        label="열기"
        onPress={(event) => {
          event?.stopPropagation?.();
          onOpenDocument(item.document);
        }}
        testID={`unitMatrixOpen_${item.id}`}
      />
      {!!item.nextChildCategoryName && (
        <UnitAction
          icon="add"
          label="추가"
          onPress={(event) => {
          event?.stopPropagation?.();
          onAddDocumentOfCategory(item.document, item.nextChildCategoryName!);
        }}
          testID={`unitMatrixAddChild_${item.id}`}
        />
      )}
      {!!item.photoCategoryName && (
        <UnitAction
          icon="photo-camera"
          label="사진"
          onPress={(event) => {
            event?.stopPropagation?.();
            onAddDocumentOfCategory(item.document, item.photoCategoryName!);
          }}
          testID={`unitMatrixAddPhoto_${item.id}`}
        />
      )}
    </View>

    <View style={styles.issueColumn}>
      <Text
        style={[
          styles.issueValue,
          item.issueCount > 0 && styles.issueValueWarning,
          item.hasCriticalIssue && styles.issueValueDanger,
        ]}
      >
        {item.issueCount}
      </Text>
    </View>
  </View>
);

const UnitAction: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: (event?: GestureResponderEvent) => void;
  testID: string;
}> = ({
  icon,
  label,
  onPress,
  testID,
}) => (
  <TouchableOpacity
    accessibilityLabel={label}
    accessibilityRole="button"
    activeOpacity={0.84}
    onPress={onPress}
    style={styles.actionButton}
    testID={testID}
  >
    <MaterialIcons name={icon} size={20} color="#344054" />
  </TouchableOpacity>
);

const rowToneStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.rowDanger;
    case 'warning':
      return styles.rowWarning;
    case 'info':
      return styles.rowInfo;
    case 'success':
      return styles.rowSuccess;
    default:
      return styles.rowNeutral;
  }
};

const tonePillStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.pillDanger;
    case 'warning':
      return styles.pillWarning;
    case 'info':
      return styles.pillInfo;
    case 'success':
      return styles.pillSuccess;
    default:
      return styles.pillNeutral;
  }
};

const progressFillStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.progressDanger;
    case 'warning':
      return styles.progressWarning;
    case 'info':
      return styles.progressInfo;
    case 'success':
      return styles.progressSuccess;
    default:
      return styles.progressNeutral;
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderBottomColor: '#d0d5dd',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title: {
    color: '#1f2937',
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 6,
  },
  count: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '900',
  },
  subtitle: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  tableScroll: {
    paddingTop: 10,
  },
  table: {
    minWidth: 720,
  },
  featureOverview: {
    marginBottom: 14,
  },
  featureTable: {
    minWidth: 760,
  },
  headerRow: {
    backgroundColor: '#eef2f6',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 34,
  },
  headerCell: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerText: {
    color: '#475467',
    fontSize: 11,
    fontWeight: '900',
  },
  row: {
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 7,
    minHeight: 92,
    paddingVertical: 9,
  },
  rowNeutral: {
    borderColor: '#d0d5dd',
  },
  rowInfo: {
    borderColor: '#b2ddff',
  },
  rowSuccess: {
    borderColor: '#abefc6',
  },
  rowWarning: {
    borderColor: '#fedf89',
  },
  rowDanger: {
    borderColor: '#fecdca',
  },
  unitColumn: {
    paddingHorizontal: 8,
    width: 208,
  },
  progressColumn: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    width: 100,
  },
  evidenceColumn: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    width: 122,
  },
  issueColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    width: 50,
  },
  actionColumn: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 6,
    width: 204,
  },
  featureNameColumn: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    width: 210,
  },
  featureStatusColumn: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    width: 108,
  },
  featureEvidenceColumn: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    width: 172,
  },
  featureIssueColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    width: 56,
  },
  featureNextColumn: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    width: 134,
  },
  featureActionColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    width: 80,
  },
  featureRow: {
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 7,
    minHeight: 76,
    paddingVertical: 8,
  },
  unitTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  categoryLabel: {
    color: '#475467',
    flex: 1,
    fontSize: 11,
    fontWeight: '900',
  },
  tonePill: {
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  pillNeutral: {
    backgroundColor: '#eef2f6',
    color: '#475467',
  },
  pillInfo: {
    backgroundColor: '#eff8ff',
    color: '#175cd3',
  },
  pillSuccess: {
    backgroundColor: '#ecfdf3',
    color: '#027a48',
  },
  pillWarning: {
    backgroundColor: '#fffaeb',
    color: '#b54708',
  },
  pillDanger: {
    backgroundColor: '#fff1f3',
    color: colors.danger,
  },
  unitTitle: {
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
    marginTop: 3,
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
  progressTrack: {
    backgroundColor: '#eaecf0',
    borderRadius: 3,
    height: 7,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 3,
    height: 7,
  },
  progressNeutral: {
    backgroundColor: '#667085',
  },
  progressInfo: {
    backgroundColor: '#2e90fa',
  },
  progressSuccess: {
    backgroundColor: '#12b76a',
  },
  progressWarning: {
    backgroundColor: '#f79009',
  },
  progressDanger: {
    backgroundColor: colors.danger,
  },
  progressText: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
  },
  evidenceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  evidenceChip: {
    backgroundColor: '#f2f4f7',
    borderRadius: 4,
    color: '#344054',
    fontSize: 10,
    fontWeight: '900',
    marginRight: 4,
    marginTop: 4,
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  emptyEvidence: {
    color: '#b54708',
    fontSize: 11,
    fontWeight: '900',
  },
  featureEvidenceText: {
    color: '#344054',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
  },
  featureNextText: {
    color: '#344054',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 15,
  },
  issueValue: {
    color: '#475467',
    fontSize: 18,
    fontWeight: '900',
  },
  issueValueWarning: {
    color: '#b54708',
  },
  issueValueDanger: {
    color: colors.danger,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: 4,
    marginTop: 4,
    minWidth: 40,
    minHeight: 36,
    paddingHorizontal: 0,
  },
});

export default KoreanFieldworkUnitMatrix;
