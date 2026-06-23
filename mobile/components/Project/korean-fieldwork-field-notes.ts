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

export type KoreanFieldworkFieldNoteMode = 'recordMemo'|'dailyLog';

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
