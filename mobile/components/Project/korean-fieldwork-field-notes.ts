import {
  buildEvidenceBundle,
  Document,
  KoreanFieldworkReadinessIssue,
  NewDocument,
  ProjectConfiguration,
} from 'idai-field-core';
import { createKoreanFieldworkDraftResource } from './korean-fieldwork-document-drafts';
import {
  getKoreanFieldworkCategoryLabel,
  KOREAN_FIELDWORK_CATEGORIES,
} from './korean-fieldwork-categories';
import {
  extractKoreanFieldworkHandwritingFromText,
  serializeKoreanFieldworkHandwriting,
} from './korean-fieldwork-handwriting';
import { getKoreanFieldworkEvidenceChips } from './korean-fieldwork-record-evidence';

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

export interface KoreanFieldworkFieldNoteHistoryItem {
  document: Document;
  label: string;
  detail: string;
  categoryLabel: string;
  dateLabel: string;
  input: KoreanFieldworkFieldNoteInput;
  canLoadIntoDraft: boolean;
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

export interface KoreanFieldworkFieldNoteObservationPrompt {
  id: string;
  label: string;
  detail: string;
  observation: string;
}

export type KoreanFieldworkFieldNoteGuidanceTone =
  'complete'|'guide'|'attention';

export interface KoreanFieldworkFieldNoteGuidanceItem {
  id: string;
  label: string;
  detail: string;
  tone: KoreanFieldworkFieldNoteGuidanceTone;
}

export interface KoreanFieldworkFieldNoteIssuePrompt {
  id: string;
  label: string;
  detail: string;
  severity: KoreanFieldworkReadinessIssue['severity'];
  input: KoreanFieldworkFieldNoteInput;
}

export interface KoreanFieldworkFieldNoteReportPreview {
  title: string;
  sentence: string;
  supportingDetail: string;
  missingParts: string[];
}

export interface KoreanFieldworkFieldNoteRecordUpdates {
  description?: string;
  fieldNote?: string;
  interpretation?: string;
}

export interface KoreanFieldworkFieldNoteEvidenceAction {
  id: string;
  label: string;
  detail: string;
  categoryName: string;
  existingCount: number;
}

export interface KoreanFieldworkFieldNoteFollowUpAction
  extends KoreanFieldworkFieldNoteEvidenceAction {
  reason: string;
}

export interface KoreanFieldworkNotebookEntry {
  id: string;
  sourceDocument: Document;
  targetDocument?: Document;
  sourceLabel: string;
  targetLabel: string;
  targetCategoryLabel: string;
  dateLabel: string;
  detail: string;
  nextWork: string;
  evidenceNumbers: string;
  needsEvidenceNumbers: boolean;
  input: KoreanFieldworkFieldNoteInput;
}

export interface KoreanFieldworkFieldNoteContinuationSeed {
  id: string;
  sourceLabel: string;
  input: KoreanFieldworkFieldNoteInput;
}

export type KoreanFieldworkNotebookContinuationFocus =
  'nextWork'|'evidenceNumbers';

export interface KoreanFieldworkDailyNotebookDigest {
  dateLabel: string;
  entries: KoreanFieldworkNotebookEntry[];
  dailyLogDocuments: Document[];
  primaryDailyLog?: Document;
  nextWorkEntries: KoreanFieldworkNotebookEntry[];
  evidenceMissingEntries: KoreanFieldworkNotebookEntry[];
}

interface KoreanFieldworkNotebookEntryWithSortKey
  extends KoreanFieldworkNotebookEntry {
  sortKey: number;
}

const FIELD_NOTE_SECTION_DEFINITIONS: {
  id: keyof KoreanFieldworkFieldNoteInput;
  label: string;
}[] = [
  { id: 'observation', label: '관찰 내용' },
  { id: 'interpretation', label: '해석' },
  { id: 'nextWork', label: '다음 작업' },
  { id: 'evidenceNumbers', label: '사진·도면·유물·시료 번호' },
];

export const createKoreanFieldworkRecordMemoDraft = (
  document: Document,
  text: string,
  config: ProjectConfiguration,
  now = new Date()
): NewDocument => {
  const noteText = normalizeFieldNoteText(text);
  const handwritingStrokes = extractKoreanFieldworkHandwritingFromText(noteText);
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
      penMemoStrokes: serializeKoreanFieldworkHandwriting(handwritingStrokes),
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

export const getKoreanFieldworkFieldNoteHistoryItems = (
  document: Document,
  documents: Document[],
  operationDocument?: Document,
  limit = 4
): KoreanFieldworkFieldNoteHistoryItem[] => documents
  .flatMap((candidate) => {
    if (isRelatedRecordMemo(candidate, document)) {
      return createFieldNoteHistoryItem(candidate, getDocumentFieldNoteText(
        candidate
      ));
    }

    if (isRelatedDailyLog(candidate, operationDocument)) {
      return createFieldNoteHistoryItem(
        candidate,
        getRelevantDailyLogEntry(candidate, document)
      );
    }

    return [];
  })
  .sort((itemA, itemB) => compareNewestFirst(itemA.document, itemB.document))
  .slice(0, limit);

export const getKoreanFieldworkNotebookEntries = (
  documents: Document[],
  limit = 6
): KoreanFieldworkNotebookEntry[] => {
  const documentsById = new Map(documents.map((document) => [
    document.resource.id,
    document,
  ]));

  return documents
    .flatMap((document) => {
      if (document.resource.category === C.PEN_MEMO) {
        return createNotebookEntryFromRecordMemo(document, documentsById);
      }
      if (document.resource.category === C.DAILY_LOG) {
        return createNotebookEntriesFromDailyLog(document, documents);
      }

      return [];
    })
    .sort((entryA, entryB) =>
      getNotebookEntryTimestamp(entryB) - getNotebookEntryTimestamp(entryA)
    )
    .slice(0, limit)
    .map(({ sortKey, ...entry }) => entry);
};

export const getKoreanFieldworkNotebookContinuationSeed = (
  entry: KoreanFieldworkNotebookEntry,
  focus?: KoreanFieldworkNotebookContinuationFocus
): KoreanFieldworkFieldNoteContinuationSeed => ({
  id: entry.id,
  sourceLabel: getNotebookContinuationSourceLabel(entry, focus),
  input: getKoreanFieldworkNotebookContinuationInput(entry, focus),
});

export const getKoreanFieldworkDailyNotebookDigest = (
  documents: Document[],
  now = new Date(),
  maxEntries = 8
): KoreanFieldworkDailyNotebookDigest => {
  const dateLabel = formatDate(now);
  const entries = getKoreanFieldworkNotebookEntries(
    documents,
    Number.MAX_SAFE_INTEGER
  )
    .filter((entry) => isDocumentDate(entry.sourceDocument, dateLabel))
    .slice(0, maxEntries);
  const dailyLogDocuments = documents
    .filter((document) =>
      document.resource.category === C.DAILY_LOG
      && isDocumentDate(document, dateLabel)
    )
    .sort(compareNewestFirst);

  return {
    dateLabel,
    entries,
    dailyLogDocuments,
    primaryDailyLog: dailyLogDocuments[0],
    nextWorkEntries: entries.filter((entry) => entry.nextWork),
    evidenceMissingEntries: entries.filter((entry) =>
      entry.needsEvidenceNumbers
    ),
  };
};

export const normalizeFieldNoteText = (text: string): string =>
  text.replace(/\r\n/g, '\n').trim();

export const buildKoreanFieldworkFieldNoteText = (
  input: KoreanFieldworkFieldNoteInput
): string => FIELD_NOTE_SECTION_DEFINITIONS
  .map((section) => formatFieldNoteSection(section.label, input[section.id]))
  .filter((section): section is string => !!section)
  .join('\n');

export const extractKoreanFieldworkFieldNoteInput = (
  text: string
): KoreanFieldworkFieldNoteInput => {
  const input: KoreanFieldworkFieldNoteInput = {};
  let currentField: keyof KoreanFieldworkFieldNoteInput | undefined;

  normalizeFieldNoteText(text).split('\n').forEach((rawLine) => {
    const line = stripDailyLogEntryPrefix(rawLine.trim());
    const match = line.match(/^\[([^\]]+)\]\s*(.*)$/);
    const field = match ? getFieldNoteSectionId(match[1]) : undefined;

    if (field) {
      currentField = field;
      appendFieldNoteInputLine(input, field, match?.[2] ?? '');
      return;
    }

    if (currentField && line.length > 0) {
      appendFieldNoteInputLine(input, currentField, line);
    }
  });

  return trimFieldNoteInput(input);
};

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

export const getKoreanFieldworkFieldNoteObservationPrompts = (
  document: Document
): KoreanFieldworkFieldNoteObservationPrompt[] => {
  switch (document.resource.category) {
    case C.FEATURE_GROUP:
      return [
        {
          id: 'group-scope',
          label: '군집 범위',
          detail: '분포·간격·경계',
          observation: '유구군의 분포 범위, 개별 유구 간격, 군집 경계를 기록.',
        },
        {
          id: 'group-pattern',
          label: '배열·반복',
          detail: '방향·규칙성',
          observation: '반복되는 배열, 방향, 규모 차이와 규칙성을 기록.',
        },
        {
          id: 'group-relation',
          label: '선후 관계',
          detail: '중복·절단',
          observation: '유구군 안팎의 중복, 절단, 선후관계를 기록.',
        },
      ];
    case C.FEATURE_SEGMENT:
      return [
        {
          id: 'segment-boundary',
          label: '구간 경계',
          detail: '시작·끝·접속',
          observation: '유구 구간의 시작과 끝, 다른 구간과의 접속·절단관계를 기록.',
        },
        {
          id: 'segment-profile',
          label: '단면 변화',
          detail: '깊이·폭·퇴적',
          observation: '구간별 폭, 깊이, 내부토, 바닥면 변화를 기록.',
        },
        {
          id: 'segment-context',
          label: '주변 관계',
          detail: '인접 유구·층',
          observation: '인접 유구, 층위, 조사구역 안 위치와의 관계를 기록.',
        },
      ];
    case C.TRENCH:
      return [
        {
          id: 'trench-position',
          label: '트렌치 위치',
          detail: '범위·방향·기준점',
          observation: '트렌치 범위, 방향, 기준점, 조사구역과의 관계를 기록.',
        },
        {
          id: 'trench-layer',
          label: '층위·노출',
          detail: '토층·검출면',
          observation: '트렌치에서 확인한 층위, 검출면, 노출 상태를 기록.',
        },
        {
          id: 'trench-feature',
          label: '확인 유구',
          detail: '위치·연결',
          observation: '트렌치 안에서 확인한 유구 위치, 경계, 연결 관계를 기록.',
        },
      ];
    case C.LAYER:
      return [
        {
          id: 'soil',
          label: '토색·토질',
          detail: '색·입도·포함물',
          observation: '토색, 토질, 입도, 포함물과 다짐 정도를 기록.',
        },
        {
          id: 'layer-boundary',
          label: '층 경계',
          detail: '상하부·점이',
          observation: '상·하부 경계의 명확도, 점이 양상, 접촉 관계를 기록.',
        },
        {
          id: 'formation',
          label: '퇴적 관계',
          detail: '형성·교란',
          observation: '퇴적 방향, 교란 흔적, 주변 유구와의 관계를 기록.',
        },
      ];
    case C.FIND:
      return [
        {
          id: 'find-context',
          label: '출토맥락',
          detail: '위치·층위·주변',
          observation: '출토 위치, 층위, 주변 유구와의 관계를 기록.',
        },
        {
          id: 'find-condition',
          label: '상태·수량',
          detail: '보존·파손·수량',
          observation: '보존 상태, 파손 여부, 수량과 수습 단위를 기록.',
        },
        {
          id: 'find-collection',
          label: '수습·보관',
          detail: '봉투·상자·번호',
          observation: '수습 번호, 봉투·상자 표기, 보관 상태를 기록.',
        },
      ];
    case C.SAMPLE:
      return [
        {
          id: 'sample-context',
          label: '채취맥락',
          detail: '위치·층위·대상',
          observation: '채취 위치, 층위, 대상 유구와 채취 이유를 기록.',
        },
        {
          id: 'sample-method',
          label: '채취방법',
          detail: '도구·범위·오염',
          observation: '채취 범위, 사용 도구, 오염 가능성과 현장 조건을 기록.',
        },
        {
          id: 'sample-storage',
          label: '포장·보관',
          detail: '용기·표기·상태',
          observation: '시료 번호, 포장 용기, 표기, 보관 상태를 기록.',
        },
      ];
    case C.PHOTO:
    case C.DRAWING:
      return [
        {
          id: 'media-target',
          label: '대상·방향',
          detail: '피사체·기준점',
          observation: '촬영·실측 대상, 방향, 기준점을 기록.',
        },
        {
          id: 'media-scale',
          label: '축척·방위',
          detail: '스케일·방위표',
          observation: '스케일, 방위, 기준점, 누락 구역 여부를 기록.',
        },
      ];
    case C.FEATURE:
    default:
      return [
        {
          id: 'plan-boundary',
          label: '평면·경계',
          detail: '형태·윤곽·절단',
          observation: '평면 형태, 윤곽선, 경계의 명확도와 절단관계를 기록.',
        },
        {
          id: 'size-direction',
          label: '규모·방향',
          detail: '장축·단축·깊이',
          observation: '장축·단축·깊이, 방향, 기준점을 기록.',
        },
        {
          id: 'fill-floor',
          label: '내부토·바닥',
          detail: '토색·토질·시설',
          observation: '내부토의 토색·토질·포함물, 바닥면과 내부시설 여부를 기록.',
        },
        {
          id: 'overlap',
          label: '중복 관계',
          detail: '선후·절단',
          observation: '주변 유구와의 중복, 절단, 선후관계를 기록.',
        },
      ];
  }
};

export const applyKoreanFieldworkFieldNoteObservationPrompt = (
  currentInput: KoreanFieldworkFieldNoteInput,
  prompt: KoreanFieldworkFieldNoteObservationPrompt
): KoreanFieldworkFieldNoteInput => ({
  ...currentInput,
  observation: mergeFieldNoteValue(currentInput.observation, prompt.observation),
});

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

export const getKoreanFieldworkFieldNoteSeedFromRecord = (
  document: Document,
  documents: Document[]
): KoreanFieldworkFieldNoteInput => {
  const fieldNoteText = getStringField(document, 'fieldNote');
  const descriptionText = getStringField(document, 'description');
  const fieldNoteInput = extractKoreanFieldworkFieldNoteInput(fieldNoteText);
  const descriptionInput = extractKoreanFieldworkFieldNoteInput(descriptionText);
  const hasStructuredFieldNote = hasAnyFieldNoteInput(fieldNoteInput);
  const hasStructuredDescription = hasAnyFieldNoteInput(descriptionInput);

  return removeEmptyFieldNoteInputValues(trimFieldNoteInput({
    observation: [
      fieldNoteInput.observation,
      descriptionInput.observation,
      hasStructuredFieldNote ? undefined : fieldNoteText,
      hasStructuredDescription ? undefined : descriptionText,
      getStringField(document, 'shortDescription'),
    ].reduce(mergeFieldNoteValue, ''),
    interpretation: [
      fieldNoteInput.interpretation,
      descriptionInput.interpretation,
      getStringField(document, 'interpretation'),
    ].reduce(mergeFieldNoteValue, ''),
    nextWork: [
      fieldNoteInput.nextWork,
      descriptionInput.nextWork,
    ].reduce(mergeFieldNoteValue, ''),
    evidenceNumbers: [
      fieldNoteInput.evidenceNumbers,
      descriptionInput.evidenceNumbers,
      getFieldNoteEvidenceNumberSeed(document, documents),
    ].reduce(mergeFieldNoteValue, ''),
  }));
};

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

export const getKoreanFieldworkFieldNoteIssuePrompts = (
  document: Document,
  documents: Document[],
  limit = 3
): KoreanFieldworkFieldNoteIssuePrompt[] =>
  buildEvidenceBundle(document, documents).issues
    .filter((issue) => issue.documentId === document.resource.id)
    .slice(0, limit)
    .map((issue) => ({
      id: `${issue.ruleId}-${issue.documentId}`,
      label: getIssuePromptLabel(issue),
      detail: issue.recommendedAction,
      severity: issue.severity,
      input: getIssuePromptInput(issue),
    }));

export const getKoreanFieldworkFieldNoteReportPreview = (
  input: KoreanFieldworkFieldNoteInput,
  document: Document
): KoreanFieldworkFieldNoteReportPreview | undefined => {
  const observation = normalizeFieldNoteText(input.observation ?? '');
  if (!observation) return undefined;

  const interpretation = normalizeFieldNoteText(input.interpretation ?? '');
  const nextWork = normalizeFieldNoteText(input.nextWork ?? '');
  const evidenceNumbers = normalizeFieldNoteText(input.evidenceNumbers ?? '');
  const recordLabel = document.resource.identifier || document.resource.id;
  const categoryLabel = getKoreanFieldworkCategoryLabel(document.resource.category);
  const missingParts = [
    !interpretation ? '관찰과 구분한 해석' : undefined,
    !evidenceNumbers ? '사진·도면·유물·시료 번호' : undefined,
    !nextWork && shouldPromptNextWork(document) ? '다음 작업' : undefined,
  ].filter((part): part is string => !!part);

  return {
    title: `${recordLabel} 보고서 연결 문장`,
    sentence: [
      `${formatReportSubject(categoryLabel, recordLabel)} ${trimSentenceEnd(observation)}.`,
      interpretation
        ? ` ${trimSentenceEnd(interpretation)}.`
        : undefined,
    ].join(''),
    supportingDetail: [
      evidenceNumbers ? `근거 번호: ${evidenceNumbers}` : undefined,
      nextWork ? `다음 작업: ${nextWork}` : undefined,
    ].filter((value): value is string => !!value).join(' · '),
    missingParts,
  };
};

export const getKoreanFieldworkFieldNoteRecordUpdates = (
  input: KoreanFieldworkFieldNoteInput,
  document: Document,
  additionalNoteText = ''
): KoreanFieldworkFieldNoteRecordUpdates => {
  const noteText = [
    buildKoreanFieldworkFieldNoteText(input),
    normalizeFieldNoteText(additionalNoteText),
  ].filter((value) => value.length > 0).join('\n');
  if (!noteText) return {};

  const updates: KoreanFieldworkFieldNoteRecordUpdates = {};
  const fieldNote = mergeFieldNoteValue(
    getStringField(document, 'fieldNote'),
    noteText
  );
  const observation = normalizeFieldNoteText(input.observation ?? '');
  const description = observation
    ? mergeFieldNoteValue(getStringField(document, 'description'), observation)
    : '';
  const interpretation = normalizeFieldNoteText(input.interpretation ?? '')
    ? mergeFieldNoteValue(
      getStringField(document, 'interpretation'),
      input.interpretation
    )
    : '';

  if (fieldNote !== getStringField(document, 'fieldNote')) {
    updates.fieldNote = fieldNote;
  }
  if (description && description !== getStringField(document, 'description')) {
    updates.description = description;
  }
  if (
    interpretation
    && interpretation !== getStringField(document, 'interpretation')
  ) {
    updates.interpretation = interpretation;
  }

  return updates;
};

export const getKoreanFieldworkFieldNoteEvidenceActions = (
  document: Document,
  documents: Document[],
  allowedAddCategoryNames: string[]
): KoreanFieldworkFieldNoteEvidenceAction[] => {
  const allowedCategories = new Set(allowedAddCategoryNames);

  return getKoreanFieldworkEvidenceChips(document, documents)
    .filter((chip) =>
      FIELD_NOTE_EVIDENCE_ACTION_IDS.has(chip.id)
      && !!chip.createCategoryName
      && allowedCategories.has(chip.createCategoryName)
    )
    .map((chip) => ({
      id: chip.id,
      label: `${chip.label} 추가`,
      detail: chip.count > 0
        ? `연결된 기록 ${chip.count}건`
        : '아직 연결된 기록 없음',
      categoryName: chip.createCategoryName!,
      existingCount: chip.count,
    }));
};

export const getKoreanFieldworkFieldNoteFollowUpActions = (
  input: KoreanFieldworkFieldNoteInput,
  evidenceActions: KoreanFieldworkFieldNoteEvidenceAction[],
  limit = 3
): KoreanFieldworkFieldNoteFollowUpAction[] => {
  const noteText = normalizeFieldNoteText([
    input.observation,
    input.interpretation,
    input.nextWork,
    input.evidenceNumbers,
  ].filter(Boolean).join(' '));
  if (!noteText) return [];

  const mentionedActions = new Map<string, string>();
  FIELD_NOTE_FOLLOW_UP_MATCHERS.forEach((matcher) => {
    if (!matcher.pattern.test(noteText)) return;
    matcher.actionIds.forEach((actionId) => {
      if (!mentionedActions.has(actionId)) {
        mentionedActions.set(actionId, matcher.reason);
      }
    });
  });

  return evidenceActions
    .filter((action) => mentionedActions.has(action.id))
    .map((action) => ({
      ...action,
      reason: mentionedActions.get(action.id)!,
    }))
    .sort(compareFollowUpActions)
    .slice(0, limit);
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

const trimSentenceEnd = (text: string): string =>
  normalizeFieldNoteText(text).replace(/[.。．\s]+$/g, '');

const formatReportSubject = (
  categoryLabel: string,
  recordLabel: string
): string => {
  const subjectLabel = recordLabel.startsWith(categoryLabel)
    ? recordLabel
    : `${categoryLabel} ${recordLabel}`;

  return `${subjectLabel}${getKoreanSubjectParticle(recordLabel)}`;
};

const getKoreanSubjectParticle = (text: string): '은'|'는' => {
  const lastCharacter = normalizeFieldNoteText(text).slice(-1);
  if (!lastCharacter) return '는';

  const digitSubjectParticles: Record<string, '은'|'는'> = {
    '0': '은',
    '1': '은',
    '2': '는',
    '3': '은',
    '4': '는',
    '5': '는',
    '6': '은',
    '7': '은',
    '8': '은',
    '9': '는',
  };
  if (digitSubjectParticles[lastCharacter]) {
    return digitSubjectParticles[lastCharacter];
  }

  const codePoint = lastCharacter.charCodeAt(0);
  if (codePoint < 0xac00 || codePoint > 0xd7a3) return '는';

  return (codePoint - 0xac00) % 28 === 0 ? '는' : '은';
};

const FIELD_NOTE_EVIDENCE_ACTION_IDS = new Set<string>([
  'photos',
  'soilProfilePhotos',
  'drawings',
  'finds',
  'samples',
]);

const FIELD_NOTE_EVIDENCE_NUMBER_LABELS: Record<string, string> = {
  photos: '사진',
  soilProfilePhotos: '토층 사진',
  drawings: '도면',
  finds: '유물',
  samples: '시료',
};

const getFieldNoteEvidenceNumberSeed = (
  document: Document,
  documents: Document[]
): string => getKoreanFieldworkEvidenceChips(document, documents)
  .filter((chip) =>
    FIELD_NOTE_EVIDENCE_ACTION_IDS.has(chip.id) && chip.documents.length > 0
  )
  .map((chip) => {
    const label = FIELD_NOTE_EVIDENCE_NUMBER_LABELS[chip.id] ?? chip.label;
    const identifiers = chip.documents
      .map(getEvidenceDocumentLabel)
      .filter((value, index, values) => values.indexOf(value) === index);

    return identifiers.length > 0
      ? `${label}: ${identifiers.join(', ')}`
      : undefined;
  })
  .filter((value): value is string => !!value)
  .join('\n');

const getEvidenceDocumentLabel = (document: Document): string =>
  document.resource.identifier || document.resource.id;

const FIELD_NOTE_FOLLOW_UP_MATCHERS: {
  actionIds: string[];
  pattern: RegExp;
  reason: string;
}[] = [
  {
    actionIds: ['soilProfilePhotos'],
    pattern: /토층|단면|벽면/,
    reason: '야장에 토층·단면 내용이 언급됐습니다.',
  },
  {
    actionIds: ['photos'],
    pattern: /사진|촬영|전경|세부|보강/,
    reason: '야장에 사진 기록이 언급됐습니다.',
  },
  {
    actionIds: ['drawings'],
    pattern: /도면|실측|평면도|단면도|스케치/,
    reason: '야장에 도면·실측 기록이 언급됐습니다.',
  },
  {
    actionIds: ['finds'],
    pattern: /유물|출토|수습|토기|자기|석기/,
    reason: '야장에 유물 기록이 언급됐습니다.',
  },
  {
    actionIds: ['samples'],
    pattern: /시료|채취|샘플|분석/,
    reason: '야장에 시료 기록이 언급됐습니다.',
  },
];

const compareFollowUpActions = (
  actionA: KoreanFieldworkFieldNoteFollowUpAction,
  actionB: KoreanFieldworkFieldNoteFollowUpAction
): number =>
  Number(actionA.existingCount > 0) - Number(actionB.existingCount > 0)
  || FIELD_NOTE_EVIDENCE_ACTION_ORDER.indexOf(actionA.id)
  - FIELD_NOTE_EVIDENCE_ACTION_ORDER.indexOf(actionB.id);

const FIELD_NOTE_EVIDENCE_ACTION_ORDER = [
  'soilProfilePhotos',
  'photos',
  'drawings',
  'finds',
  'samples',
];

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

const getIssuePromptLabel = (
  issue: KoreanFieldworkReadinessIssue
): string => {
  switch (issue.severity) {
    case 'critical':
      return '중요 보강';
    case 'info':
      return '참고 보강';
    default:
      return '기록 보강';
  }
};

const getIssuePromptInput = (
  issue: KoreanFieldworkReadinessIssue
): KoreanFieldworkFieldNoteInput => removeEmptyFieldNoteInputValues(
  trimFieldNoteInput({
    observation: issue.message,
    nextWork: issue.recommendedAction,
  })
);

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

const createFieldNoteHistoryItem = (
  document: Document,
  text: string
): KoreanFieldworkFieldNoteHistoryItem[] => {
  const noteText = normalizeFieldNoteText(text);
  if (!noteText) return [];

  const input = extractKoreanFieldworkFieldNoteInput(noteText);

  return [{
    document,
    label: document.resource.identifier || document.resource.id,
    detail: getFieldNoteHistoryDetail(noteText),
    categoryLabel: getKoreanFieldworkCategoryLabel(document.resource.category),
    dateLabel: getFieldNoteHistoryDateLabel(document),
    input,
    canLoadIntoDraft: hasAnyFieldNoteInput(input),
  }];
};

const createNotebookEntryFromRecordMemo = (
  memoDocument: Document,
  documentsById: Map<string, Document>
): KoreanFieldworkNotebookEntryWithSortKey[] => {
  const noteText = getDocumentFieldNoteText(memoDocument);
  if (!noteText) return [];

  const targetDocument = getRelationIds(memoDocument, 'depicts')
    .map((documentId) => documentsById.get(documentId))
    .find((document): document is Document => !!document);

  return [
    createNotebookEntry({
      id: memoDocument.resource.id,
      sourceDocument: memoDocument,
      sourceLabel: '메모',
      targetDocument,
      text: noteText,
    }),
  ];
};

const createNotebookEntriesFromDailyLog = (
  dailyLogDocument: Document,
  documents: Document[]
): KoreanFieldworkNotebookEntryWithSortKey[] => {
  const blocks = getDailyLogEntryBlocks(dailyLogDocument);

  return blocks.map((block, index) => {
    const targetDocument = block.contextLabel
      ? findDailyLogContextDocument(block.contextLabel, documents)
      : undefined;

    return createNotebookEntry({
      id: `${dailyLogDocument.resource.id}-${index}`,
      sourceDocument: dailyLogDocument,
      sourceLabel: '일지',
      targetDocument,
      targetLabelFallback: block.contextLabel,
      text: block.lines.join('\n'),
      timeLabel: block.timeLabel,
      order: index,
    });
  });
};

const createNotebookEntry = ({
  id,
  sourceDocument,
  sourceLabel,
  targetDocument,
  targetLabelFallback,
  text,
  timeLabel,
  order = 0,
}: {
  id: string;
  sourceDocument: Document;
  sourceLabel: string;
  targetDocument?: Document;
  targetLabelFallback?: string;
  text: string;
  timeLabel?: string;
  order?: number;
}): KoreanFieldworkNotebookEntryWithSortKey => {
  const input = extractKoreanFieldworkFieldNoteInput(text);
  const targetLabel = targetDocument
    ? targetDocument.resource.identifier || targetDocument.resource.id
    : targetLabelFallback || sourceDocument.resource.identifier || sourceDocument.resource.id;
  const targetCategoryLabel = targetDocument
    ? getKoreanFieldworkCategoryLabel(targetDocument.resource.category)
    : getKoreanFieldworkCategoryLabel(sourceDocument.resource.category);
  const detail = getNotebookEntryDetail(input, text);
  const nextWork = normalizeFieldNoteText(input.nextWork ?? '');
  const evidenceNumbers = normalizeFieldNoteText(input.evidenceNumbers ?? '');
  const needsEvidenceNumbers = !evidenceNumbers
    && shouldPromptEvidenceNumbers(input, targetDocument ?? sourceDocument);

  return {
    id,
    sourceDocument,
    targetDocument,
    sourceLabel,
    targetLabel,
    targetCategoryLabel,
    dateLabel: getNotebookEntryDateLabel(sourceDocument, timeLabel),
    detail,
    nextWork,
    evidenceNumbers,
    needsEvidenceNumbers,
    input,
    sortKey: getNotebookEntrySortKey(sourceDocument, timeLabel, order),
  };
};

const getNotebookEntryDetail = (
  input: KoreanFieldworkFieldNoteInput,
  text: string
): string =>
  normalizeFieldNoteText(input.observation ?? '')
  || normalizeFieldNoteText(input.interpretation ?? '')
  || stripFieldNoteSectionLabel(stripDailyLogEntryPrefix(getLastMeaningfulLine(text)));

const getKoreanFieldworkNotebookContinuationInput = (
  entry: KoreanFieldworkNotebookEntry,
  focus: KoreanFieldworkNotebookContinuationFocus | undefined
): KoreanFieldworkFieldNoteInput => removeEmptyFieldNoteInputValues(
  trimFieldNoteInput({
    observation: entry.input.observation || entry.detail,
    interpretation: entry.input.interpretation,
    nextWork: getNotebookContinuationNextWork(entry, focus),
    evidenceNumbers: entry.input.evidenceNumbers || entry.evidenceNumbers,
  })
);

const getNotebookContinuationNextWork = (
  entry: KoreanFieldworkNotebookEntry,
  focus: KoreanFieldworkNotebookContinuationFocus | undefined
): string =>
  focus === 'evidenceNumbers'
    ? mergeFieldNoteValue(
      entry.input.nextWork || entry.nextWork,
      '사진·도면·유물·시료 번호를 이어서 확인.'
    )
    : entry.input.nextWork || entry.nextWork;

const getNotebookContinuationSourceLabel = (
  entry: KoreanFieldworkNotebookEntry,
  focus: KoreanFieldworkNotebookContinuationFocus | undefined
): string => {
  if (focus === 'evidenceNumbers') return `${entry.sourceLabel} 번호 보강`;
  if (focus === 'nextWork') return `${entry.sourceLabel} 남은 작업`;

  return entry.sourceLabel;
};

const getNotebookEntryDateLabel = (
  document: Document,
  timeLabel: string | undefined
): string => [
  getFieldNoteHistoryDateLabel(document),
  timeLabel,
].filter((value): value is string => !!value && value.length > 0).join(' ');

const getNotebookEntryTimestamp = (
  entry: KoreanFieldworkNotebookEntryWithSortKey
): number => entry.sortKey;

const getNotebookEntrySortKey = (
  document: Document,
  timeLabel: string | undefined,
  order: number
): number => {
  const date = getStringField(document, 'date');
  const dateTimestamp = date
    ? new Date(`${date}T00:00:00`).getTime()
    : getTimestamp(document);
  const baseTimestamp = Number.isNaN(dateTimestamp) ? getTimestamp(document) : dateTimestamp;
  const minutes = timeLabel ? getTimeLabelMinutes(timeLabel) : 0;

  return baseTimestamp + (minutes * 60 * 1000) + order;
};

const getTimeLabelMinutes = (timeLabel: string): number => {
  const match = timeLabel.match(/^(\d{2}):(\d{2})$/);
  if (!match) return 0;

  return (Number(match[1]) * 60) + Number(match[2]);
};

const getDailyLogEntryBlocks = (
  dailyLogDocument: Document
): {
  contextLabel?: string;
  lines: string[];
  timeLabel?: string;
}[] => {
  const lines = getStringField(dailyLogDocument, 'description')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const blocks: { contextLabel?: string; lines: string[]; timeLabel?: string }[] = [];

  lines.forEach((line) => {
    const match = line.match(/^(\d{2}:\d{2})\s+(.+?)\s-\s+(.*)$/);
    if (match || blocks.length === 0) {
      blocks.push({
        contextLabel: match?.[2],
        lines: [match ? `${match[1]} ${match[2]} - ${match[3]}` : line],
        timeLabel: match?.[1],
      });
      return;
    }

    blocks[blocks.length - 1].lines.push(line);
  });

  return blocks.filter((block) => block.lines.length > 0);
};

const findDailyLogContextDocument = (
  contextLabel: string,
  documents: Document[]
): Document | undefined => documents.find((document) =>
  document.resource.identifier === contextLabel
  || document.resource.id === contextLabel
);

const getDocumentFieldNoteText = (document: Document): string =>
  [
    getStringField(document, 'penMemoReviewedTranscript'),
    getStringField(document, 'penMemoAutoTranscript'),
    getStringField(document, 'description'),
    getStringField(document, 'diaryAbstract'),
    getStringField(document, 'shortDescription'),
  ].find((value) => value.length > 0) ?? '';

const getRelevantDailyLogEntry = (
  dailyLogDocument: Document,
  contextDocument: Document
): string => {
  const description = getStringField(dailyLogDocument, 'description');
  if (!description) return '';

  const lines = description
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return '';

  const contextTokens = getDailyLogContextTokens(contextDocument);
  const matchingIndex = contextDocument.resource.category === C.OPERATION
    ? findLastDailyLogEntryIndex(lines)
    : findLastMatchingDailyLogEntryIndex(lines, contextTokens);

  if (matchingIndex < 0) return '';

  return collectDailyLogEntryBlock(lines, matchingIndex).join('\n');
};

const getDailyLogContextTokens = (document: Document): string[] =>
  [
    document.resource.identifier,
    document.resource.id,
  ].filter((token): token is string =>
    typeof token === 'string' && token.trim().length > 0
  );

const findLastDailyLogEntryIndex = (lines: string[]): number => {
  for (let index = lines.length - 1; index >= 0; index--) {
    if (isDailyLogEntryStart(lines[index])) return index;
  }

  return lines.length - 1;
};

const findLastMatchingDailyLogEntryIndex = (
  lines: string[],
  contextTokens: string[]
): number => {
  for (let index = lines.length - 1; index >= 0; index--) {
    if (
      contextTokens.some((token) => lines[index].includes(token))
      && (isDailyLogEntryStart(lines[index]) || index === 0)
    ) {
      return index;
    }
  }

  return -1;
};

const collectDailyLogEntryBlock = (
  lines: string[],
  startIndex: number
): string[] => {
  const block: string[] = [];

  for (let index = startIndex; index < lines.length; index++) {
    if (index > startIndex && isDailyLogEntryStart(lines[index])) break;
    block.push(lines[index]);
  }

  return block;
};

const isDailyLogEntryStart = (line: string): boolean =>
  /^\d{2}:\d{2}\s+/.test(line);

const getFieldNoteHistoryDetail = (text: string): string => {
  const line = getLastMeaningfulLine(text);
  return stripFieldNoteSectionLabel(stripDailyLogEntryPrefix(line));
};

const getFieldNoteHistoryDateLabel = (document: Document): string => {
  const date = getStringField(document, 'date');
  if (date) return date;

  const timestamp = getTimestamp(document);
  return timestamp > 0 ? formatDate(new Date(timestamp)) : '';
};

const isDocumentDate = (
  document: Document,
  dateLabel: string
): boolean => {
  const date = getStringField(document, 'date');
  if (date) return date === dateLabel;

  const timestamp = getTimestamp(document);
  return timestamp > 0 && formatDate(new Date(timestamp)) === dateLabel;
};

const getFieldNoteSectionId = (
  label: string
): keyof KoreanFieldworkFieldNoteInput | undefined =>
  FIELD_NOTE_SECTION_DEFINITIONS.find((section) =>
    section.label === label
  )?.id;

const appendFieldNoteInputLine = (
  input: KoreanFieldworkFieldNoteInput,
  field: keyof KoreanFieldworkFieldNoteInput,
  line: string
) => {
  const text = line.trim();
  if (!text) return;

  input[field] = [input[field], text]
    .filter((value): value is string => !!value && value.length > 0)
    .join('\n');
};

const trimFieldNoteInput = (
  input: KoreanFieldworkFieldNoteInput
): KoreanFieldworkFieldNoteInput => ({
  observation: normalizeFieldNoteText(input.observation ?? ''),
  interpretation: normalizeFieldNoteText(input.interpretation ?? ''),
  nextWork: normalizeFieldNoteText(input.nextWork ?? ''),
  evidenceNumbers: normalizeFieldNoteText(input.evidenceNumbers ?? ''),
});

const removeEmptyFieldNoteInputValues = (
  input: KoreanFieldworkFieldNoteInput
): KoreanFieldworkFieldNoteInput => Object.fromEntries(
  Object.entries(input).filter(([, value]) =>
    typeof value === 'string' && value.length > 0
  )
) as KoreanFieldworkFieldNoteInput;

const hasAnyFieldNoteInput = (
  input: KoreanFieldworkFieldNoteInput
): boolean => FIELD_NOTE_SECTION_DEFINITIONS.some((section) =>
  hasText(input[section.id])
);

const stripDailyLogEntryPrefix = (line: string): string =>
  line.replace(/^\d{2}:\d{2}\s+.+?\s-\s+/, '');

const stripFieldNoteSectionLabel = (line: string): string =>
  line.replace(/^\[[^\]]+\]\s*/, '');

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
