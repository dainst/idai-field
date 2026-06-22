import { MaterialIcons } from '@expo/vector-icons';
import {
  Document,
  KoreanFieldworkReadinessIssue,
  getKoreanFieldworkTodaySummary,
} from 'idai-field-core';
import { router } from 'expo-router';
import React, { useContext, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CategoryIcon from '@/components/common/CategoryIcon';
import { KOREAN_FIELDWORK_CATEGORIES } from '@/components/Project/korean-fieldwork-categories';
import { ConfigurationContext } from '@/contexts/configuration-context';
import LabelsContext from '@/contexts/labels/labels-context';
import { ProjectContext } from '@/contexts/project-context';
import { colors } from '@/utils/colors';

type FilterId = 'all'|'operation'|'feature'|'find'|'media'|'review';

interface RecordFilter {
  id: FilterId;
  label: string;
  categories: string[];
}

interface RecordGroup {
  title: string;
  subtitle: string;
  categories: string[];
}

const RECORD_FILTERS: RecordFilter[] = [
  { id: 'all', label: '전체', categories: [] },
  {
    id: 'operation',
    label: '조사구역',
    categories: [
      KOREAN_FIELDWORK_CATEGORIES.OPERATION,
      KOREAN_FIELDWORK_CATEGORIES.SURVEY,
      KOREAN_FIELDWORK_CATEGORIES.SURVEY_BOUNDARY,
    ],
  },
  {
    id: 'feature',
    label: '유구·트렌치',
    categories: [
      KOREAN_FIELDWORK_CATEGORIES.FEATURE_GROUP,
      KOREAN_FIELDWORK_CATEGORIES.FEATURE,
      KOREAN_FIELDWORK_CATEGORIES.FEATURE_SEGMENT,
      KOREAN_FIELDWORK_CATEGORIES.TRENCH,
      KOREAN_FIELDWORK_CATEGORIES.LAYER,
    ],
  },
  {
    id: 'find',
    label: '유물·시료',
    categories: [
      KOREAN_FIELDWORK_CATEGORIES.FIND,
      KOREAN_FIELDWORK_CATEGORIES.FIND_COLLECTION,
      KOREAN_FIELDWORK_CATEGORIES.SAMPLE,
    ],
  },
  {
    id: 'media',
    label: '사진·도면·메모',
    categories: [
      KOREAN_FIELDWORK_CATEGORIES.PHOTO,
      KOREAN_FIELDWORK_CATEGORIES.SOIL_PROFILE_PHOTO,
      KOREAN_FIELDWORK_CATEGORIES.DRAWING,
      KOREAN_FIELDWORK_CATEGORIES.PEN_MEMO,
      KOREAN_FIELDWORK_CATEGORIES.AERIAL_MAP_LAYER,
    ],
  },
  {
    id: 'review',
    label: '일지·점검',
    categories: [
      KOREAN_FIELDWORK_CATEGORIES.DAILY_LOG,
      KOREAN_FIELDWORK_CATEGORIES.FIELD_RECORD_QUALITY_REVIEW,
      KOREAN_FIELDWORK_CATEGORIES.SOURCE_EVIDENCE_INDEX,
    ],
  },
];

const RECORD_GROUPS: RecordGroup[] = [
  {
    title: '조사구역과 경계',
    subtitle: '현장 전체 범위, 구역, 측량 경계',
    categories: [
      KOREAN_FIELDWORK_CATEGORIES.OPERATION,
      KOREAN_FIELDWORK_CATEGORIES.SURVEY,
      KOREAN_FIELDWORK_CATEGORIES.SURVEY_BOUNDARY,
    ],
  },
  {
    title: '유구군·유구·트렌치·층위',
    subtitle: '한국 야장 기록의 중심 단위',
    categories: [
      KOREAN_FIELDWORK_CATEGORIES.FEATURE_GROUP,
      KOREAN_FIELDWORK_CATEGORIES.FEATURE,
      KOREAN_FIELDWORK_CATEGORIES.FEATURE_SEGMENT,
      KOREAN_FIELDWORK_CATEGORIES.TRENCH,
      KOREAN_FIELDWORK_CATEGORIES.LAYER,
    ],
  },
  {
    title: '유물과 시료',
    subtitle: '수습, 라벨, 분석 목적까지 이어지는 기록',
    categories: [
      KOREAN_FIELDWORK_CATEGORIES.FIND,
      KOREAN_FIELDWORK_CATEGORIES.FIND_COLLECTION,
      KOREAN_FIELDWORK_CATEGORIES.SAMPLE,
    ],
  },
  {
    title: '사진·도면·메모',
    subtitle: '현장 증거와 보조 기록',
    categories: [
      KOREAN_FIELDWORK_CATEGORIES.PHOTO,
      KOREAN_FIELDWORK_CATEGORIES.SOIL_PROFILE_PHOTO,
      KOREAN_FIELDWORK_CATEGORIES.DRAWING,
      KOREAN_FIELDWORK_CATEGORIES.PEN_MEMO,
      KOREAN_FIELDWORK_CATEGORIES.AERIAL_MAP_LAYER,
    ],
  },
  {
    title: '일지와 점검',
    subtitle: '오늘의 조사 상태와 마감 전 확인',
    categories: [
      KOREAN_FIELDWORK_CATEGORIES.DAILY_LOG,
      KOREAN_FIELDWORK_CATEGORIES.FIELD_RECORD_QUALITY_REVIEW,
      KOREAN_FIELDWORK_CATEGORIES.SOURCE_EVIDENCE_INDEX,
    ],
  },
];

const FIELDWORK_CATEGORY_LABELS: { [categoryName: string]: string } = {
  [KOREAN_FIELDWORK_CATEGORIES.AERIAL_MAP_LAYER]: '항공지도',
  [KOREAN_FIELDWORK_CATEGORIES.DAILY_LOG]: '일지',
  [KOREAN_FIELDWORK_CATEGORIES.DRAWING]: '도면',
  [KOREAN_FIELDWORK_CATEGORIES.FEATURE]: '유구',
  [KOREAN_FIELDWORK_CATEGORIES.FEATURE_GROUP]: '유구군',
  [KOREAN_FIELDWORK_CATEGORIES.FEATURE_SEGMENT]: '유구 구간',
  [KOREAN_FIELDWORK_CATEGORIES.FIELD_RECORD_QUALITY_REVIEW]: '기록 점검',
  [KOREAN_FIELDWORK_CATEGORIES.FIND]: '유물',
  [KOREAN_FIELDWORK_CATEGORIES.FIND_COLLECTION]: '유물 일괄',
  [KOREAN_FIELDWORK_CATEGORIES.LAYER]: '층위',
  [KOREAN_FIELDWORK_CATEGORIES.OPERATION]: '조사구역',
  [KOREAN_FIELDWORK_CATEGORIES.PEN_MEMO]: '펜 메모',
  [KOREAN_FIELDWORK_CATEGORIES.PHOTO]: '사진',
  [KOREAN_FIELDWORK_CATEGORIES.PLACE]: '지점',
  [KOREAN_FIELDWORK_CATEGORIES.SAMPLE]: '시료',
  [KOREAN_FIELDWORK_CATEGORIES.SOIL_PROFILE_PHOTO]: '토층 사진',
  [KOREAN_FIELDWORK_CATEGORIES.SOURCE_EVIDENCE_INDEX]: '근거 색인',
  [KOREAN_FIELDWORK_CATEGORIES.SURVEY]: '측량',
  [KOREAN_FIELDWORK_CATEGORIES.SURVEY_BOUNDARY]: '조사 경계',
  [KOREAN_FIELDWORK_CATEGORIES.TRENCH]: '트렌치',
};

const DocumentsList: React.FC = () => {
  const {
    documents,
    hierarchyPath,
    onDocumentSelected,
    onParentSelected,
  } = useContext(ProjectContext);
  const config = useContext(ConfigurationContext);
  const { labels } = useContext(LabelsContext);
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [query, setQuery] = useState('');

  const documentsById = useMemo(
    () => new Map(documents.map((document) => [document.resource.id, document])),
    [documents]
  );
  const todaySummary = useMemo(
    () => getKoreanFieldworkTodaySummary(documents),
    [documents]
  );
  const normalizedQuery = query.trim().toLowerCase();
  const activeFilterDefinition = RECORD_FILTERS.find((filter) =>
    filter.id === activeFilter
  ) ?? RECORD_FILTERS[0];

  const getCategoryLabel = (categoryName: string) => {
    const category = config.getCategory(categoryName);
    if (category && labels) return labels.get(category);

    return FIELDWORK_CATEGORY_LABELS[categoryName] ?? categoryName;
  };

  const filteredDocuments = useMemo(() => documents.filter((document) => {
    const filterCategories = activeFilterDefinition.categories;
    const matchesFilter = filterCategories.length === 0
      || filterCategories.includes(document.resource.category);
    const matchesQuery = !normalizedQuery
      || getSearchableText(document, getCategoryLabel(document.resource.category))
        .includes(normalizedQuery);

    return matchesFilter && matchesQuery;
  }), [
    activeFilterDefinition,
    documents,
    getCategoryLabel,
    normalizedQuery,
  ]);

  const groupedDocuments = useMemo(() => RECORD_GROUPS
    .map((group) => ({
      ...group,
      documents: filteredDocuments.filter((document) =>
        group.categories.includes(document.resource.category)
      ),
    }))
    .filter((group) => group.documents.length > 0), [filteredDocuments]);

  const groupedDocumentIds = useMemo(() => new Set(groupedDocuments
    .flatMap((group) => group.documents.map((document) => document.resource.id))
  ), [groupedDocuments]);
  const otherDocuments = filteredDocuments.filter((document) =>
    !groupedDocumentIds.has(document.resource.id)
  );
  const issueDocument = todaySummary.openIssues
    .map((issue) => documentsById.get(issue.documentId))
    .find((document): document is Document => !!document);
  const hierarchyLabel = hierarchyPath.length > 0
    ? hierarchyPath.map((document) => document.resource.identifier).join(' / ')
    : '전체 조사자료';

  const openMap = () => router.navigate('/ProjectScreen/DocumentsMap');
  const editDocument = (document: Document) => {
    router.navigate({
      pathname: '/ProjectScreen/DocumentEdit',
      params: {
        docId: document.resource.id,
        categoryName: document.resource.category,
      },
    });
  };
  const openDailyLog = () => {
    const [dailyLog] = todaySummary.dailyLogs;
    dailyLog ? editDocument(dailyLog) : openMap();
  };
  const openFirstCandidate = () => {
    const [candidate] = todaySummary.featureCandidates;
    candidate ? onDocumentSelected(candidate) : openMap();
  };
  const openFirstIssue = () => issueDocument
    ? onDocumentSelected(issueDocument)
    : openMap();

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerBand}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>한국형 디지털 야장</Text>
            <Text style={styles.title}>현장 기록판</Text>
            <Text style={styles.contextLine} numberOfLines={1}>
              현재 범위: {hierarchyLabel}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.mapButton}
            onPress={openMap}
          >
            <MaterialIcons name="map" size={22} color="white" />
            <Text style={styles.mapButtonText}>지도 야장</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsBand}>
          <Metric label="전체 기록" value={documents.length} icon="inventory-2" />
          <Metric label="오늘 일지" value={todaySummary.dailyLogs.length} icon="event-note" />
          <Metric label="유구 후보" value={todaySummary.featureCandidates.length} icon="add-location-alt" />
          <Metric
            label="확인 필요"
            value={todaySummary.openIssues.length}
            icon="priority-high"
            warning={todaySummary.openIssues.length > 0}
          />
        </View>

        <View style={styles.actionBand}>
          <QuickAction
            icon="event-note"
            label="오늘 일지"
            detail={todaySummary.dailyLogs.length > 0 ? '작성 내용 보기' : '지도에서 새 기록'}
            onPress={openDailyLog}
          />
          <QuickAction
            icon="add-location-alt"
            label="유구 후보"
            detail={todaySummary.featureCandidates.length > 0
              ? `${todaySummary.featureCandidates.length}건 확인`
              : '현재 위치로 작성'}
            onPress={openFirstCandidate}
          />
          <QuickAction
            icon="fact-check"
            label="마감 점검"
            detail={todaySummary.openIssues.length > 0
              ? `${todaySummary.openIssues.length}건 남음`
              : '현재 문제 없음'}
            onPress={openFirstIssue}
            warning={todaySummary.openIssues.length > 0}
          />
        </View>

        <View style={styles.searchBand}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color="#586069" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="식별자, 설명, 유구·트렌치·시료 검색"
              placeholderTextColor="#6f7782"
              style={styles.searchInput}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
                <MaterialIcons name="close" size={20} color="#586069" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {RECORD_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                activeOpacity={0.86}
                style={[
                  styles.filterChip,
                  activeFilter === filter.id && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(filter.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === filter.id && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {todaySummary.openIssues.length > 0 && (
          <IssueStrip
            issues={todaySummary.openIssues}
            documentsById={documentsById}
            onOpenDocument={onDocumentSelected}
          />
        )}

        <View style={styles.recordsBand}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>기록 묶음</Text>
            <Text style={styles.sectionMeta}>{filteredDocuments.length}건</Text>
          </View>

          {filteredDocuments.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="assignment-late" size={24} color="#697386" />
              <Text style={styles.emptyTitle}>표시할 기록이 없습니다</Text>
              <Text style={styles.emptyText}>
                검색어나 분류를 바꾸거나, 지도 야장에서 조사구역·유구·트렌치를 추가하세요.
              </Text>
            </View>
          )}

          {groupedDocuments.map((group) => (
            <RecordSection
              key={group.title}
              title={group.title}
              subtitle={group.subtitle}
              documents={group.documents}
              documentsById={documentsById}
              getCategoryLabel={getCategoryLabel}
              issueCountByDocumentId={todaySummary.issueCountByDocumentId}
              onOpenDocument={onDocumentSelected}
              onDrillDown={onParentSelected}
              onEditDocument={editDocument}
            />
          ))}

          {otherDocuments.length > 0 && (
            <RecordSection
              title="기타 기록"
              subtitle="설정에는 남아 있지만 야장 묶음에는 따로 분류되지 않은 기록"
              documents={otherDocuments}
              documentsById={documentsById}
              getCategoryLabel={getCategoryLabel}
              issueCountByDocumentId={todaySummary.issueCountByDocumentId}
              onOpenDocument={onDocumentSelected}
              onDrillDown={onParentSelected}
              onEditDocument={editDocument}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const Metric: React.FC<{
  label: string;
  value: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  warning?: boolean;
}> = ({ label, value, icon, warning = false }) => (
  <View style={[styles.metric, warning && styles.metricWarning]}>
    <MaterialIcons
      name={icon}
      size={18}
      color={warning ? colors.danger : '#365f6b'}
    />
    <Text style={[styles.metricValue, warning && styles.warningText]}>
      {value}
    </Text>
    <Text style={styles.metricLabel} numberOfLines={1}>{label}</Text>
  </View>
);

const QuickAction: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  detail: string;
  onPress: () => void;
  warning?: boolean;
}> = ({ icon, label, detail, onPress, warning = false }) => (
  <TouchableOpacity
    activeOpacity={0.86}
    style={[styles.quickAction, warning && styles.quickActionWarning]}
    onPress={onPress}
  >
    <MaterialIcons
      name={icon}
      size={21}
      color={warning ? colors.danger : '#2f5f4a'}
    />
    <View style={styles.quickActionText}>
      <Text style={styles.quickActionLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.quickActionDetail} numberOfLines={1}>{detail}</Text>
    </View>
  </TouchableOpacity>
);

const IssueStrip: React.FC<{
  issues: KoreanFieldworkReadinessIssue[];
  documentsById: Map<string, Document>;
  onOpenDocument: (document: Document) => void;
}> = ({ issues, documentsById, onOpenDocument }) => (
  <View style={styles.issueStrip}>
    <View style={styles.issueStripTitleRow}>
      <MaterialIcons name="warning" size={18} color={colors.danger} />
      <Text style={styles.issueStripTitle}>마감 전 확인 필요</Text>
    </View>
    {issues.slice(0, 3).map((issue) => {
      const document = documentsById.get(issue.documentId);

      return (
        <TouchableOpacity
          key={`${issue.documentId}-${issue.ruleId}`}
          activeOpacity={0.86}
          style={styles.issueRow}
          disabled={!document}
          onPress={() => document && onOpenDocument(document)}
        >
          <Text style={styles.issueIdentifier} numberOfLines={1}>
            {issue.identifier}
          </Text>
          <Text style={styles.issueAction} numberOfLines={2}>
            {issue.recommendedAction}
          </Text>
          <MaterialIcons name="chevron-right" size={18} color="#7a3d3d" />
        </TouchableOpacity>
      );
    })}
  </View>
);

const RecordSection: React.FC<{
  title: string;
  subtitle: string;
  documents: Document[];
  documentsById: Map<string, Document>;
  getCategoryLabel: (categoryName: string) => string;
  issueCountByDocumentId: { [documentId: string]: number };
  onOpenDocument: (document: Document) => void;
  onDrillDown: (document: Document) => void;
  onEditDocument: (document: Document) => void;
}> = ({
  title,
  subtitle,
  documents,
  documentsById,
  getCategoryLabel,
  issueCountByDocumentId,
  onOpenDocument,
  onDrillDown,
  onEditDocument,
}) => (
  <View style={styles.recordSection}>
    <View style={styles.recordSectionHeader}>
      <View style={styles.recordSectionTitleWrap}>
        <Text style={styles.recordSectionTitle}>{title}</Text>
        <Text style={styles.recordSectionSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text style={styles.recordSectionCount}>{documents.length}</Text>
    </View>
    {documents.map((document) => (
      <RecordRow
        key={document.resource.id}
        document={document}
        parentDocument={getPrimaryParent(document, documentsById)}
        categoryLabel={getCategoryLabel(document.resource.category)}
        issueCount={issueCountByDocumentId[document.resource.id] ?? 0}
        onOpen={() => onOpenDocument(document)}
        onDrillDown={() => onDrillDown(document)}
        onEdit={() => onEditDocument(document)}
      />
    ))}
  </View>
);

const RecordRow: React.FC<{
  document: Document;
  parentDocument: Document | undefined;
  categoryLabel: string;
  issueCount: number;
  onOpen: () => void;
  onDrillDown: () => void;
  onEdit: () => void;
}> = ({
  document,
  parentDocument,
  categoryLabel,
  issueCount,
  onOpen,
  onDrillDown,
  onEdit,
}) => {
  const config = useContext(ConfigurationContext);
  const category = config.getCategory(document.resource.category);
  const title = document.resource.identifier || document.resource.id;
  const description = getRecordDescription(document);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.recordRow}
      onPress={onOpen}
    >
      <View style={styles.recordIcon}>
        {category
          ? <CategoryIcon category={category} size={24} />
          : <MaterialIcons name="article" size={24} color="#555" />}
      </View>
      <View style={styles.recordMain}>
        <View style={styles.recordTitleRow}>
          <Text style={styles.recordTitle} numberOfLines={1}>{title}</Text>
          {issueCount > 0 && (
            <View style={styles.issueBadge}>
              <MaterialIcons name="priority-high" size={12} color="white" />
              <Text style={styles.issueBadgeText}>{issueCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.recordMeta} numberOfLines={1}>
          {categoryLabel}{parentDocument ? ` · 상위 ${parentDocument.resource.identifier}` : ''}
        </Text>
        {description && (
          <Text style={styles.recordDescription} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
      <View style={styles.recordActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onDrillDown}
          hitSlop={8}
        >
          <MaterialIcons name="account-tree" size={20} color="#475467" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onEdit}
          hitSlop={8}
        >
          <MaterialIcons name="edit" size={20} color="#475467" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const getPrimaryParent = (
  document: Document,
  documentsById: Map<string, Document>
): Document | undefined => {
  const relations = document.resource.relations ?? {};
  const parentId = [
    relations.isRecordedIn,
    relations.liesWithin,
    relations.isRecordedInFeature,
  ]
    .filter((value): value is string[] => Array.isArray(value))
    .flat()[0];

  return parentId ? documentsById.get(parentId) : undefined;
};

const getRecordDescription = (document: Document): string | undefined => {
  const resource = document.resource as any;

  return [
    resource.shortDescription,
    resource.description,
    resource.fieldNote,
    resource.interpretation,
    resource.dailyLogText,
    resource.penMemoText,
  ].find((value) => typeof value === 'string' && value.trim().length > 0);
};

const getSearchableText = (document: Document, categoryLabel: string): string => {
  const resource = document.resource as any;

  return [
    resource.identifier,
    resource.shortDescription,
    resource.description,
    resource.fieldNote,
    resource.interpretation,
    resource.dailyLogText,
    resource.penMemoText,
    resource.category,
    categoryLabel,
  ]
    .filter((value) => typeof value === 'string')
    .join(' ')
    .toLowerCase();
};

export default DocumentsList;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f2f4f7',
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  headerBand: {
    alignItems: 'center',
    backgroundColor: '#27343b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  kicker: {
    color: '#b9d0ca',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  contextLine: {
    color: '#d7dee2',
    fontSize: 13,
    marginTop: 6,
  },
  mapButton: {
    alignItems: 'center',
    backgroundColor: '#2f6f4e',
    borderRadius: 6,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  mapButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  metricsBand: {
    backgroundColor: 'white',
    borderBottomColor: '#d0d5dd',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metric: {
    alignItems: 'center',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    minHeight: 70,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  metricWarning: {
    backgroundColor: '#fff4f4',
    borderColor: '#f0b7bd',
  },
  metricValue: {
    color: '#263238',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 3,
  },
  metricLabel: {
    color: '#586069',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  warningText: {
    color: colors.danger,
  },
  actionBand: {
    backgroundColor: '#f8fafc',
    borderBottomColor: '#d0d5dd',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 4,
    minHeight: 58,
    paddingHorizontal: 10,
  },
  quickActionWarning: {
    backgroundColor: '#fff7f7',
    borderColor: '#f0b7bd',
  },
  quickActionText: {
    flex: 1,
    marginLeft: 8,
  },
  quickActionLabel: {
    color: '#27343b',
    fontSize: 14,
    fontWeight: '800',
  },
  quickActionDetail: {
    color: '#667085',
    fontSize: 12,
    marginTop: 2,
  },
  searchBand: {
    backgroundColor: 'white',
    borderBottomColor: '#d0d5dd',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 42,
    paddingHorizontal: 10,
  },
  searchInput: {
    color: '#111827',
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  filterRow: {
    paddingTop: 10,
  },
  filterChip: {
    alignItems: 'center',
    borderColor: '#cbd5e1',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: 8,
    minHeight: 34,
    paddingHorizontal: 12,
  },
  filterChipActive: {
    backgroundColor: '#27343b',
    borderColor: '#27343b',
  },
  filterChipText: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: 'white',
  },
  issueStrip: {
    backgroundColor: '#fff8f8',
    borderBottomColor: '#f0b7bd',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  issueStripTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  issueStripTitle: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
  issueRow: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#f0d0d0',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 5,
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  issueIdentifier: {
    color: '#552626',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 8,
    width: 96,
  },
  issueAction: {
    color: '#5f2525',
    flex: 1,
    fontSize: 12,
  },
  recordsBand: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#27343b',
    fontSize: 17,
    fontWeight: '900',
  },
  sectionMeta: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  emptyTitle: {
    color: '#27343b',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
  },
  emptyText: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  recordSection: {
    backgroundColor: 'white',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
  },
  recordSectionHeader: {
    alignItems: 'center',
    borderBottomColor: '#eaecf0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  recordSectionTitleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  recordSectionTitle: {
    color: '#27343b',
    fontSize: 15,
    fontWeight: '900',
  },
  recordSectionSubtitle: {
    color: '#667085',
    fontSize: 12,
    marginTop: 2,
  },
  recordSectionCount: {
    color: '#475467',
    fontSize: 16,
    fontWeight: '900',
  },
  recordRow: {
    alignItems: 'center',
    borderBottomColor: '#eef0f3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 74,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  recordIcon: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  recordMain: {
    flex: 1,
    paddingHorizontal: 8,
  },
  recordTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  recordTitle: {
    color: '#1f2937',
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  recordMeta: {
    color: '#667085',
    fontSize: 12,
    marginTop: 2,
  },
  recordDescription: {
    color: '#344054',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  issueBadge: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: 5,
    flexDirection: 'row',
    marginLeft: 8,
    minHeight: 20,
    paddingHorizontal: 5,
  },
  issueBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 2,
  },
  recordActions: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconButton: {
    alignItems: 'center',
    borderColor: '#d0d5dd',
    borderRadius: 6,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    marginLeft: 6,
    width: 34,
  },
});
