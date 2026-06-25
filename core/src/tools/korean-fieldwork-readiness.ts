import { Document } from '../model/document/document';

export type KoreanFieldworkReadinessSeverity = 'info'|'warning'|'critical';

export interface KoreanFieldworkReadinessIssue {
    ruleId: string;
    documentId: string;
    identifier: string;
    category: string;
    severity: KoreanFieldworkReadinessSeverity;
    message: string;
    relatedFields: string[];
    recommendedAction: string;
    blocksSave: boolean;
}

export interface KoreanFieldworkReadinessRule {
    id: string;
    label: string;
    relatedFields: string[];
    evaluate: (document: Document, documents: Document[]) => KoreanFieldworkReadinessIssue[];
}

export interface EvidenceBundle {
    rootDocument: Document;
    featureSegments: Document[];
    layers: Document[];
    photos: Document[];
    soilProfilePhotos: Document[];
    drawings: Document[];
    penMemos: Document[];
    finds: Document[];
    samples: Document[];
    reportPreparationReviews: Document[];
    reportEditorialCrossChecks: Document[];
    issues: KoreanFieldworkReadinessIssue[];
}

export interface KoreanFieldworkTodaySummary {
    dailyLogs: Document[];
    surveyBoundaries: Document[];
    featureCandidates: Document[];
    openIssues: KoreanFieldworkReadinessIssue[];
    issueCountByDocumentId: { [documentId: string]: number };
}

export interface TermAuthorityMatch {
    authority: Document;
    aliases: Document[];
    matchedText: string;
}

const CHECKLIST = {
    PRE_INVESTIGATION_PHOTO: 'preInvestigationPhotoTaken',
    IN_PROGRESS_PHOTO: 'inProgressPhotoTaken',
    SOIL_PROFILE_PHOTO: 'soilProfilePhotoLinked',
    COMPLETION_PHOTO: 'completionPhotoTaken',
    MEASURED_DRAWING: 'measuredDrawingCompleted',
    PRE_RECOVERY_FIND_PHOTO: 'preRecoveryFindPhotoTaken',
    FINDS_RECOVERED: 'findsRecovered',
    FIND_RECORDS_LINKED: 'findRecordsLinked',
    SAMPLES_COLLECTED: 'samplesCollected'
};

const REPORT_REVIEW_CATEGORIES = ['ReportPreparationReview', 'ReportEditorialCrossCheck'];
const FEATURE_CATEGORIES = ['Feature', 'FeatureSegment'];
const MEDIA_RELATIONS = ['depicts', 'isDepictedIn', 'isSubjectOf', 'isResultOf'];
const CONTAINMENT_RELATIONS = ['liesWithin', 'isRecordedInFeature'];

