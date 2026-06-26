import {
  Document,
  getKoreanFieldworkTodaySummary,
  hasConfirmedKoreanFieldworkImageUpload,
  KoreanFieldworkReadinessIssue,
} from 'idai-field-core';
import {
  countKoreanFieldworkHandwritingPoints,
  normalizeKoreanFieldworkHandwritingStrokes,
} from './korean-fieldwork-handwriting';

export type KoreanFieldworkCloseoutStatus = 'clear'|'needsReview'|'blocked';

export interface KoreanFieldworkCloseoutCounts {
  critical: number;
  warning: number;
  info: number;
}

export interface KoreanFieldworkCloseoutSummary {
  status: KoreanFieldworkCloseoutStatus;
  title: string;
  detail: string;
  counts: KoreanFieldworkCloseoutCounts;
  issues: KoreanFieldworkReadinessIssue[];
}

const SEVERITY_ORDER: Record<KoreanFieldworkReadinessIssue['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const PHOTO_CATEGORY = 'Photo';
const DRAWING_CATEGORY = 'Drawing';
const PEN_MEMO_CATEGORY = 'PenMemo';
const SOIL_PROFILE_PHOTO_CATEGORY = 'SoilProfilePhoto';
const MUNSELL_CANDIDATE_PATTERN =
  /\b(?:GLEY\s*[12]\s*\d\/N|(?:10|7\.5|5|2\.5)(?:YR|Y|R)\s+\d(?:\.\d)?\/\d(?:\.\d)?)\b/g;

export const makeKoreanFieldworkCloseoutSummary = (
  documents: Document[],
  maxIssues = 4
): KoreanFieldworkCloseoutSummary => getKoreanFieldworkCloseoutSummary(
  dedupeIssues([
    ...getKoreanFieldworkCloseoutReviewIssues(documents),
    ...getKoreanFieldworkTodaySummary(documents).openIssues,
  ]),
  maxIssues
);

export const getKoreanFieldworkCloseoutSummary = (
  issues: KoreanFieldworkReadinessIssue[],
  maxIssues = 4
): KoreanFieldworkCloseoutSummary => {
  const counts = getIssueCounts(issues);
  const sortedIssues = [...issues].sort(compareIssues);

  if (counts.critical > 0) {
    return {
      status: 'blocked',
      title: '먼저 볼 항목',
      detail: `오늘 먼저 처리할 항목 ${counts.critical}건이 남아 있습니다.`,
      counts,
      issues: sortedIssues.slice(0, maxIssues),
    };
  }

  if (counts.warning + counts.info > 0) {
    return {
      status: 'needsReview',
      title: '마감 전 확인',
      detail: `이어서 볼 항목 ${counts.warning}건, 살펴볼 항목 ${counts.info}건이 남아 있습니다.`,
      counts,
      issues: sortedIssues.slice(0, maxIssues),
    };
  }

  return {
    status: 'clear',
    title: '마감 가능',
    detail: '현재 조사 구역 기록으로 남은 점검 항목이 없습니다.',
    counts,
    issues: [],
  };
};

const getIssueCounts = (
  issues: KoreanFieldworkReadinessIssue[]
): KoreanFieldworkCloseoutCounts => issues.reduce((counts, issue) => ({
  ...counts,
  [issue.severity]: counts[issue.severity] + 1,
}), {
  critical: 0,
  warning: 0,
  info: 0,
});

const compareIssues = (
  issueA: KoreanFieldworkReadinessIssue,
  issueB: KoreanFieldworkReadinessIssue
): number => {
  const severityDiff = SEVERITY_ORDER[issueA.severity]
    - SEVERITY_ORDER[issueB.severity];
  if (severityDiff !== 0) return severityDiff;

  return issueA.identifier.localeCompare(issueB.identifier)
    || issueA.ruleId.localeCompare(issueB.ruleId);
};

const getKoreanFieldworkCloseoutReviewIssues = (
  documents: Document[]
): KoreanFieldworkReadinessIssue[] => documents.flatMap((document) => {
  if (document.resource.category === PHOTO_CATEGORY) {
    return getFieldworkPhotoCloseoutIssues(document);
  }
  if (document.resource.category === SOIL_PROFILE_PHOTO_CATEGORY) {
    return getSoilProfilePhotoCloseoutIssues(document);
  }
  if (document.resource.category === DRAWING_CATEGORY) {
    return getDrawingCloseoutIssues(document);
  }
  if (document.resource.category === PEN_MEMO_CATEGORY) {
    return getPenMemoCloseoutIssues(document);
  }

  return [];
});

const getFieldworkPhotoCloseoutIssues = (
  document: Document
): KoreanFieldworkReadinessIssue[] => [
  ...getPhotoReportMetadataCloseoutIssues(
    document,
    'fieldwork-photo-report-metadata-missing',
    '현장사진의 보고서용 원본 정보가 부족합니다.',
    'fieldworkPhotoCapturedAt'
  ),
  ...getPhotoUploadCloseoutIssues(
    document,
    ['fieldworkPhotoUri', 'imageUri', 'fileUri'],
    'fieldwork-photo-upload-missing',
    '현장사진 원본의 Field Hub 백업이 아직 확인되지 않았습니다.'
  ),
];

const getDrawingCloseoutIssues = (
  document: Document
): KoreanFieldworkReadinessIssue[] => getPhotoUploadCloseoutIssues(
  document,
  ['fieldworkPhotoUri', 'imageUri', 'fileUri'],
  'fieldwork-drawing-upload-missing',
  '도면 원본의 Field Hub 백업이 아직 확인되지 않았습니다.'
);

const getSoilProfilePhotoCloseoutIssues = (
  document: Document
): KoreanFieldworkReadinessIssue[] => {
  const issues: KoreanFieldworkReadinessIssue[] =
    getPhotoReportMetadataCloseoutIssues(
      document,
      'soil-profile-photo-report-metadata-missing',
      '토층사진의 보고서용 원본 정보가 부족합니다.',
      'soilProfilePhotoCapturedAt'
    ).concat(getPhotoUploadCloseoutIssues(
      document,
      ['soilProfilePhotoUri', 'imageUri', 'fieldworkPhotoUri'],
      'soil-profile-photo-upload-missing',
      '토층사진 원본의 Field Hub 백업이 아직 확인되지 않았습니다.'
    ));
  const resource = document.resource as Record<string, unknown>;

  if (resource.soilColorAssistStatus === 'candidatesAvailable') {
    const candidateSummary = getMunsellCandidateSummaryLabel(
      resource.soilColorAssistCandidates
    );
    issues.push(createCloseoutReviewIssue(
      document,
      'soil-color-candidates-review',
      '사진에서 읽은 먼셀 후보를 검토해야 합니다.',
      `${candidateSummary ? `${candidateSummary}. ` : ''}사진 후보 중 실제 토색을 선택하거나 직접 먼셀값을 확인하세요.`,
      ['soilColorAssistCandidates', 'soilColorAssistStatus', 'soilProfileColorSwatches']
    ));
  } else if (resource.soilColorAssistStatus === 'lowConfidence') {
    const candidateSummary = getMunsellCandidateSummaryLabel(
      resource.soilColorAssistCandidates
    );
    issues.push(createCloseoutReviewIssue(
      document,
      'soil-color-low-confidence',
      '사진 토색 후보의 신뢰도가 낮습니다.',
      `${candidateSummary ? `${candidateSummary}. ` : ''}현장에서 먼셀값을 직접 확인하고 토색 메모를 보강하세요.`,
      ['soilColorAssistCandidates', 'soilColorAssistStatus', 'soilProfileColorSwatches']
    ));
  }

  if (!hasSoilProfileColorSwatches(resource.soilProfileColorSwatches)) {
    issues.push(createCloseoutReviewIssue(
      document,
      'soil-profile-color-swatches-missing',
      '토층 사진에 번호별 토색이 아직 기록되지 않았습니다.',
      '사진 내 표시 번호와 대응되는 먼셀값 또는 토색 메모를 남기세요.',
      ['soilProfileColorSwatches']
    ));
  }

  return issues;
};

const getPhotoUploadCloseoutIssues = (
  document: Document,
  uriFields: string[],
  ruleId: string,
  message: string
): KoreanFieldworkReadinessIssue[] => {
  const resource = document.resource as Record<string, unknown>;
  const localUploadSource = uriFields
    .map((fieldName) => getTextValue(resource[fieldName]))
    .find(isUploadableLocalUri);

  if (!localUploadSource
      || hasConfirmedKoreanFieldworkImageUpload(resource, localUploadSource)) {
    return [];
  }

  return [createCloseoutReviewIssue(
    document,
    ruleId,
    message,
    '동기화 연결 후 원본 이미지 업로드가 완료됐는지 확인하고 서버 업로드 시각을 남기세요.',
    [
      'fieldworkImageUploadStatus',
      'fieldworkImageUploadedAt',
      'fieldworkImageUploadedUri',
      'fieldworkImageUploadTarget',
      'fieldworkImageUploadedProject',
      'fieldworkImageUploadedSizeBytes',
      'fieldworkImageUploadedMd5',
      'fieldworkImageStoredSizeBytes',
      'fieldworkImageStoredMd5',
      'fieldworkImageStoredSha256',
      'digitalSourcePreservation',
    ]
  )];
};

const getPhotoReportMetadataCloseoutIssues = (
  document: Document,
  ruleId: string,
  message: string,
  capturedAtField: string
): KoreanFieldworkReadinessIssue[] => {
  const resource = document.resource as Record<string, unknown>;
  const missingFields = getMissingPhotoReportMetadataFields(resource, capturedAtField);

  if (missingFields.length === 0) return [];

  return [createCloseoutReviewIssue(
    document,
    ruleId,
    message,
    `${getMissingPhotoReportMetadataLabel(missingFields)}를 확인해 원본 파일과 보고서 사진을 대조할 수 있게 남기세요.`,
    missingFields
  )];
};

const getMissingPhotoReportMetadataFields = (
  resource: Record<string, unknown>,
  capturedAtField: string
): string[] => {
  const missingFields: string[] = [];

  if (!hasTextValue(resource.originalFilename)) missingFields.push('originalFilename');
  if (!hasTextValue(resource[capturedAtField])) missingFields.push(capturedAtField);
  if (!hasPositiveNumberValue(resource.width)) missingFields.push('width');
  if (!hasPositiveNumberValue(resource.height)) missingFields.push('height');

  return missingFields;
};

const getMissingPhotoReportMetadataLabel = (fields: string[]): string =>
  fields
    .map((field) => {
      if (field === 'originalFilename') return '원본 파일명';
      if (field === 'width') return '가로 픽셀';
      if (field === 'height') return '세로 픽셀';
      return '촬영시각';
    })
    .join(', ');

const getPenMemoCloseoutIssues = (
  document: Document
): KoreanFieldworkReadinessIssue[] => {
  const resource = document.resource as Record<string, unknown>;
  const hasReviewedTranscript = hasTextValue(resource.penMemoReviewedTranscript);
  const hasAutoTranscript = hasTextValue(resource.penMemoAutoTranscript);
  const hasHandwriting = hasPenMemoHandwriting(resource.penMemoStrokes);

  if (hasReviewedTranscript) return [];

  if (hasAutoTranscript) {
    const action = hasHandwriting
      ? '자동 전사를 원본 손글씨와 대조하고 검토 전사문으로 확정하세요.'
      : '자동 전사를 확인하고 검토 전사문으로 확정하세요.';

    return [createCloseoutReviewIssue(
      document,
      'pen-memo-auto-transcript-review',
      [
        '자동 전사된 현장 메모가 아직 검토되지 않았습니다.',
        hasHandwriting ? getPenMemoSketchSummaryLabel(resource.penMemoStrokes) : '',
      ].filter(Boolean).join(' '),
      `${toSentencePrefix(getPenMemoTranscriptionSummaryLabel(document))}. ${action}`,
      ['penMemoAutoTranscript', 'penMemoReviewedTranscript', 'penMemoTranscriptionStatus']
    )];
  }

  if (hasHandwriting) {
    return [createCloseoutReviewIssue(
      document,
      'pen-memo-handwriting-transcription',
      [
        '태블릿 손글씨 현장 메모가 아직 전사되지 않았습니다.',
        getPenMemoSketchSummaryLabel(resource.penMemoStrokes),
      ].filter(Boolean).join(' '),
      `${getPenMemoTranscriptionSummaryLabel(document)} 손글씨 원자료를 읽어 검토 전사문으로 남기세요.`,
      ['penMemoStrokes', 'penMemoReviewedTranscript', 'penMemoTranscriptionStatus']
    )];
  }

  return [];
};

const createCloseoutReviewIssue = (
  document: Document,
  ruleId: string,
  message: string,
  recommendedAction: string,
  relatedFields: string[]
): KoreanFieldworkReadinessIssue => ({
  severity: 'warning',
  documentId: document.resource.id,
  identifier: document.resource.identifier || document.resource.id,
  category: document.resource.category,
  ruleId,
  message,
  recommendedAction,
  relatedFields,
  blocksSave: false,
});

const dedupeIssues = (
  issues: KoreanFieldworkReadinessIssue[]
): KoreanFieldworkReadinessIssue[] => {
  const seen = new Set<string>();

  return issues.filter((issue) => {
    const key = `${issue.documentId}\u001f${issue.ruleId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getMunsellCandidateSummaryLabel = (
  value: unknown,
  maxCandidates = 3
): string => {
  const candidates = extractMunsellCandidateOptions(value).slice(0, maxCandidates);

  return candidates.length > 0
    ? `먼셀 후보 ${candidates.join(', ')}`
    : '';
};

const extractMunsellCandidateOptions = (value: unknown): string[] => {
  if (typeof value !== 'string') return [];

  const matches = value.toUpperCase().match(MUNSELL_CANDIDATE_PATTERN) ?? [];

  return Array.from(new Set(
    matches.map((match) => match.replace(/\s+/g, ' ').trim())
  ));
};

const getPenMemoTranscriptionSummaryLabel = (document: Document): string => {
  const resource = document.resource as Record<string, unknown>;
  const hasAutoTranscript = hasTextValue(resource.penMemoAutoTranscript);
  const hasHandwriting = hasPenMemoHandwriting(resource.penMemoStrokes);
  const sourceLabel = hasAutoTranscript && hasHandwriting
    ? '태블릿 손글씨·자동 전사'
    : hasAutoTranscript
      ? '자동 전사 검토'
      : '태블릿 손글씨 원자료';
  const sketchSummaryLabel = getPenMemoSketchSummaryLabel(resource.penMemoStrokes);

  return [sourceLabel, sketchSummaryLabel]
    .filter((label) => label.trim().length > 0)
    .join(' · ');
};

const getPenMemoSketchSummaryLabel = (value: unknown): string => {
  const stats = getPenMemoStrokeStats(value);
  if (stats.strokeCount === 0) return '';
  if (stats.pointCount === 0) return `손그림 메모 ${stats.strokeCount}획`;

  return `손그림 메모 ${stats.strokeCount}획 ${stats.pointCount}점`;
};

const getPenMemoStrokeStats = (
  value: unknown
): { strokeCount: number; pointCount: number } => {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue === '[]') {
      return { strokeCount: 0, pointCount: 0 };
    }

    try {
      return getPenMemoStrokeStatsFromValue(JSON.parse(trimmedValue));
    } catch (_err) {
      return { strokeCount: 1, pointCount: 0 };
    }
  }

  return getPenMemoStrokeStatsFromValue(value);
};

const getPenMemoStrokeStatsFromValue = (
  value: unknown
): { strokeCount: number; pointCount: number } => {
  const strokes = normalizeKoreanFieldworkHandwritingStrokes(value);

  return {
    strokeCount: strokes.length,
    pointCount: countKoreanFieldworkHandwritingPoints(strokes),
  };
};

const hasPenMemoHandwriting = (value: unknown): boolean =>
  getPenMemoStrokeStats(value).strokeCount > 0;

const hasTextValue = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const getTextValue = (value: unknown): string | undefined =>
  hasTextValue(value) ? value.trim() : undefined;

const isUploadableLocalUri = (uri: string | undefined): boolean =>
  !!uri && /^(file|content):\/\//.test(uri);

const hasPositiveNumberValue = (value: unknown): boolean => {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (typeof value !== 'string') return false;

  const parsedValue = Number(value.trim());

  return Number.isFinite(parsedValue) && parsedValue > 0;
};

const hasSoilProfileColorSwatches = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;

  const trimmedValue = value.trim();

  return trimmedValue.length > 0
    && trimmedValue !== '[]';
};

const toSentencePrefix = (value: string): string =>
  value.replace(/[.?!\s]*$/, '');
