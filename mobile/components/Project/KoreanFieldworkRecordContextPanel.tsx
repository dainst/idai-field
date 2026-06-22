import { MaterialIcons } from '@expo/vector-icons';
import {
  buildEvidenceBundle,
  Document,
  EvidenceBundle,
  KoreanFieldworkReadinessIssue,
} from 'idai-field-core';
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/utils/colors';
import {
  formatKoreanFieldworkParentPath,
  getKoreanFieldworkRecordStatusChips,
  KoreanFieldworkStatusChip,
  KoreanFieldworkStatusTone,
} from './korean-fieldwork-record-summary';
import {
  getKoreanFieldworkCategoryLabel,
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';
import {
  getKoreanFieldworkIssueResolutionAction,
  KoreanFieldworkIssueResolutionAction,
} from './korean-fieldwork-issue-resolution';

interface KoreanFieldworkRecordContextPanelProps {
  document: Document;
  documents: Document[];
  allowedAddCategoryNames?: string[];
  onAddDocumentOfCategory?: (parentDoc: Document, categoryName: string) => void;
  onOpenDocument: (document: Document) => void;
  onUpdateResourceFields?: (updates: Record<string, unknown>) => void;
}

export interface EvidenceMetric {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  documents: Document[];
  createCategoryName?: string;
}

const KoreanFieldworkRecordContextPanel: React.FC<KoreanFieldworkRecordContextPanelProps> = ({
  document,
  documents,
  allowedAddCategoryNames = [],
  onAddDocumentOfCategory,
  onOpenDocument,
  onUpdateResourceFields,
}) => {
  const documentsById = useMemo(
    () => new Map(documents.map((candidate) => [candidate.resource.id, candidate])),
    [documents]
  );
  const parentPath = formatKoreanFieldworkParentPath(document, documentsById);
  const statusChips = getKoreanFieldworkRecordStatusChips(document);
  const evidenceBundle = useMemo(
    () => buildEvidenceBundle(document, documents),
    [document, documents]
  );
  const metrics = getEvidenceMetrics(evidenceBundle);
  const allowedAddCategorySet = useMemo(
    () => new Set(allowedAddCategoryNames),
    [allowedAddCategoryNames]
  );
  const visibleIssues = evidenceBundle.issues.slice(0, 3);

  return (
    <View style={styles.container} testID="koreanFieldworkRecordContextPanel">
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>현장 맥락</Text>
          <Text style={styles.title} numberOfLines={1}>
            {getKoreanFieldworkCategoryLabel(document.resource.category)}
            {parentPath ? ` · ${parentPath}` : ''}
          </Text>
        </View>
        {visibleIssues.length > 0 && (
          <View style={styles.issueCountPill}>
            <MaterialIcons name="priority-high" size={13} color="white" />
            <Text style={styles.issueCountText}>{visibleIssues.length}</Text>
          </View>
        )}
      </View>

      {statusChips.length > 0 && (
        <View style={styles.statusRow}>
          {statusChips.map((chip) => (
            <StatusChip key={chip.label} chip={chip} />
          ))}
        </View>
      )}

      <View style={styles.metricRow}>
        {metrics.map((metric) => (
          <EvidenceButton
            key={metric.id}
            rootDocument={document}
            metric={metric}
            allowedAddCategoryNames={allowedAddCategorySet}
            onAddDocumentOfCategory={onAddDocumentOfCategory}
            onOpenDocument={onOpenDocument}
          />
        ))}
      </View>

      {visibleIssues.length > 0 && (
        <View style={styles.issuePanel}>
          <Text style={styles.issuePanelTitle}>마감 전 확인</Text>
          {visibleIssues.map((issue) => {
            const issueDocument = documentsById.get(issue.documentId);
            const resolutionAction = getKoreanFieldworkIssueResolutionAction(
              issue,
              document,
              allowedAddCategoryNames
            );

            return (
              <View
                key={`${issue.documentId}-${issue.ruleId}`}
                style={styles.issueRow}
              >
                <View style={[styles.issueSeverity, issueSeverityStyle(issue)]} />
                <View style={styles.issueText}>
                  <Text style={styles.issueTitle} numberOfLines={1}>
                    {issue.identifier}
                  </Text>
                  <Text style={styles.issueAction} numberOfLines={2}>
                    {issue.recommendedAction}
                  </Text>
                </View>
                <IssueActionControls
                  issue={issue}
                  issueDocument={issueDocument}
                  resolutionAction={resolutionAction}
                  onAddDocumentOfCategory={onAddDocumentOfCategory}
                  onOpenDocument={onOpenDocument}
                  onUpdateResourceFields={onUpdateResourceFields}
                  rootDocument={document}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export const getEvidenceMetrics = (
  evidenceBundle: EvidenceBundle
): EvidenceMetric[] => [
  {
    id: 'featureSegments',
    label: '피트',
    icon: 'account-tree',
    documents: evidenceBundle.featureSegments,
    createCategoryName: KOREAN_FIELDWORK_CATEGORIES.FEATURE_SEGMENT,
  },
  {
    id: 'layers',
    label: '층위',
    icon: 'layers',
    documents: evidenceBundle.layers,
    createCategoryName: KOREAN_FIELDWORK_CATEGORIES.LAYER,
  },
  {
    id: 'photos',
    label: '사진',
    icon: 'photo-camera',
    documents: evidenceBundle.photos,
    createCategoryName: KOREAN_FIELDWORK_CATEGORIES.PHOTO,
  },
  {
    id: 'soilProfilePhotos',
    label: '토층',
    icon: 'terrain',
    documents: evidenceBundle.soilProfilePhotos,
    createCategoryName: KOREAN_FIELDWORK_CATEGORIES.SOIL_PROFILE_PHOTO,
  },
  {
    id: 'drawings',
    label: '도면',
    icon: 'architecture',
    documents: evidenceBundle.drawings,
    createCategoryName: KOREAN_FIELDWORK_CATEGORIES.DRAWING,
  },
  {
    id: 'finds',
    label: '유물',
    icon: 'inventory-2',
    documents: evidenceBundle.finds,
    createCategoryName: KOREAN_FIELDWORK_CATEGORIES.FIND,
  },
  {
    id: 'samples',
    label: '시료',
    icon: 'science',
    documents: evidenceBundle.samples,
    createCategoryName: KOREAN_FIELDWORK_CATEGORIES.SAMPLE,
  },
];

const EvidenceButton: React.FC<{
  rootDocument: Document;
  metric: EvidenceMetric;
  allowedAddCategoryNames: Set<string>;
  onAddDocumentOfCategory?: (parentDoc: Document, categoryName: string) => void;
  onOpenDocument: (document: Document) => void;
}> = ({
  rootDocument,
  metric,
  allowedAddCategoryNames,
  onAddDocumentOfCategory,
  onOpenDocument,
}) => {
  const [firstDocument] = metric.documents;
  const canCreateMissingEvidence = !firstDocument
    && !!metric.createCategoryName
    && allowedAddCategoryNames.has(metric.createCategoryName)
    && !!onAddDocumentOfCategory;
  const isDisabled = !firstDocument && !canCreateMissingEvidence;

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      disabled={isDisabled}
      testID={`evidenceMetric_${metric.id}`}
      onPress={() => {
        if (firstDocument) {
          onOpenDocument(firstDocument);
          return;
        }
        if (canCreateMissingEvidence && metric.createCategoryName) {
          onAddDocumentOfCategory(rootDocument, metric.createCategoryName);
        }
      }}
      style={[
        styles.metric,
        isDisabled && styles.metricEmpty,
        canCreateMissingEvidence && styles.metricCreate,
      ]}
    >
      <MaterialIcons
        name={canCreateMissingEvidence ? 'add-circle-outline' : metric.icon}
        size={16}
        color={isDisabled ? '#98a2b3' : '#2f5f4a'}
      />
      <Text style={[styles.metricValue, isDisabled && styles.metricValueEmpty]}>
        {metric.documents.length}
      </Text>
      <Text style={styles.metricLabel} numberOfLines={1}>
        {metric.label}
      </Text>
      {canCreateMissingEvidence && (
        <Text style={styles.metricActionLabel}>추가</Text>
      )}
    </TouchableOpacity>
  );
};

const StatusChip: React.FC<{ chip: KoreanFieldworkStatusChip }> = ({ chip }) => (
  <View style={[styles.statusChip, statusChipToneStyle(chip.tone)]}>
    <Text style={[styles.statusChipText, statusChipTextToneStyle(chip.tone)]}>
      {chip.label}
    </Text>
  </View>
);

const IssueActionControls: React.FC<{
  issue: KoreanFieldworkReadinessIssue;
  issueDocument: Document | undefined;
  resolutionAction: KoreanFieldworkIssueResolutionAction | undefined;
  rootDocument: Document;
  onAddDocumentOfCategory?: (parentDoc: Document, categoryName: string) => void;
  onOpenDocument: (document: Document) => void;
  onUpdateResourceFields?: (updates: Record<string, unknown>) => void;
}> = ({
  issue,
  issueDocument,
  resolutionAction,
  rootDocument,
  onAddDocumentOfCategory,
  onOpenDocument,
  onUpdateResourceFields,
}) => {
  const canRunResolution = canRunIssueResolution(
    resolutionAction,
    onAddDocumentOfCategory,
    onUpdateResourceFields
  );

  return (
    <View style={styles.issueActionColumn}>
      {canRunResolution && resolutionAction && (
        <TouchableOpacity
          activeOpacity={0.84}
          accessibilityLabel={resolutionAction.label}
          onPress={() => runIssueResolution(
            resolutionAction,
            rootDocument,
            onAddDocumentOfCategory,
            onUpdateResourceFields
          )}
          style={[
            styles.issueResolutionButton,
            issueResolutionButtonStyle(resolutionAction.tone),
          ]}
          testID={`issueResolution_${issue.ruleId}_${issue.documentId}`}
        >
          <MaterialIcons
            name={resolutionAction.icon as keyof typeof MaterialIcons.glyphMap}
            size={14}
            color={issueResolutionIconColor(resolutionAction.tone)}
          />
          <Text
            style={[
              styles.issueResolutionText,
              issueResolutionTextStyle(resolutionAction.tone),
            ]}
            numberOfLines={1}
          >
            {resolutionAction.label}
          </Text>
        </TouchableOpacity>
      )}
      {!!issueDocument && (
        <TouchableOpacity
          activeOpacity={0.84}
          accessibilityLabel="기록 열기"
          onPress={() => onOpenDocument(issueDocument)}
          style={styles.issueOpenButton}
          testID={`issueOpen_${issue.ruleId}_${issue.documentId}`}
        >
          <MaterialIcons name="open-in-new" size={15} color="#7a3d3d" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const canRunIssueResolution = (
  action: KoreanFieldworkIssueResolutionAction | undefined,
  onAddDocumentOfCategory: ((parentDoc: Document, categoryName: string) => void) | undefined,
  onUpdateResourceFields: ((updates: Record<string, unknown>) => void) | undefined
): boolean => {
  if (!action) return false;
  if (action.type === 'updateFields') return !!action.updates && !!onUpdateResourceFields;
  if (action.type === 'createDocument') {
    return !!action.categoryName && !!onAddDocumentOfCategory;
  }

  return false;
};

const runIssueResolution = (
  action: KoreanFieldworkIssueResolutionAction,
  rootDocument: Document,
  onAddDocumentOfCategory: ((parentDoc: Document, categoryName: string) => void) | undefined,
  onUpdateResourceFields: ((updates: Record<string, unknown>) => void) | undefined
) => {
  if (action.type === 'updateFields' && action.updates && onUpdateResourceFields) {
    onUpdateResourceFields(action.updates);
    return;
  }

  if (action.type === 'createDocument' && action.categoryName && onAddDocumentOfCategory) {
    onAddDocumentOfCategory(rootDocument, action.categoryName);
  }
};

const statusChipToneStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'success':
      return styles.statusChipSuccess;
    case 'warning':
      return styles.statusChipWarning;
    case 'danger':
      return styles.statusChipDanger;
    case 'info':
      return styles.statusChipInfo;
    default:
      return styles.statusChipNeutral;
  }
};

const statusChipTextToneStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'success':
      return styles.statusChipTextSuccess;
    case 'warning':
      return styles.statusChipTextWarning;
    case 'danger':
      return styles.statusChipTextDanger;
    case 'info':
      return styles.statusChipTextInfo;
    default:
      return styles.statusChipTextNeutral;
  }
};

const issueSeverityStyle = (issue: KoreanFieldworkReadinessIssue) =>
  issue.severity === 'critical'
    ? styles.issueSeverityCritical
    : issue.severity === 'warning'
      ? styles.issueSeverityWarning
      : styles.issueSeverityInfo;

const issueResolutionButtonStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.issueResolutionDanger;
    case 'info':
      return styles.issueResolutionInfo;
    default:
      return styles.issueResolutionWarning;
  }
};

const issueResolutionTextStyle = (tone: KoreanFieldworkStatusTone) => {
  switch (tone) {
    case 'danger':
      return styles.issueResolutionTextDanger;
    case 'info':
      return styles.issueResolutionTextInfo;
    default:
      return styles.issueResolutionTextWarning;
  }
};

const issueResolutionIconColor = (tone: KoreanFieldworkStatusTone): string => {
  switch (tone) {
    case 'danger':
      return colors.danger;
    case 'info':
      return '#175cd3';
    default:
      return '#b54708';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerText: {
    flex: 1,
    paddingRight: 8,
  },
  kicker: {
    color: '#2f6f4e',
    fontSize: 11,
    fontWeight: '900',
  },
  title: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  issueCountPill: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: 5,
    flexDirection: 'row',
    minHeight: 25,
    paddingHorizontal: 7,
  },
  issueCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 2,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  statusChip: {
    borderRadius: 5,
    borderWidth: 1,
    marginRight: 5,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusChipNeutral: {
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
  },
  statusChipInfo: {
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
  },
  statusChipSuccess: {
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
  },
  statusChipWarning: {
    backgroundColor: '#fffaeb',
    borderColor: '#fedf89',
  },
  statusChipDanger: {
    backgroundColor: '#fff1f3',
    borderColor: '#fecdca',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusChipTextNeutral: {
    color: '#475467',
  },
  statusChipTextInfo: {
    color: '#175cd3',
  },
  statusChipTextSuccess: {
    color: '#027a48',
  },
  statusChipTextWarning: {
    color: '#b54708',
  },
  statusChipTextDanger: {
    color: colors.danger,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  metric: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#cbd5e1',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 6,
    marginTop: 6,
    minHeight: 34,
    paddingHorizontal: 7,
  },
  metricEmpty: {
    backgroundColor: '#f2f4f7',
  },
  metricCreate: {
    backgroundColor: '#ecfdf3',
    borderColor: '#abefc6',
  },
  metricValue: {
    color: '#27343b',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 4,
  },
  metricValueEmpty: {
    color: '#98a2b3',
  },
  metricLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 3,
  },
  metricActionLabel: {
    color: '#027a48',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 4,
  },
  issuePanel: {
    marginTop: 10,
  },
  issuePanelTitle: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900',
  },
  issueRow: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#f0d0d0',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 5,
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  issueActionColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 6,
  },
  issueResolutionButton: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 31,
    paddingHorizontal: 7,
  },
  issueResolutionWarning: {
    backgroundColor: '#fffaeb',
    borderColor: '#fedf89',
  },
  issueResolutionDanger: {
    backgroundColor: '#fff1f3',
    borderColor: '#fecdca',
  },
  issueResolutionInfo: {
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
  },
  issueResolutionText: {
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 3,
  },
  issueResolutionTextWarning: {
    color: '#b54708',
  },
  issueResolutionTextDanger: {
    color: colors.danger,
  },
  issueResolutionTextInfo: {
    color: '#175cd3',
  },
  issueOpenButton: {
    alignItems: 'center',
    backgroundColor: '#fff8f8',
    borderColor: '#f0d0d0',
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 5,
    minHeight: 29,
    minWidth: 36,
  },
  issueSeverity: {
    borderRadius: 2,
    height: 28,
    width: 4,
  },
  issueSeverityCritical: {
    backgroundColor: colors.danger,
  },
  issueSeverityWarning: {
    backgroundColor: '#b54708',
  },
  issueSeverityInfo: {
    backgroundColor: '#175cd3',
  },
  issueText: {
    flex: 1,
    paddingHorizontal: 8,
  },
  issueTitle: {
    color: '#552626',
    fontSize: 12,
    fontWeight: '900',
  },
  issueAction: {
    color: '#5f2525',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
});

export default KoreanFieldworkRecordContextPanel;