export const KOREAN_FIELDWORK_READINESS_RULES: KoreanFieldworkReadinessRule[] = [
    {
        id: 'feature-complete-photo',
        label: '완료된 유구는 완료 사진 확인을 남겨야 함',
        relatedFields: ['featureRecordingStatus', 'featureInvestigationChecklist'],
        evaluate: (document) => {
            if (!isFeatureLike(document)) return [];
            if (document.resource.featureRecordingStatus !== 'confirmed') return [];
            if (hasChecklistValue(document, CHECKLIST.COMPLETION_PHOTO)) return [];

            return [makeIssue(
                document,
                'feature-complete-photo',
                'warning',
                '유구가 확인 상태지만 완료 사진 항목이 체크되지 않았습니다.',
                ['featureRecordingStatus', 'featureInvestigationChecklist'],
                '현장 마감 전 완료 사진을 남겼는지 확인하세요.'
            )];
        }
    },
    {
        id: 'finds-recovered-pre-photo',
        label: '유물 수습 전 사진 확인',
        relatedFields: ['featureInvestigationChecklist'],
        evaluate: (document) => {
            if (!isFeatureLike(document)) return [];
            if (!hasChecklistValue(document, CHECKLIST.FINDS_RECOVERED)) return [];
            if (hasChecklistValue(document, CHECKLIST.PRE_RECOVERY_FIND_PHOTO)) return [];

            return [makeIssue(
                document,
                'finds-recovered-pre-photo',
                'warning',
                '유물 수습은 표시되어 있지만 수습 전 사진 항목이 체크되지 않았습니다.',
                ['featureInvestigationChecklist'],
                '수습 전 사진 상태를 확인하거나 예외 사유를 유구 메모에 남기세요.'
            )];
        }
    },
    {
        id: 'soil-profile-photo-count',
        label: '토층 사진 수와 관련 자료 확인',
        relatedFields: ['featureSoilProfilePhotoCount', 'featureInvestigationChecklist'],
        evaluate: (document, documents) => {
            if (!isFeatureLike(document)) return [];

            const expectedCount = Number(document.resource.featureSoilProfilePhotoCount ?? 0);
            const linkedCount = getLinkedDocuments(document, documents)
                .filter((linkedDocument) => linkedDocument.resource.category === 'SoilProfilePhoto')
                .length;

            if (expectedCount === 0 && !hasChecklistValue(document, CHECKLIST.SOIL_PROFILE_PHOTO)) return [];
            if (linkedCount >= Math.max(expectedCount, 1)) return [];

            return [makeIssue(
                document,
                'soil-profile-photo-count',
                'warning',
                '토층 사진이 필요한 상태지만 관련 토층 사진 기록이 부족합니다.',
                ['featureSoilProfilePhotoCount', 'featureInvestigationChecklist'],
                '유구를 마감하기 전 토층 사진 기록을 만들어 남기세요.'
            )];
        }
    },
    {
        id: 'feature-geometry-needs-aerial-alignment',
        label: '항공 레이어 보정 필요 유구선 확인',
        relatedFields: [
            'featureGeometryEditStatus',
            'featureGeometryReferenceLayerId',
            'featureGeometryRevisionHistory'
        ],
        evaluate: (document) => {
            if (!isFeatureLike(document)) return [];
            if (document.resource.featureGeometryEditStatus !== 'needsAerialAlignment') return [];

            return [makeIssue(
                document,
                'feature-geometry-needs-aerial-alignment',
                'info',
                '유구선이 항공 레이어 보정 필요 상태입니다.',
                [
                    'featureGeometryEditStatus',
                    'featureGeometryReferenceLayerId',
                    'featureGeometryRevisionHistory'
                ],
                '기존 유구 기록은 유지한 채 현재 드론·항공 레이어 기준으로 유구선을 보정하세요.'
            )];
        }
    },
    {
        id: 'sample-purpose',
        label: '시료 채취 목적 확인',
        relatedFields: ['samplePurpose'],
        evaluate: (document) => {
            if (document.resource.category !== 'Sample') return [];
            if (hasValue(document.resource.samplePurpose)) return [];

            return [makeIssue(
                document,
                'sample-purpose',
                'warning',
                '시료의 분석 또는 채취 목적이 비어 있습니다.',
                ['samplePurpose'],
                '인계 전 해당 시료를 채취한 이유를 기록하세요.'
            )];
        }
    },
    {
        id: 'find-label-register',
        label: '유물 라벨·대장 정리 확인',
        relatedFields: ['artifactLabelRegisterLink'],
        evaluate: (document) => {
            if (document.resource.category !== 'Find') return [];
            if (hasValue(document.resource.artifactLabelRegisterLink)) return [];

            return [makeIssue(
                document,
                'find-label-register',
                'info',
                '유물의 라벨·대장 정리 정보가 기록되지 않았습니다.',
                ['artifactLabelRegisterLink'],
                '라벨, 봉투, 유물대장, 이후 목록화 정리 상태를 확인하세요.'
            )];
        }
    },
    {
        id: 'field-only-timing',
        label: '현장 한정 관찰 기록 시점 확인',
        relatedFields: ['fieldOnlyMissingCheck', 'firstExposureRecord', 'recordCreationTiming'],
        evaluate: (document) => {
            if (!hasValue(document.resource.fieldOnlyMissingCheck)
                    && !hasValue(document.resource.firstExposureRecord)) return [];
            if (hasValue(document.resource.recordCreationTiming)) return [];

            return [makeIssue(
                document,
                'field-only-timing',
                'warning',
                '현장에서만 확인 가능한 관찰 내용이 있지만 기록 생성 시점이 비어 있습니다.',
                ['fieldOnlyMissingCheck', 'firstExposureRecord', 'recordCreationTiming'],
                '추후 검토자가 복원 가능성을 판단할 수 있도록 관찰 기록 시점을 표시하세요.'
            )];
        }
    },
    {
        id: 'report-cross-check',
        label: '보고서 작성 전 교차 확인 대상 확인',
        relatedFields: ['reportCrossCheck'],
        evaluate: (document) => {
            if (!REPORT_REVIEW_CATEGORIES.includes(document.resource.category)) return [];
            if (hasValue(document.resource.reportCrossCheck)) return [];

            return [makeIssue(
                document,
                'report-cross-check',
                'warning',
                '보고서 검토 기록에 교차 확인 대상이 없습니다.',
                ['reportCrossCheck'],
                '원고, 사진대장, 도면대장, 유물목록, 시료목록 중 확인 대상을 남기세요.'
            )];
        }
    }
];

