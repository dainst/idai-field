import { MaterialIcons } from '@expo/vector-icons';
import {
  Document,
  getKoreanFieldworkTodaySummary,
} from 'idai-field-core';
import { router } from 'expo-router';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CategoryIcon from '@/components/common/CategoryIcon';
import DocumentAddModal from '@/components/Project/DocumentAddModal';
import KoreanFieldworkHierarchyBoard from '@/components/Project/KoreanFieldworkHierarchyBoard';
import KoreanFieldworkPriorityTaskList from '@/components/Project/KoreanFieldworkPriorityTaskList';
import KoreanFieldworkProgressBoard from '@/components/Project/KoreanFieldworkProgressBoard';
import KoreanFieldworkScopePanel from '@/components/Project/KoreanFieldworkScopePanel';
import KoreanFieldworkUnitMatrix from '@/components/Project/KoreanFieldworkUnitMatrix';
import KoreanFieldworkWorkbenchPanel from '@/components/Project/KoreanFieldworkWorkbenchPanel';
import {
  getKoreanFieldworkCategoryLabel,
  KOREAN_FIELDWORK_CATEGORIES,
} from '@/components/Project/korean-fieldwork-categories';
import { getKoreanFieldworkAllowedChildCategoryNames } from '@/components/Project/korean-fieldwork-child-records';
import {
  getKoreanFieldworkCloseoutSummary,
  KoreanFieldworkCloseoutStatus,
  KoreanFieldworkCloseoutSummary,
} from '@/components/Project/korean-fieldwork-closeout';
import {
  formatKoreanFieldworkParentPath,
  getKoreanFieldworkRecordStatusChips,
  KoreanFieldworkStatusChip,
  KoreanFieldworkStatusTone,
} from '@/components/Project/korean-fieldwork-record-summary';
import {
  getKoreanFieldworkEvidenceChips,
  KoreanFieldworkEvidenceChip,
} from '@/components/Project/korean-fieldwork-record-evidence';
import {
  getKoreanFieldworkRecordActionSummary,
  KoreanFieldworkRecordActionItem,
} from '@/components/Project/korean-fieldwork-record-actions';
import {
  getKoreanFieldworkPriorityTasks,
  getKoreanFieldworkTodayActionTargets,
} from '@/components/Project/korean-fieldwork-today-actions';
import {
  getKoreanFieldworkRecordWorkFilterCounts,
  KOREAN_FIELDWORK_RECORD_WORK_FILTERS,
  KoreanFieldworkRecordWorkFilterId,
  matchesKoreanFieldworkRecordWorkFilter,
} from '@/components/Project/korean-fieldwork-record-work-filters';
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
    label: '트렌치·유구',
    categories: [
      KOREAN_FIELDWORK_CATEGORIES.TRENCH,
      KOREAN_FIELDWORK_CATEGORIES.FEATURE_GROUP,
      KOREAN_FIELDWORK_CATEGORIES.FEATURE,
      KOREAN_FIELDWORK_CATEGORIES.FEATURE_SEGMENT,
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
    title: '트렌치·유구군·유구·피트·구간·층위',
    subtitle: '한국 야장 기록의 중심 단위',
    categories: [
      KOREAN_FIELDWORK_CATEGORIES.TRENCH,
      KOREAN_FIELDWORK_CATEGORIES.FEATURE_GROUP,
      KOREAN_FIELDWORK_CATEGORIES.FEATURE,
      KOREAN_FIELDWORK_CATEGORIES.FEATURE_SEGMENT,
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

const DocumentsList: React.FC = () => {
  const {
    documents,
    clearHierarchy,
    hierarchyPath,
    onDocumentSelected,
    onParentSelected,
    popFromHierarchy,
  } = useContext(ProjectContext);
  const config = useContext(ConfigurationContext);
  const { labels } = useContext(LabelsContext);
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [activeWorkFilter, setActiveWorkFilter] =
    useState<KoreanFieldworkRecordWorkFilterId>('all');
  const [query, setQuery] = useState('');
  const [addModalParent, setAddModalParent] = useState<Document>();
  const now = useMemo(() => new Date(), []);

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

  const getCategoryLabel = useCallback((categoryName: string) => {
    const category = config.getCategory(categoryName);
    if (category && labels) return labels.get(category);

    return getKoreanFieldworkCategoryLabel(categoryName);
  }, [config, labels]);

  const categoryFilteredDocuments = useMemo(() => documents.filter((document) => {
    const filterCategories = activeFilterDefinition.categories;
    return filterCategories.length === 0
      || filterCategories.includes(document.resource.category);
  }), [
    activeFilterDefinition,
    documents,
  ]);
  const workFilterCounts = useMemo(
    () => getKoreanFieldworkRecordWorkFilterCounts(
      categoryFilteredDocuments,
      documents,
      todaySummary.issueCountByDocumentId,
      now
    ),
    [categoryFilteredDocuments, documents, now, todaySummary.issueCountByDocumentId]
  );
  const filteredDocuments = useMemo(() => categoryFilteredDocuments.filter((document) => {
    const matchesWorkFilter = matchesKoreanFieldworkRecordWorkFilter(
      document,
      activeWorkFilter,
      documents,
      todaySummary.issueCountByDocumentId,
      now
    );
    const matchesQuery = !normalizedQuery
      || getSearchableText(document, getCategoryLabel(document.resource.category))
        .includes(normalizedQuery);

    return matchesWorkFilter && matchesQuery;
  }), [
    activeWorkFilter,
    categoryFilteredDocuments,
    documents,
    getCategoryLabel,
    now,
    normalizedQuery,
    todaySummary.issueCountByDocumentId,
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
  const actionTargets = useMemo(
    () => getKoreanFieldworkTodayActionTargets(todaySummary, documents),
    [documents, todaySummary]
  );
  const priorityTasks = useMemo(
    () => getKoreanFieldworkPriorityTasks(todaySummary, documents, 5),
    [documents, todaySummary]
  );
  const closeoutSummary = useMemo(
    () => getKoreanFieldworkCloseoutSummary(todaySummary.openIssues, 5),
    [todaySummary.openIssues]
  );
  const currentScopeParent = hierarchyPath[hierarchyPath.length - 1];
  const hierarchyLabel = hierarchyPath.length > 0
    ? hierarchyPath.map((document) => document.resource.identifier).join(' / ')
    : '전체 조사자료';

  const openMap = () => router.navigate('/ProjectScreen/DocumentsMap');
  const editDocumentById = (docId: string, categoryName: string) => {
    router.navigate({
      pathname: '/ProjectScreen/DocumentEdit',
      params: {
        docId,
        categoryName,
      },
    });
  };
  const editDocument = (document: Document) => {
    editDocumentById(document.resource.id, document.resource.category);
  };
  const openAddChildModal = (document: Document) => setAddModalParent(document);
  const closeAddChildModal = () => setAddModalParent(undefined);
  const navigateAddCategory = (
    categoryName: string,
    parentDoc: Document | undefined
  ) => {
    closeAddChildModal();

    if (!parentDoc) return;

    router.navigate({
      pathname: '/ProjectScreen/DocumentAdd',
      params: {
        parentDocId: parentDoc.resource.id,
        categoryName,
      },
    });
  };
  const openDailyLog = () => {
    if (actionTargets.dailyLog) {
      editDocument(actionTargets.dailyLog);
      return;
    }

    if (actionTargets.primaryOperation) {
      navigateAddCategory(
        KOREAN_FIELDWORK_CATEGORIES.DAILY_LOG,
        actionTargets.primaryOperation
      );
    } else {
      openMap();
    }
  };
  const openFirstCandidate = () => {
    if (actionTargets.featureCandidate) {
      onDocumentSelected(actionTargets.featureCandidate);
      return;
    }

    if (actionTargets.featureDraftParent) {
      navigateAddCategory(
        KOREAN_FIELDWORK_CATEGORIES.FEATURE,
        actionTargets.featureDraftParent
      );
    } else {
      openMap();
    }
  };
  const openFirstIssue = () => actionTargets.issueDocument
    ? onDocumentSelected(actionTargets.issueDocument)
    : openMap();

  return (
    <View style={styles.screen}>
      {addModalParent && (
        <DocumentAddModal
          onClose={closeAddChildModal}
          parentDoc={addModalParent}
          onAddCategory={navigateAddCategory}
        />
      )}
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

        <KoreanFieldworkWorkbenchPanel
          summary={todaySummary}
          documents={documents}
          onEditDocument={editDocumentById}
        />

        <KoreanFieldworkProgressBoard
          summary={todaySummary}
          documents={documents}
          onAddDocumentOfCategory={(parentDoc, categoryName) =>
            navigateAddCategory(categoryName, parentDoc)}
          onOpenDocument={onDocumentSelected}
          onOpenMap={openMap}
        />

        <KoreanFieldworkScopePanel
          documents={documents}
          hierarchyPath={hierarchyPath}
          issueCount={todaySummary.openIssues.length}
          onAddChild={openAddChildModal}
          onBackScope={popFromHierarchy}
          onClearScope={clearHierarchy}
          onOpenMap={openMap}
        />

        <KoreanFieldworkUnitMatrix
          summary={todaySummary}
          documents={documents}
          scopeParent={currentScopeParent}
          onOpenDocument={onDocumentSelected}
          onAddDocumentOfCategory={(parentDoc, categoryName) =>
            navigateAddCategory(categoryName, parentDoc)}
        />

        <KoreanFieldworkHierarchyBoard
          documents={documents}
          documentsById={documentsById}
          hierarchyPath={hierarchyPath}
          issueCountByDocumentId={todaySummary.issueCountByDocumentId}
          onOpenDocument={onDocumentSelected}
          onDrillDown={onParentSelected}
          onAddChild={openAddChildModal}
        />

        <View style={styles.actionBand}>
          <QuickAction
            icon="event-note"
            label="오늘 일지"
            detail={todaySummary.dailyLogs.length > 0
              ? '작성 내용 보기'
              : actionTargets.primaryOperation ? '바로 작성' : '조사구역 필요'}
            onPress={openDailyLog}
          />
          <QuickAction
            icon="add-location-alt"
            label="유구 후보"
            detail={todaySummary.featureCandidates.length > 0
              ? `${todaySummary.featureCandidates.length}건 확인`
              : actionTargets.featureDraftParent ? '후보 추가' : '조사구역 필요'}
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

        {priorityTasks.length > 0 && (
          <View style={styles.priorityTaskBand}>
            <KoreanFieldworkPriorityTaskList
              tasks={priorityTasks}
              documentsById={documentsById}
              onAddDocumentOfCategory={(parentDoc, categoryName) =>
                navigateAddCategory(categoryName, parentDoc)}
              onOpenDocument={onDocumentSelected}
              onOpenMap={openMap}
            />
          </View>
        )}

        <View style={styles.searchBand}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color="#586069" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="식별자, 설명, 트렌치·유구·시료 검색"
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
          <View style={styles.workFilterHeader}>
            <Text style={styles.workFilterTitle}>작업 상태</Text>
            <Text style={styles.workFilterCount}>
              {workFilterCounts[activeWorkFilter]}건
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.workFilterRow}
          >
            {KOREAN_FIELDWORK_RECORD_WORK_FILTERS.map((filter) => {
              const isActive = activeWorkFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  activeOpacity={0.86}
                  style={[
                    styles.workFilterChip,
                    isActive && styles.workFilterChipActive,
                  ]}
                  onPress={() => setActiveWorkFilter(filter.id)}
                >
                  <MaterialIcons
                    name={filter.icon as keyof typeof MaterialIcons.glyphMap}
                    size={15}
                    color={isActive ? 'white' : '#344054'}
                  />
                  <Text
                    style={[
                      styles.workFilterChipText,
                      isActive && styles.workFilterChipTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                  <Text
                    style={[
                      styles.workFilterChipCount,
                      isActive && styles.workFilterChipTextActive,
                    ]}
                  >
                    {workFilterCounts[filter.id]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <CloseoutPanel
          summary={closeoutSummary}
          documentsById={documentsById}
          onOpenDocument={onDocumentSelected}
        />

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
                검색어나 분류를 바꾸거나, 지도 야장에서 조사구역·트렌치·유구를 추가하세요.
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
              onAddChild={openAddChildModal}
              onAddDocumentOfCategory={(parentDoc, categoryName) =>
                navigateAddCategory(categoryName, parentDoc)}
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
              onAddChild={openAddChildModal}
              onAddDocumentOfCategory={(parentDoc, categoryName) =>
                navigateAddCategory(categoryName, parentDoc)}
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

const CloseoutPanel: React.FC<{
  summary: KoreanFieldworkCloseoutSummary;
  documentsById: Map<string, Document>;
  onOpenDocument: (document: Document) => void;
}> = ({ summary, documentsById, onOpenDocument }) => (
  <View style={[styles.closeoutPanel, closeoutPanelStyle(summary.status)]}>
    <View style={styles.closeoutHeader}>
      <View style={styles.closeoutTitleRow}>
        <MaterialIcons
          name={closeoutIcon(summary.status)}
          size={19}
          color={closeoutColor(summary.status)}
        />
        <Text style={[styles.closeoutTitle, { color: closeoutColor(summary.status) }]}>
          오늘 마감 점검 · {summary.title}
        </Text>
      </View>
      <View style={styles.closeoutCountRow}>
        <CloseoutCount label="중대" value={summary.counts.critical} tone="critical" />
        <CloseoutCount label="주의" value={summary.counts.warning} tone="warning" />
        <CloseoutCount label="참고" value={summary.counts.info} tone="info" />
      </View>
    </View>
    <Text style={styles.closeoutDetail}>{summary.detail}</Text>
    {summary.issues.map((issue) => {
      const document = documentsById.get(issue.documentId);

      return (
        <TouchableOpacity
          key={`${issue.documentId}-${issue.ruleId}`}
          activeOpacity={0.86}
          style={[styles.closeoutIssueRow, closeoutIssueStyle(issue.severity)]}
          disabled={!document}
          onPress={() => document && onOpenDocument(document)}
        >
          <View style={[styles.closeoutSeverityBar, closeoutSeverityBarStyle(issue.severity)]} />
          <View style={styles.closeoutIssueText}>
            <Text style={styles.closeoutIssueIdentifier} numberOfLines={1}>
              {issue.identifier}
            </Text>
            <Text style={styles.closeoutIssueAction} numberOfLines={2}>
              {issue.recommendedAction}
            </Text>
          </View>
          {document && (
            <MaterialIcons name="chevron-right" size={18} color="#667085" />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

const CloseoutCount: React.FC<{
  label: string;
  value: number;
  tone: 'critical'|'warning'|'info';
}> = ({ label, value, tone }) => (
  <View style={[styles.closeoutCount, closeoutCountStyle(tone)]}>
    <Text style={[styles.closeoutCountValue, { color: closeoutCountColor(tone) }]}>
      {value}
    </Text>
    <Text style={styles.closeoutCountLabel}>{label}</Text>
  </View>
);

const closeoutPanelStyle = (status: KoreanFieldworkCloseoutStatus) => {
  switch (status) {
    case 'blocked':
      return styles.closeoutPanelBlocked;
    case 'needsReview':
      return styles.closeoutPanelReview;
    default:
      return styles.closeoutPanelClear;
  }
};

const closeoutCountStyle = (tone: 'critical'|'warning'|'info') => {
  switch (tone) {
    case 'critical':
      return styles.closeoutCountBlocked;
    case 'warning':
      return styles.closeoutCountReview;
    default:
      return styles.closeoutCountInfo;
  }
};

const closeoutIcon = (
  status: KoreanFieldworkCloseoutStatus
): keyof typeof MaterialIcons.glyphMap => {
  switch (status) {
    case 'blocked':
      return 'report';
    case 'needsReview':
      return 'fact-check';
    default:
      return 'verified';
  }
};

const closeoutColor = (status: KoreanFieldworkCloseoutStatus): string => {
  switch (status) {
    case 'blocked':
      return colors.danger;
    case 'needsReview':
      return '#b54708';
    default:
      return '#027a48';
  }
};

const closeoutCountColor = (tone: 'critical'|'warning'|'info'): string => {
  switch (tone) {
    case 'critical':
      return colors.danger;
    case 'warning':
      return '#b54708';
    default:
      return '#175cd3';
  }
};

const closeoutIssueStyle = (
  severity: 'critical'|'warning'|'info'
) => {
  switch (severity) {
    case 'critical':
      return styles.closeoutIssueCritical;
    case 'warning':
      return styles.closeoutIssueWarning;
    default:
      return styles.closeoutIssueInfo;
  }
};

const closeoutSeverityBarStyle = (
  severity: 'critical'|'warning'|'info'
) => {
  switch (severity) {
    case 'critical':
      return styles.closeoutSeverityCritical;
    case 'warning':
      return styles.closeoutSeverityWarning;
    default:
      return styles.closeoutSeverityInfo;
  }
};

const RecordSection: React.FC<{
  title: string;
  subtitle: string;
  documents: Document[];
  documentsById: Map<string, Document>;
  getCategoryLabel: (categoryName: string) => string;
  issueCountByDocumentId: { [documentId: string]: number };
  onOpenDocument: (document: Document) => void;
  onDrillDown: (document: Document) => void;
  onAddChild: (document: Document) => void;
  onAddDocumentOfCategory: (parentDoc: Document, categoryName: string) => void;
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
  onAddChild,
  onAddDocumentOfCategory,
  onEditDocument,
}) => {
  const allDocuments = Array.from(documentsById.values());

  return (
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
          documents={allDocuments}
          contextPath={formatKoreanFieldworkParentPath(document, documentsById)}
          categoryLabel={getCategoryLabel(document.resource.category)}
          issueCount={issueCountByDocumentId[document.resource.id] ?? 0}
          onOpen={() => onOpenDocument(document)}
          onDrillDown={() => onDrillDown(document)}
          onAddChild={() => onAddChild(document)}
          onOpenEvidence={onOpenDocument}
          onAddEvidence={onAddDocumentOfCategory}
          onEdit={() => onEditDocument(document)}
        />
      ))}
    </View>
  );
};

const RecordRow: React.FC<{
  document: Document;
  documents: Document[];
  contextPath: string | undefined;
  categoryLabel: string;
  issueCount: number;
  onOpen: () => void;
  onDrillDown: () => void;
  onAddChild: () => void;
  onOpenEvidence: (document: Document) => void;
  onAddEvidence: (parentDoc: Document, categoryName: string) => void;
  onEdit: () => void;
}> = ({
  document,
  documents,
  contextPath,
  categoryLabel,
  issueCount,
  onOpen,
  onDrillDown,
  onAddChild,
  onOpenEvidence,
  onAddEvidence,
  onEdit,
}) => {
  const config = useContext(ConfigurationContext);
  const category = config.getCategory(document.resource.category);
  const title = document.resource.identifier || document.resource.id;
  const description = getRecordDescription(document);
  const statusChips = getKoreanFieldworkRecordStatusChips(document);
  const evidenceChips = getKoreanFieldworkEvidenceChips(document, documents);
  const allowedAddCategoryNames = useMemo(
    () => getKoreanFieldworkAllowedChildCategoryNames(document, config),
    [config, document]
  );
  const allowedEvidenceCategories = useMemo(
    () => new Set(allowedAddCategoryNames),
    [allowedAddCategoryNames]
  );
  const actionSummary = useMemo(
    () => getKoreanFieldworkRecordActionSummary(
      document,
      documents,
      allowedAddCategoryNames
    ),
    [allowedAddCategoryNames, document, documents]
  );
  const visibleActions = actionSummary.actions.slice(0, 2);

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
          {categoryLabel}{contextPath ? ` · 맥락 ${contextPath}` : ''}
        </Text>
        {statusChips.length > 0 && (
          <View style={styles.statusChipRow}>
            {statusChips.map((chip) => (
              <StatusChip key={`${title}-${chip.label}`} chip={chip} />
            ))}
          </View>
        )}
        {evidenceChips.length > 0 && (
          <View style={styles.evidenceChipRow}>
            {evidenceChips.map((chip) => {
              const [firstEvidenceDocument] = chip.documents;
              const canCreate = !firstEvidenceDocument
                && !!chip.createCategoryName
                && allowedEvidenceCategories.has(chip.createCategoryName);
              const isPressable = !!firstEvidenceDocument || canCreate;

              return (
                <EvidenceChip
                  key={`${title}-${chip.id}`}
                  chip={chip}
                  canCreate={canCreate}
                  disabled={!isPressable}
                  onPress={() => {
                    if (firstEvidenceDocument) {
                      onOpenEvidence(firstEvidenceDocument);
                      return;
                    }
                    if (canCreate && chip.createCategoryName) {
                      onAddEvidence(document, chip.createCategoryName);
                    }
                  }}
                />
              );
            })}
          </View>
        )}
        {description && (
          <Text style={styles.recordDescription} numberOfLines={2}>
            {description}
          </Text>
        )}
        {actionSummary.isTracked && (
          <RecordWorkSummary
            summary={actionSummary}
            actions={visibleActions}
            onActionPress={(action) => {
              if (action.type === 'openDocument' && action.document) {
                onOpenEvidence(action.document);
                return;
              }

              if (action.type === 'createDocument' && action.categoryName) {
                onAddEvidence(document, action.categoryName);
              }
            }}
          />
        )}
      </View>
      <View style={styles.recordActions}>
        <TouchableOpacity
          accessibilityLabel={`${title} 하위 기록 추가`}
          style={styles.iconButton}
          onPress={onAddChild}
          hitSlop={8}
        >
          <MaterialIcons name="add" size={20} color="#475467" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel={`${title} 하위 기록 보기`}
          style={styles.iconButton}
          onPress={onDrillDown}
          hitSlop={8}
        >
          <MaterialIcons name="account-tree" size={20} color="#475467" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel={`${title} 편집`}
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

const RecordWorkSummary: React.FC<{
  summary: ReturnType<typeof getKoreanFieldworkRecordActionSummary>;
  actions: KoreanFieldworkRecordActionItem[];
  onActionPress: (action: KoreanFieldworkRecordActionItem) => void;
}> = ({ summary, actions, onActionPress }) => (
  <View style={styles.recordWorkPanel}>
    <View style={styles.recordWorkSummaryRow}>
      <View style={styles.recordWorkPercentTrack}>
        <View
          style={[
            styles.recordWorkPercentFill,
            recordWorkPercentFillStyle(summary.tone),
            { width: `${summary.completionPercent}%` },
          ]}
        />
      </View>
      <Text style={[styles.recordWorkPercent, recordWorkPercentTextStyle(summary.tone)]}>
        {summary.completionPercent}%
      </Text>
      <Text style={styles.recordWorkMetric}>하위 {summary.structureCount}</Text>
      <Text style={styles.recordWorkMetric}>증거 {summary.evidenceCount}</Text>
      {summary.issueCount > 0 && (
        <Text style={styles.recordWorkIssue}>점검 {summary.issueCount}</Text>
      )}
      {summary.checklistTotal > 0 && (
        <Text style={styles.recordWorkMetric}>
          과정 {summary.checklistDone}/{summary.checklistTotal}
        </Text>
      )}
    </View>
    {actions.length > 0 && (
      <View style={styles.recordWorkActionRow}>
        {actions.map((action) => (
          <RecordWorkActionButton
            key={action.id}
            action={action}
            onPress={(event) => {
              event.stopPropagation();
              onActionPress(action);
            }}
          />
        ))}
      </View>
    )}
  </View>
);

const RecordWorkActionButton: React.FC<{
  action: KoreanFieldworkRecordActionItem;
  onPress: (event: GestureResponderEvent) => void;
}> = ({ action, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.84}
    accessibilityLabel={action.label}
    onPress={onPress}
    style={[styles.recordWorkActionButton, recordWorkActionStyle(action.tone)]}
  >
    <MaterialIcons
      name={action.icon as keyof typeof MaterialIcons.glyphMap}
      size={14}
      color={recordWorkActionColor(action.tone)}
    />
    <View style={styles.recordWorkActionTextWrap}>
      <Text style={styles.recordWorkActionLabel} numberOfLines={1}>
        {action.label}
      </Text>
      <Text style={styles.recordWorkActionDetail} numberOfLines={1}>
        {action.detail}
      </Text>
    </View>
  </TouchableOpacity>
);

const EvidenceChip: React.FC<{
  chip: KoreanFieldworkEvidenceChip;
  canCreate: boolean;
  disabled: boolean;
  onPress: () => void;
}> = ({
  chip,
  canCreate,
  disabled,
  onPress,
}) => {
  const isFilled = chip.tone === 'filled';
  const textStyle = isFilled || canCreate
    ? styles.evidenceChipTextFilled
    : styles.evidenceChipTextEmpty;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      accessibilityLabel={`${chip.label} ${chip.count}건${canCreate ? ', 추가' : ''}`}
      disabled={disabled}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      style={[
        styles.evidenceChip,
        isFilled ? styles.evidenceChipFilled : styles.evidenceChipEmpty,
        canCreate && styles.evidenceChipCreate,
        disabled && styles.evidenceChipDisabled,
      ]}
    >
      <Text style={[styles.evidenceChipLabel, textStyle]}>{chip.label}</Text>
      <Text style={[styles.evidenceChipCount, textStyle]}>{chip.count}</Text>
      {canCreate && (
        <MaterialIcons name="add" size={13} color="#175cd3" />
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

const statusChipToneStyle = (
  tone: KoreanFieldworkStatusTone
) => {
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

const statusChipTextToneStyle = (
  tone: KoreanFieldworkStatusTone
) => {
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

const recordWorkPercentFillStyle = (
  tone: KoreanFieldworkStatusTone
) => {
  switch (tone) {
    case 'success':
      return styles.recordWorkPercentFillSuccess;
    case 'warning':
      return styles.recordWorkPercentFillWarning;
    case 'danger':
      return styles.recordWorkPercentFillDanger;
    case 'info':
      return styles.recordWorkPercentFillInfo;
    default:
      return styles.recordWorkPercentFillNeutral;
  }
};

const recordWorkPercentTextStyle = (
  tone: KoreanFieldworkStatusTone
) => {
  switch (tone) {
    case 'success':
      return styles.recordWorkPercentSuccess;
    case 'warning':
      return styles.recordWorkPercentWarning;
    case 'danger':
      return styles.recordWorkPercentDanger;
    case 'info':
      return styles.recordWorkPercentInfo;
    default:
      return styles.recordWorkPercentNeutral;
  }
};

const recordWorkActionStyle = (
  tone: KoreanFieldworkStatusTone
) => {
  switch (tone) {
    case 'success':
      return styles.recordWorkActionSuccess;
    case 'warning':
      return styles.recordWorkActionWarning;
    case 'danger':
      return styles.recordWorkActionDanger;
    case 'info':
      return styles.recordWorkActionInfo;
    default:
      return styles.recordWorkActionNeutral;
  }
};

const recordWorkActionColor = (tone: KoreanFieldworkStatusTone): string => {
  switch (tone) {
    case 'success':
      return '#027a48';
    case 'warning':
      return '#b54708';
    case 'danger':
      return colors.danger;
    case 'info':
      return '#175cd3';
    default:
      return '#475467';
  }
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
  priorityTaskBand: {
    backgroundColor: 'white',
    borderBottomColor: '#d0d5dd',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
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
  workFilterHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  workFilterTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
  },
  workFilterCount: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '800',
  },
  workFilterRow: {
    paddingTop: 8,
  },
  workFilterChip: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: 8,
    minHeight: 36,
    paddingHorizontal: 10,
  },
  workFilterChipActive: {
    backgroundColor: '#175cd3',
    borderColor: '#175cd3',
  },
  workFilterChipText: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 5,
  },
  workFilterChipTextActive: {
    color: 'white',
  },
  workFilterChipCount: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 6,
    minWidth: 14,
    textAlign: 'right',
  },
  closeoutPanel: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  closeoutPanelBlocked: {
    backgroundColor: '#fff8f8',
    borderBottomColor: '#f0b7bd',
  },
  closeoutPanelReview: {
    backgroundColor: '#fffbeb',
    borderBottomColor: '#fedf89',
  },
  closeoutPanelClear: {
    backgroundColor: '#f6fef9',
    borderBottomColor: '#abefc6',
  },
  closeoutHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeoutTitleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    paddingRight: 8,
  },
  closeoutTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 6,
  },
  closeoutDetail: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  closeoutCountRow: {
    flexDirection: 'row',
  },
  closeoutCount: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 4,
    minWidth: 42,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  closeoutCountBlocked: {
    backgroundColor: '#fff1f3',
    borderColor: '#fecdca',
  },
  closeoutCountReview: {
    backgroundColor: '#fffaeb',
    borderColor: '#fedf89',
  },
  closeoutCountInfo: {
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
  },
  closeoutCountValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  closeoutCountLabel: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1,
  },
  closeoutIssueRow: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 7,
    minHeight: 50,
    overflow: 'hidden',
    paddingRight: 9,
  },
  closeoutIssueCritical: {
    borderColor: '#fecdca',
  },
  closeoutIssueWarning: {
    borderColor: '#fedf89',
  },
  closeoutIssueInfo: {
    borderColor: '#b2ddff',
  },
  closeoutSeverityBar: {
    alignSelf: 'stretch',
    width: 4,
  },
  closeoutSeverityCritical: {
    backgroundColor: colors.danger,
  },
  closeoutSeverityWarning: {
    backgroundColor: '#dc6803',
  },
  closeoutSeverityInfo: {
    backgroundColor: '#1570ef',
  },
  closeoutIssueText: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  closeoutIssueIdentifier: {
    color: '#27343b',
    fontSize: 12,
    fontWeight: '900',
  },
  closeoutIssueAction: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
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
  statusChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  statusChip: {
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 4,
    marginRight: 5,
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
  evidenceChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
    marginTop: 5,
  },
  evidenceChip: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    height: 24,
    marginBottom: 4,
    marginHorizontal: 2,
    paddingHorizontal: 6,
  },
  evidenceChipFilled: {
    backgroundColor: '#eef4ff',
    borderColor: '#c7d7fe',
  },
  evidenceChipEmpty: {
    backgroundColor: '#f8fafc',
    borderColor: '#eaecf0',
  },
  evidenceChipCreate: {
    backgroundColor: '#eff8ff',
    borderColor: '#b2ddff',
  },
  evidenceChipDisabled: {
    opacity: 0.75,
  },
  evidenceChipLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  evidenceChipCount: {
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 4,
  },
  evidenceChipTextFilled: {
    color: '#3538cd',
  },
  evidenceChipTextEmpty: {
    color: '#98a2b3',
  },
  recordDescription: {
    color: '#344054',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  recordWorkPanel: {
    backgroundColor: '#f8fafc',
    borderColor: '#eaecf0',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  recordWorkSummaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  recordWorkPercentTrack: {
    backgroundColor: '#e4e7ec',
    borderRadius: 4,
    flex: 1,
    height: 8,
    marginRight: 7,
    overflow: 'hidden',
  },
  recordWorkPercentFill: {
    borderRadius: 4,
    height: 8,
  },
  recordWorkPercentFillNeutral: {
    backgroundColor: '#98a2b3',
  },
  recordWorkPercentFillInfo: {
    backgroundColor: '#1570ef',
  },
  recordWorkPercentFillSuccess: {
    backgroundColor: '#12b76a',
  },
  recordWorkPercentFillWarning: {
    backgroundColor: '#f79009',
  },
  recordWorkPercentFillDanger: {
    backgroundColor: colors.danger,
  },
  recordWorkPercent: {
    fontSize: 11,
    fontWeight: '900',
    marginRight: 7,
    minWidth: 34,
    textAlign: 'right',
  },
  recordWorkPercentNeutral: {
    color: '#475467',
  },
  recordWorkPercentInfo: {
    color: '#175cd3',
  },
  recordWorkPercentSuccess: {
    color: '#027a48',
  },
  recordWorkPercentWarning: {
    color: '#b54708',
  },
  recordWorkPercentDanger: {
    color: colors.danger,
  },
  recordWorkMetric: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 5,
  },
  recordWorkIssue: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 5,
  },
  recordWorkActionRow: {
    flexDirection: 'row',
    marginHorizontal: -3,
    marginTop: 7,
  },
  recordWorkActionButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 3,
    minHeight: 42,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  recordWorkActionNeutral: {
    borderColor: '#d0d5dd',
  },
  recordWorkActionInfo: {
    borderColor: '#b2ddff',
  },
  recordWorkActionSuccess: {
    borderColor: '#abefc6',
  },
  recordWorkActionWarning: {
    borderColor: '#fedf89',
  },
  recordWorkActionDanger: {
    borderColor: '#fecdca',
  },
  recordWorkActionTextWrap: {
    flex: 1,
    marginLeft: 5,
    minWidth: 0,
  },
  recordWorkActionLabel: {
    color: '#27343b',
    fontSize: 11,
    fontWeight: '900',
  },
  recordWorkActionDetail: {
    color: '#667085',
    fontSize: 10,
    marginTop: 1,
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
