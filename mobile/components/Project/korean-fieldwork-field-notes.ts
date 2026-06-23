import {
  Document,
  NewDocument,
  ProjectConfiguration,
} from 'idai-field-core';
import { createKoreanFieldworkDraftResource } from './korean-fieldwork-document-drafts';
import {
  getKoreanFieldworkCategoryLabel,
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';

const C = KOREAN_FIELDWORK_CATEGORIES;
const FEATURE_PROGRESS_CATEGORIES = new Set<string>([
  C.FEATURE,
  C.FEATURE_GROUP,
  C.FEATURE_SEGMENT,
  C.LAYER,
  C.TRENCH,
]);

export type KoreanFieldworkFieldNoteMode = 'recordMemo'|'dailyLog'|'both';

export interface KoreanFieldworkFieldNoteInput {
  observation?: string;
  interpretation?: string;
  nextWork?: string;
  evidenceNumbers?: string;
}

export interface KoreanFieldworkFieldNoteSummary {
  document: Document;
  label: string;
  detail: string;
  categoryLabel: string;
}

export interface KoreanFieldworkFieldNoteChecklistItem {
  id: keyof KoreanFieldworkFieldNoteInput;
  label: string;
  detail: string;
  isComplete: boolean;
}

export interface KoreanFieldworkFieldNotePreset {
  id: string;
  label: string;
  input: KoreanFieldworkFieldNoteInput;
}

export type KoreanFieldworkFieldNoteGuidanceTone =
  'complete'|'guide'|'attention';

export interface KoreanFieldworkFieldNoteGuidanceItem {
  id: string;
  label: string;
  detail: string;
  tone: KoreanFieldworkFieldNoteGuidanceTone;
}

export const createKoreanFieldworkRecordMemoDraft = (
  document: Document,
  text: string,
  config: ProjectConfiguration,
  now = new Date()
): NewDocument => {
  const noteText = normalizeFieldNoteText(text);
  const resource = createKoreanFieldworkDraftResource(
    document,
    C.PEN_MEMO,
    config
  );

  return {
    resource: {
      ...resource,
      date: formatDate(now),
      shortDescription: createShortDescription('현장 메모', document, noteText),
      description: noteText,
      penMemoReviewedTranscript: noteText,
      penMemoTranscriptionStatus: 'reviewed',
      penMemoStrokes: '[]',
    },
  };
};

export const createKoreanFieldworkDailyLogDraft = (
  operationDocument: Document,
  contextDocument: Document,
  text: string,
  config: ProjectConfiguration,
  now = new Date()
): NewDocument => {
  const noteText = normalizeFieldNoteText(text);
  const resource = createKoreanFieldworkDraftResource(
    operationDocument,
    C.DAILY_LOG,
    config
  );

  return {
    resource: {
      ...resource,
      date: formatDate(now),
      shortDescription: `${formatDate(now)} 작업일지`,
      description: formatDailyLogEntry(contextDocument, noteText, now),
      diaryAbstract: createDiaryAbstract(noteText),
      dailyLogContent: inferDailyLogContent(contextDocument, noteText),
      dailyLogEvidenceRole: ['sameDayFactRecord'],
      dailyLogReview: ['sameDayWritten'],
      recordCreationTiming: 'duringFieldwork',
    },
  };
};

export const getKoreanFieldworkDailyLogAppendUpdates = (
  dailyLogDocument: Document,
  contextDocument: Document,
  text: string,
  now = new Date()
): Record<string, unknown> => {
  const noteText = normalizeFieldNoteText(text);
  const currentDescription = getStringField(dailyLogDocument, 'description');
  const nextEntry = formatDailyLogEntry(contextDocument, noteText, now);

  return {
    description: [currentDescription, nextEntry]
      .filter((value) => value.length > 0)
      .join('\n'),
    diaryAbstract: createDiaryAbstract(noteText),
    dailyLogContent: mergeStringArrays(
      getStringArrayField(dailyLogDocument, 'dailyLogContent'),
      inferDailyLogContent(contextDocument, noteText)
    ),
    dailyLogEvidenceRole: mergeStringArrays(
      getStringArrayField(dailyLogDocument, 'dailyLogEvidenceRole'),
      ['sameDayFactRecord']
    ),
    dailyLogReview: mergeStringArrays(
      getStringArrayField(dailyLogDocument, 'dailyLogReview'),
      ['sameDayWritten']
    ),
    recordCreationTiming: 'duringFieldwork',
  };
};

export const getKoreanFieldworkFieldNoteOperation = (
  document: Document,
  documents: Document[]
): Document | undefined => {
  const documentsById = new Map(documents.map((candidate) => [
    candidate.resource.id,
    candidate,
  ]));
  documentsById.set(document.resource.id, document);

  if (document.resource.category === C.OPERATION) return document;

  const recordedIn = getFirstRelatedDocument(
    document,
    documentsById,
    'isRecordedIn'
  );
  if (recordedIn?.resource.category === C.OPERATION) return recordedIn;

  const parentOperation = findOperationInParentPath(document, documentsById);
  if (parentOperation) return parentOperation;

  return documents.find((candidate) =>
    candidate.resource.category === C.OPERATION
  );
};

export const getKoreanFieldworkDailyLogForOperation = (
  operationDocument: Document | undefined,
  documents: Document[],
  now = new Date()
): Document | undefined => {
  if (!operationDocument) return undefined;

  const relatedDailyLogs = documents.filter((document) =>
    document.resource.category === C.DAILY_LOG
    && hasRelation(document, 'isRecordedIn', operationDocument.resource.id)
  );
  const today = formatDate(now);

  return relatedDailyLogs.find((document) =>
    getStringField(document, 'date') === today
  );
};

export const getKoreanFieldworkFieldNoteSummaries = (
  document: Document,
  documents: Document[],
  operationDocument?: Document,
  limit = 3
): KoreanFieldworkFieldNoteSummary[] => {
  const relatedDocuments = documents
    .filter((candidate) =>
      isRelatedRecordMemo(candidate, document)
      || isRelatedDailyLog(candidate, operationDocument)
    )
    .sort(compareNewestFirst)
    .slice(0, limit);

  return relatedDocuments.map((candidate) => ({
    document: candidate,
    label: candidate.resource.identifier || candidate.resource.id,
    detail: getFieldNoteDetail(candidate),
    categoryLabel: getKoreanFieldworkCategoryLabel(candidate.resource.category),
  }));
};

export const normalizeFieldNoteText = (text: string): string =>
  text.replace(/\r\n/g, '\n').trim();

export const buildKoreanFieldworkFieldNoteText = (
  input: KoreanFieldworkFieldNoteInput
): string => [
  formatFieldNoteSection('관찰 내용', input.observation),
  formatFieldNoteSection('해석', input.interpretation),
  formatFieldNoteSection('다음 작업', input.nextWork),
  formatFieldNoteSection('사진·도면·유물·시료 번호', input.evidenceNumbers),
]
  .filter((section): section is string => !!section)
  .join('\n');

export const getKoreanFieldworkFieldNoteChecklist = (
  input: KoreanFieldworkFieldNoteInput
): KoreanFieldworkFieldNoteChecklistItem[] => [
  {
    id: 'observation',
    label: '관찰',
    detail: '눈으로 확인한 사실',
    isComplete: hasText(input.observation),
  },
  {
    id: 'interpretation',
    label: '해석',
    detail: '추정·판단은 따로',
    isComplete: hasText(input.interpretation),
  },
  {
    id: 'nextWork',
    label: '다음 작업',
    detail: '보완·확인할 일',
    isComplete: hasText(input.nextWork),
  },
  {
    id: 'evidenceNumbers',
    label: '번호',
    detail: '사진·도면·유물·시료',
    isComplete: hasText(input.evidenceNumbers),
  },
];

export const getKoreanFieldworkFieldNotePresets = (
  document: Document
): KoreanFieldworkFieldNotePreset[] => {
  const category = document.resource.category;
  const commonPresets: KoreanFieldworkFieldNotePreset[] = [
    {
      id: 'boundary',
      label: '경계',
      input: {
        observation: '경계선, 색·토질 차이, 절단관계를 확인.',
        nextWork: '경계 재정리 후 사진·도면 번호 기록.',
      },
    },
    {
      id: 'photoDrawing',
      label: '사진·도면',
      input: {
        observation: '촬영·실측 기준점과 방향을 확인.',
        nextWork: '사진·도면 번호를 야장에 연결.',
      },
    },
    {
      id: 'findSample',
      label: '유물·시료',
      input: {
        observation: '유물·시료의 출토 위치와 층위 관계를 확인.',
        nextWork: '수습·채취 번호와 보관 상태 기록.',
      },
    },
  ];

  if (category === C.LAYER) {
    return [
      {
        id: 'layer',
        label: '층위',
        input: {
          observation: '토색, 토질, 포함물, 상·하부 경계를 확인.',
          interpretation: '층위 성격과 형성 과정을 관찰 근거와 분리해 기록.',
          nextWork: '단면 정리 후 층위 번호와 사진·도면 번호 연결.',
        },
      },
      ...commonPresets,
    ];
  }

  if (FEATURE_PROGRESS_CATEGORIES.has(category)) {
    return [
      {
        id: 'featureProgress',
        label: '유구 진행',
        input: {
          observation: '평면 형태, 규모, 내부 퇴적, 중복 관계를 확인.',
          interpretation: '유구 성격은 관찰 근거와 함께 보완.',
          nextWork: '단면 정리, 사진 보강, 실측, 유물·시료 수습 여부 확인.',
        },
      },
      ...commonPresets,
    ];
  }

  if (category === C.FIND || category === C.SAMPLE) {
    return [
      {
        id: 'findSampleContext',
        label: '출토맥락',
        input: {
          observation: '출토 위치, 층위, 주변 유구와의 관계를 확인.',
          nextWork: '번호, 봉투·상자 표기, 사진 여부를 기록.',
        },
      },
      commonPresets[2],
      commonPresets[1],
    ];
  }

  return commonPresets;
};

export const mergeKoreanFieldworkFieldNoteInput = (
  currentInput: KoreanFieldworkFieldNoteInput,
  nextInput: KoreanFieldworkFieldNoteInput
): KoreanFieldworkFieldNoteInput => ({
  observation: mergeFieldNoteValue(
    currentInput.observation,
    nextInput.observation
  ),
  interpretation: mergeFieldNoteValue(
    currentInput.interpretation,
    nextInput.interpretation
  ),
  nextWork: mergeFieldNoteValue(currentInput.nextWork, nextInput.nextWork),
  evidenceNumbers: mergeFieldNoteValue(
    currentInput.evidenceNumbers,
    nextInput.evidenceNumbers
  ),
});

export const getKoreanFieldworkFieldNoteGuidance = (
  input: KoreanFieldworkFieldNoteInput,
  document: Document
): KoreanFieldworkFieldNoteGuidanceItem[] => {
  const hasObservation = hasText(input.observation);
  const hasInterpretation = hasText(input.interpretation);
  const hasNextWork = hasText(input.nextWork);
  const hasEvidenceNumbers = hasText(input.evidenceNumbers);
  const items: KoreanFieldworkFieldNoteGuidanceItem[] = [];

  if (!hasObservation && hasInterpretation) {
    items.push({
      id: 'interpretation-without-observation',
      label: '관찰 근거 필요',
      detail: '해석을 적었다면 색·토질·경계·중복 관계도 함께 남기세요.',
      tone: 'attention',
    });
  } else if (!hasObservation) {
    items.push({
      id: 'observation-first',
      label: '관찰 내용부터',
      detail: getObservationPrompt(document),
      tone: 'guide',
    });
  } else {
    items.push({
      id: 'observation-recorded',
      label: '관찰 기록됨',
      detail: '해석이나 다음 작업이 있으면 따로 이어 적으세요.',
      tone: 'complete',
    });
  }

  if (!hasEvidenceNumbers && shouldPromptEvidenceNumbers(input, document)) {
    items.push({
      id: 'evidence-numbers',
      label: '번호 연결',
      detail: '사진·도면·유물·시료 번호가 생겼다면 같은 줄에 남기세요.',
      tone: 'guide',
    });
  }

  if (!hasNextWork && shouldPromptNextWork(document)) {
    items.push({
      id: 'next-work',
      label: '다음 작업',
      detail: '정리, 촬영, 실측, 수습, 보완 확인 중 남은 일을 적어두세요.',
      tone: 'guide',
    });
  }

  if (
    hasObservation
    && (hasEvidenceNumbers || !shouldPromptEvidenceNumbers(input, document))
    && (hasNextWork || !shouldPromptNextWork(document))
  ) {
    items.push({
      id: 'report-continuity',
      label: '보고서 연속성',
      detail: '이 내용은 작업일지와 선택 기록에 함께 남기기 좋습니다.',
      tone: 'complete',
    });
  }

  return items.slice(0, 3);
};

const findOperationInParentPath = (
  document: Document,
  documentsById: Map<string, Document>
): Document | undefined => {
  const visitedIds = new Set<string>();
  let current: Document | undefined = document;

  while (current && !visitedIds.has(current.resource.id)) {
    visitedIds.add(current.resource.id);

    const parent = getFirstRelatedDocument(current, documentsById, 'liesWithin');
    if (!parent) return undefined;
    if (parent.resource.category === C.OPERATION) return parent;

    const recordedIn = getFirstRelatedDocument(
      parent,
      documentsById,
      'isRecordedIn'
    );
    if (recordedIn?.resource.category === C.OPERATION) return recordedIn;

    current = parent;
  }

  return undefined;
};

const getFirstRelatedDocument = (
  document: Document,
  documentsById: Map<string, Document>,
  relationName: string
): Document | undefined => {
  const relatedId = getRelationIds(document, relationName)[0];
  return relatedId ? documentsById.get(relatedId) : undefined;
};

const isRelatedRecordMemo = (
  candidate: Document,
  document: Document
): boolean =>
  candidate.resource.category === C.PEN_MEMO
  && hasRelation(candidate, 'depicts', document.resource.id);

const isRelatedDailyLog = (
  candidate: Document,
  operationDocument: Document | undefined
): boolean =>
  !!operationDocument
  && candidate.resource.category === C.DAILY_LOG
  && hasRelation(candidate, 'isRecordedIn', operationDocument.resource.id);

const hasRelation = (
  document: Document,
  relationName: string,
  targetDocumentId: string
): boolean => getRelationIds(document, relationName).includes(targetDocumentId);

const getRelationIds = (
  document: Document,
  relationName: string
): string[] => {
  const value = (document.resource.relations as any)?.[relationName];
  return Array.isArray(value)
    ? value.filter((id): id is string => typeof id === 'string')
    : [];
};

const formatDailyLogEntry = (
  contextDocument: Document,
  text: string,
  now: Date
): string =>
  `${formatTime(now)} ${contextDocument.resource.identifier || contextDocument.resource.id} - ${text}`;

const createShortDescription = (
  prefix: string,
  document: Document,
  text: string
): string => `${prefix}: ${document.resource.identifier || document.resource.id} · ${
  truncate(text, 48)
}`;

const createDiaryAbstract = (text: string): string => truncate(text, 120);

const inferDailyLogContent = (
  contextDocument: Document,
  text: string
): string[] => {
  const content = new Set<string>(['workArea']);
  const normalizedText = text.toLowerCase();

  if (FEATURE_PROGRESS_CATEGORIES.has(contextDocument.resource.category)) {
    content.add('featureProgress');
  }
  if (/사진|도면|번호|촬영|실측/.test(normalizedText)) {
    content.add('photoDrawingNumbers');
  }
  if (/유물|시료|수습|채취/.test(normalizedText)) {
    content.add('findSampleCollection');
  }
  if (/안전|비|우천|배수|장비|굴삭/.test(normalizedText)) {
    content.add('safetyIssue');
  }
  if (/변경|재검토|보완|추가\s*확인/.test(normalizedText)) {
    content.add('changeReason');
  }

  return Array.from(content);
};

const formatFieldNoteSection = (
  label: string,
  value: string | undefined
): string | undefined => {
  const text = normalizeFieldNoteText(value ?? '');

  return text.length > 0 ? `[${label}] ${text}` : undefined;
};

const hasText = (value: string | undefined): boolean =>
  normalizeFieldNoteText(value ?? '').length > 0;

const getObservationPrompt = (document: Document): string => {
  switch (document.resource.category) {
    case C.LAYER:
      return '토색, 토질, 포함물, 상·하부 경계부터 적어두세요.';
    case C.FIND:
    case C.SAMPLE:
      return '출토 위치, 층위, 주변 유구와의 관계부터 적어두세요.';
    case C.PHOTO:
    case C.DRAWING:
      return '촬영·실측 대상, 방향, 기준점을 적어두세요.';
    default:
      return '형태, 규모, 경계, 절단·중복 관계부터 적어두세요.';
  }
};

const shouldPromptEvidenceNumbers = (
  input: KoreanFieldworkFieldNoteInput,
  document: Document
): boolean => {
  if (document.resource.category === C.PHOTO
    || document.resource.category === C.DRAWING
    || document.resource.category === C.FIND
    || document.resource.category === C.SAMPLE) {
    return true;
  }

  return /사진|도면|실측|촬영|유물|시료|수습|채취|번호/.test(
    [
      input.observation,
      input.interpretation,
      input.nextWork,
    ].join(' ')
  );
};

const shouldPromptNextWork = (document: Document): boolean =>
  FEATURE_PROGRESS_CATEGORIES.has(document.resource.category)
  || document.resource.category === C.FIND
  || document.resource.category === C.SAMPLE;

const mergeFieldNoteValue = (
  currentValue: string | undefined,
  nextValue: string | undefined
): string => {
  const currentText = normalizeFieldNoteText(currentValue ?? '');
  const nextText = normalizeFieldNoteText(nextValue ?? '');

  if (!currentText) return nextText;
  if (!nextText || currentText.includes(nextText)) return currentText;

  return `${currentText}\n${nextText}`;
};

const getFieldNoteDetail = (document: Document): string =>
  getLastMeaningfulLine(
    [
      getStringField(document, 'penMemoReviewedTranscript'),
      getStringField(document, 'penMemoAutoTranscript'),
      getStringField(document, 'description'),
      getStringField(document, 'diaryAbstract'),
      getStringField(document, 'shortDescription'),
    ].find((value) => value.length > 0) ?? ''
  );

const getStringField = (document: Document, fieldName: string): string => {
  const value = (document.resource as any)[fieldName];
  return typeof value === 'string' ? value.trim() : '';
};

const getStringArrayField = (
  document: Document,
  fieldName: string
): string[] => {
  const value = (document.resource as any)[fieldName];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
};

const getLastMeaningfulLine = (text: string): string =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .pop() ?? '';

const mergeStringArrays = (
  currentValues: string[],
  nextValues: string[]
): string[] => Array.from(new Set([...currentValues, ...nextValues]));

const compareNewestFirst = (
  documentA: Document,
  documentB: Document
): number => getTimestamp(documentB) - getTimestamp(documentA);

const getTimestamp = (document: Document): number => {
  const date = document.created?.date;
  if (date instanceof Date) return date.getTime();
  if (typeof date === 'string') {
    const timestamp = new Date(date).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  return 0;
};

const formatDate = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const formatTime = (date: Date): string =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const pad2 = (value: number): string => value.toString().padStart(2, '0');

const truncate = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