export function getKoreanFieldworkReadinessIssues(
    documents: Document[],
    rules: KoreanFieldworkReadinessRule[] = KOREAN_FIELDWORK_READINESS_RULES
): KoreanFieldworkReadinessIssue[] {

    return documents.reduce((issues: KoreanFieldworkReadinessIssue[], document) => {
        return issues.concat(...rules.map((rule) => rule.evaluate(document, documents)));
    }, []);
}

export function buildEvidenceBundle(rootDocument: Document, documents: Document[]): EvidenceBundle {

    const relatedDocuments = getRelatedDocuments(rootDocument, documents);
    const issueDocuments = [rootDocument].concat(relatedDocuments);

    return {
        rootDocument,
        featureSegments: filterByCategory(relatedDocuments, 'FeatureSegment'),
        layers: filterByCategory(relatedDocuments, 'Layer'),
        photos: filterByCategory(relatedDocuments, 'Photo'),
        soilProfilePhotos: filterByCategory(relatedDocuments, 'SoilProfilePhoto'),
        drawings: filterByCategory(relatedDocuments, 'Drawing'),
        penMemos: filterByCategory(relatedDocuments, 'PenMemo'),
        finds: filterByCategory(relatedDocuments, 'Find'),
        samples: filterByCategory(relatedDocuments, 'Sample'),
        reportPreparationReviews: filterByCategory(relatedDocuments, 'ReportPreparationReview'),
        reportEditorialCrossChecks: filterByCategory(relatedDocuments, 'ReportEditorialCrossCheck'),
        issues: getKoreanFieldworkReadinessIssues(issueDocuments)
    };
}

export function getKoreanFieldworkTodaySummary(documents: Document[]): KoreanFieldworkTodaySummary {

    const openIssues = getKoreanFieldworkReadinessIssues(documents);

    return {
        dailyLogs: filterByCategory(documents, 'DailyLog'),
        surveyBoundaries: filterByCategory(documents, 'SurveyBoundary'),
        featureCandidates: documents.filter((document) =>
            document.resource.category === 'Feature'
            && document.resource.featureRecordingStatus === 'candidate'
        ),
        openIssues,
        issueCountByDocumentId: openIssues.reduce((index, issue) => {
            index[issue.documentId] = (index[issue.documentId] ?? 0) + 1;
            return index;
        }, {} as { [documentId: string]: number })
    };
}

