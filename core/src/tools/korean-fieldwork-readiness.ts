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
        label: 'Completed features should keep a completion photo check',
        relatedFields: ['featureRecordingStatus', 'featureInvestigationChecklist'],
        evaluate: (document) => {
            if (!isFeatureLike(document)) return [];
            if (document.resource.featureRecordingStatus !== 'confirmed') return [];
            if (hasChecklistValue(document, CHECKLIST.COMPLETION_PHOTO)) return [];

            return [makeIssue(
                document,
                'feature-complete-photo',
                'warning',
                'Feature is confirmed but the completion photo checklist item is not checked.',
                ['featureRecordingStatus', 'featureInvestigationChecklist'],
                'Confirm whether the completion photo is linked before field closeout.'
            )];
        }
    },
    {
        id: 'finds-recovered-pre-photo',
        label: 'Find recovery should keep a pre-recovery photo check',
        relatedFields: ['featureInvestigationChecklist'],
        evaluate: (document) => {
            if (!isFeatureLike(document)) return [];
            if (!hasChecklistValue(document, CHECKLIST.FINDS_RECOVERED)) return [];
            if (hasChecklistValue(document, CHECKLIST.PRE_RECOVERY_FIND_PHOTO)) return [];

            return [makeIssue(
                document,
                'finds-recovered-pre-photo',
                'warning',
                'Finds are marked recovered but the pre-recovery find photo checklist item is not checked.',
                ['featureInvestigationChecklist'],
                'Check the pre-recovery photo state or explain the exception in the feature note.'
            )];
        }
    },
    {
        id: 'soil-profile-photo-count',
        label: 'Soil profile photo count should match linked SoilProfilePhoto records',
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
                'Soil profile photos are expected but linked SoilProfilePhoto records are missing.',
                ['featureSoilProfilePhotoCount', 'featureInvestigationChecklist'],
                'Link or create the soil profile photo records before closing the feature.'
            )];
        }
    },
    {
        id: 'feature-geometry-needs-aerial-alignment',
        label: 'Feature geometry marked for aerial layer alignment should be reviewed',
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
                'Feature geometry is marked for aerial layer alignment.',
                [
                    'featureGeometryEditStatus',
                    'featureGeometryReferenceLayerId',
                    'featureGeometryRevisionHistory'
                ],
                'Adjust the feature line against the current drone or aerial layer while preserving the existing feature record.'
            )];
        }
    },
    {
        id: 'sample-purpose',
        label: 'Samples should keep their analysis purpose',
        relatedFields: ['samplePurpose'],
        evaluate: (document) => {
            if (document.resource.category !== 'Sample') return [];
            if (hasValue(document.resource.samplePurpose)) return [];

            return [makeIssue(
                document,
                'sample-purpose',
                'warning',
                'Sample is missing an analysis or collection purpose.',
                ['samplePurpose'],
                'Record why the sample was collected before handover.'
            )];
        }
    },
    {
        id: 'find-label-register',
        label: 'Finds should keep label/register linkage',
        relatedFields: ['artifactLabelRegisterLink'],
        evaluate: (document) => {
            if (document.resource.category !== 'Find') return [];
            if (hasValue(document.resource.artifactLabelRegisterLink)) return [];

            return [makeIssue(
                document,
                'find-label-register',
                'info',
                'Find has no artifact label/register linkage recorded.',
                ['artifactLabelRegisterLink'],
                'Check label, bag, register, and later inventory linkage.'
            )];
        }
    },
    {
        id: 'field-only-timing',
        label: 'Field-only observations should keep creation timing',
        relatedFields: ['fieldOnlyMissingCheck', 'firstExposureRecord', 'recordCreationTiming'],
        evaluate: (document) => {
            if (!hasValue(document.resource.fieldOnlyMissingCheck)
                    && !hasValue(document.resource.firstExposureRecord)) return [];
            if (hasValue(document.resource.recordCreationTiming)) return [];

            return [makeIssue(
                document,
                'field-only-timing',
                'warning',
                'Field-only observations are present but record creation timing is missing.',
                ['fieldOnlyMissingCheck', 'firstExposureRecord', 'recordCreationTiming'],
                'Mark when this observation was recorded so later review can judge recoverability.'
            )];
        }
    },
    {
        id: 'report-cross-check',
        label: 'Report preparation records should keep report cross-check fields',
        relatedFields: ['reportCrossCheck'],
        evaluate: (document) => {
            if (!REPORT_REVIEW_CATEGORIES.includes(document.resource.category)) return [];
            if (hasValue(document.resource.reportCrossCheck)) return [];

            return [makeIssue(
                document,
                'report-cross-check',
                'warning',
                'Report review record has no report cross-check targets.',
                ['reportCrossCheck'],
                'Link the manuscript, photo register, drawing register, find list, or sample list checks.'
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
