import { Document } from 'idai-field-core';
import { getKoreanFieldworkEvidenceChips } from './korean-fieldwork-record-evidence';

export type KoreanFieldworkRecordWorkFilterId =
  'all'
  | 'needsReview'
  | 'pending'
  | 'missingEvidence'
  | 'today';

export interface KoreanFieldworkRecordWorkFilter {
  id: KoreanFieldworkRecordWorkFilterId;
  label: string;
  icon: string;
}

export type KoreanFieldworkRecordWorkFilterCounts = Record<
  KoreanFieldworkRecordWorkFilterId,
  number
>;

export const KOREAN_FIELDWORK_RECORD_WORK_FILTERS: readonly KoreanFieldworkRecordWorkFilter[] = [
  { id: 'all', label: '전체', icon: 'format-list-bulleted' },
  { id: 'needsReview', label: '확인 필요', icon: 'priority-high' },
  { id: 'pending', label: '조사 중', icon: 'rule' },
  { id: 'missingEvidence', label: '자료 보강', icon: 'add-photo-alternate' },
  { id: 'today', label: '오늘 작성', icon: 'today' },
];

const PENDING_FEATURE_RECORDING_STATES = new Set([
  'candidate',
  'investigating',
]);

export const getKoreanFieldworkRecordWorkFilterCounts = (
  documents: Document[],
  allDocuments: Document[],
  issueCountByDocumentId: Record<string, number>,
  now: Date = new Date()
): KoreanFieldworkRecordWorkFilterCounts =>
  KOREAN_FIELDWORK_RECORD_WORK_FILTERS.reduce((counts, filter) => ({
    ...counts,
    [filter.id]: documents.filter((document) =>
      matchesKoreanFieldworkRecordWorkFilter(
        document,
        filter.id,
        allDocuments,
        issueCountByDocumentId,
        now
      )
    ).length,
  }), createEmptyCounts());

export const matchesKoreanFieldworkRecordWorkFilter = (
  document: Document,
  filterId: KoreanFieldworkRecordWorkFilterId,
  allDocuments: Document[],
  issueCountByDocumentId: Record<string, number>,
  now: Date = new Date()
): boolean => {
  switch (filterId) {
    case 'needsReview':
      return (issueCountByDocumentId[document.resource.id] ?? 0) > 0;
    case 'pending':
      return hasPendingFieldworkStatus(document);
    case 'missingEvidence':
      return hasMissingEvidence(document, allDocuments);
    case 'today':
      return wasTouchedToday(document, now);
    default:
      return true;
  }
};

const createEmptyCounts = (): KoreanFieldworkRecordWorkFilterCounts => ({
  all: 0,
  needsReview: 0,
  pending: 0,
  missingEvidence: 0,
  today: 0,
});

const hasPendingFieldworkStatus = (document: Document): boolean => {
  const resource = document.resource as Record<string, unknown>;

  return isTrackedValue(resource.featureRecordingStatus, PENDING_FEATURE_RECORDING_STATES);
};

const hasMissingEvidence = (
  document: Document,
  allDocuments: Document[]
): boolean =>
  getKoreanFieldworkEvidenceChips(document, allDocuments)
    .some((chip) => chip.count === 0);

const wasTouchedToday = (
  document: Document,
  now: Date
): boolean =>
  getDocumentDates(document).some((date) => isSameLocalDate(date, now));

const getDocumentDates = (document: Document): Date[] => {
  const dates: Date[] = [];
  const createdDate = toDate((document.created as any)?.date);
  if (createdDate) dates.push(createdDate);

  if (Array.isArray(document.modified)) {
    document.modified.forEach((modification) => {
      const modifiedDate = toDate((modification as any)?.date);
      if (modifiedDate) dates.push(modifiedDate);
    });
  }

  return dates;
};

const toDate = (value: unknown): Date | undefined => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const isSameLocalDate = (dateA: Date, dateB: Date): boolean =>
  dateA.getFullYear() === dateB.getFullYear()
  && dateA.getMonth() === dateB.getMonth()
  && dateA.getDate() === dateB.getDate();

const isTrackedValue = (
  value: unknown,
  trackedValues: Set<string>
): boolean => typeof value === 'string' && trackedValues.has(value);