export function searchTermAuthorities(documents: Document[], query: string): TermAuthorityMatch[] {

    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];

    const authorityIds = new Set(filterByCategory(documents, 'TermAuthority')
        .map((authority) => authority.resource.id));
    const aliasesByAuthorityId = filterByCategory(documents, 'TermAlias')
        .reduce((index, alias) => {
            const authorityId = getRelationTargets(alias)
                .find((targetId) => authorityIds.has(targetId));
            if (!authorityId) return index;

            index[authorityId] = (index[authorityId] ?? []).concat(alias);
            return index;
        }, {} as { [authorityId: string]: Document[] });

    return filterByCategory(documents, 'TermAuthority')
        .map((authority) => {
            const aliases = aliasesByAuthorityId[authority.resource.id] ?? [];
            const searchableTexts = [
                authority.resource.identifier,
                authority.resource.shortDescription,
                authority.resource.termPreferredLabel,
                ...aliases.map((alias) => alias.resource.termAliasText)
            ].filter((value) => typeof value === 'string') as string[];
            const matchedText = searchableTexts.find((text) => normalize(text).includes(normalizedQuery));

            return matchedText ? { authority, aliases, matchedText } : undefined;
        })
        .filter((match): match is TermAuthorityMatch => match !== undefined);
}

function getRelatedDocuments(rootDocument: Document, documents: Document[]): Document[] {

    const relatedIds = new Set<string>([rootDocument.resource.id]);
    let changed = true;

    while (changed) {
        changed = false;

        documents.forEach((document) => {
            if (relatedIds.has(document.resource.id)) return;
            if (!hasRelationToAny(document, relatedIds)
                    && !hasAnyRelatedDocumentRelationTo(document.resource.id, relatedIds, documents)) return;

            relatedIds.add(document.resource.id);
            changed = true;
        });
    }

    return documents.filter((document) =>
        document.resource.id !== rootDocument.resource.id
        && relatedIds.has(document.resource.id)
    );
}

function getLinkedDocuments(document: Document, documents: Document[]): Document[] {

    return documents.filter((candidate) =>
        candidate.resource.id !== document.resource.id
        && hasRelationToAny(candidate, new Set([document.resource.id]))
    );
}

function hasAnyRelatedDocumentRelationTo(
    documentId: string,
    relatedIds: Set<string>,
    documents: Document[]
): boolean {

    return documents
        .filter((document) => relatedIds.has(document.resource.id))
        .some((relatedDocument) => getRelationTargets(relatedDocument).includes(documentId));
}

function hasRelationToAny(document: Document, targetIds: Set<string>): boolean {

    return getRelationTargets(document)
        .some((targetId) => targetIds.has(targetId));
}

function getRelationTargets(document: Document): string[] {

    return Object.entries(document.resource.relations ?? {})
        .reduce((targets, [relationName, relationTargets]) => {
            if (!MEDIA_RELATIONS.includes(relationName) && !CONTAINMENT_RELATIONS.includes(relationName)) {
                return targets;
            }
            if (!Array.isArray(relationTargets)) return targets;

            return targets.concat(relationTargets);
        }, [] as string[]);
}

function filterByCategory(documents: Document[], category: string): Document[] {

    return documents.filter((document) => document.resource.category === category);
}

function isFeatureLike(document: Document): boolean {

    return FEATURE_CATEGORIES.includes(document.resource.category);
}

function hasChecklistValue(document: Document, checklistValue: string): boolean {

    return Array.isArray(document.resource.featureInvestigationChecklist)
        && document.resource.featureInvestigationChecklist.includes(checklistValue);
}

function hasValue(value: any): boolean {

    return Array.isArray(value)
        ? value.length > 0
        : value !== undefined && value !== null && value !== '';
}

function makeIssue(
    document: Document,
    ruleId: string,
    severity: KoreanFieldworkReadinessSeverity,
    message: string,
    relatedFields: string[],
    recommendedAction: string
): KoreanFieldworkReadinessIssue {

    return {
        ruleId,
        documentId: document.resource.id,
        identifier: document.resource.identifier,
        category: document.resource.category,
        severity,
        message,
        relatedFields,
        recommendedAction,
        blocksSave: false
    };
}

function normalize(text: string): string {

    return text.trim().toLowerCase();
}
