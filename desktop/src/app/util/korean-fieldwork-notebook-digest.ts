import { Document } from 'idai-field-core';


export interface KoreanFieldworkFieldNoteInput {
    observation?: string;
    interpretation?: string;
    nextWork?: string;
    evidenceNumbers?: string;
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

export type KoreanFieldworkNotebookContinuationFocus = 'nextWork'|'evidenceNumbers';

export interface KoreanFieldworkFieldNoteContinuationSeed {
    id: string;
    sourceLabel: string;
    input: KoreanFieldworkFieldNoteInput;
}

export interface KoreanFieldworkDailyNotebookDigest {
    dateLabel: string;
    entries: KoreanFieldworkNotebookEntry[];
    dailyLogDocuments: Document[];
    primaryDailyLog?: Document;
    nextWorkEntries: KoreanFieldworkNotebookEntry[];
    evidenceMissingEntries: KoreanFieldworkNotebookEntry[];
}

interface KoreanFieldworkNotebookEntryWithSortKey extends KoreanFieldworkNotebookEntry {
    sortKey: number;
}

const PEN_MEMO_CATEGORY = 'PenMemo';
const DAILY_LOG_CATEGORY = 'DailyLog';

const EVIDENCE_NUMBER_CATEGORIES = new Set(['Photo', 'Drawing', 'Find', 'Sample']);

const CATEGORY_LABELS: { [categoryName: string]: string } = {
    DailyLog: '일지',
    Drawing: '도면',
    ExcavationArea: '조사구역',
    Feature: '유구',
    FeatureGroup: '유구군',
    FeatureSegment: '세부 단위',
    Find: '유물',
    FindCollection: '유물군',
    Layer: '층위',
    Operation: '조사',
    PenMemo: '메모',
    Photo: '사진',
    Sample: '시료',
    SoilProfilePhoto: '토층사진',
    Survey: '조사범위',
    SurveyBoundary: '조사경계',
    Trench: '트렌치'
};

const FIELD_NOTE_SECTION_DEFINITIONS: {
    id: keyof KoreanFieldworkFieldNoteInput;
    label: string;
}[] = [
    { id: 'observation', label: '관찰 내용' },
    { id: 'interpretation', label: '해석' },
    { id: 'nextWork', label: '다음 작업' },
    { id: 'evidenceNumbers', label: '사진·도면·스케치·유물·시료 번호' }
];
const FIELD_NOTE_SECTION_ALIASES: { [label: string]: keyof KoreanFieldworkFieldNoteInput } = {
    '스케치·약측/근거 번호': 'evidenceNumbers',
    '근거 번호': 'evidenceNumbers',
    '사진·도면·유물·시료 번호': 'evidenceNumbers'
};


export function makeKoreanFieldworkDailyNotebookDigest(
        documents: Document[],
        now: Date = new Date(),
        maxEntries: number = 8
): KoreanFieldworkDailyNotebookDigest {

    const dateLabel = formatDate(now);
    const entries = getKoreanFieldworkNotebookEntries(documents, Number.MAX_SAFE_INTEGER)
        .filter(entry => isDocumentDate(entry.sourceDocument, dateLabel))
        .slice(0, maxEntries);
    const dailyLogDocuments = documents
        .filter(document =>
            document.resource.category === DAILY_LOG_CATEGORY
            && isDocumentDate(document, dateLabel)
        )
        .sort(compareNewestFirst);

    return {
        dateLabel,
        entries,
        dailyLogDocuments,
        primaryDailyLog: dailyLogDocuments[0],
        nextWorkEntries: entries.filter(entry => entry.nextWork),
        evidenceMissingEntries: entries.filter(entry => entry.needsEvidenceNumbers)
    };
}


export function getKoreanFieldworkNotebookEntries(
        documents: Document[],
        limit: number = 6
): KoreanFieldworkNotebookEntry[] {

    const documentsById = new Map(documents.map(document => [document.resource.id, document]));

    return documents
        .flatMap(document => {
            if (document.resource.category === PEN_MEMO_CATEGORY) {
                return createNotebookEntryFromRecordMemo(document, documentsById);
            }
            if (document.resource.category === DAILY_LOG_CATEGORY) {
                return createNotebookEntriesFromDailyLog(document, documents);
            }

            return [];
        })
        .sort((entryA, entryB) => entryB.sortKey - entryA.sortKey)
        .slice(0, limit)
        .map(({ sortKey: _, ...entry }) => entry);
}


export function getKoreanFieldworkNotebookContinuationSeed(
        entry: KoreanFieldworkNotebookEntry,
        focus?: KoreanFieldworkNotebookContinuationFocus
): KoreanFieldworkFieldNoteContinuationSeed {

    return {
        id: entry.id,
        sourceLabel: getNotebookContinuationSourceLabel(entry, focus),
        input: trimFieldNoteInput({
            observation: entry.input.observation || entry.detail,
            interpretation: entry.input.interpretation,
            nextWork: getNotebookContinuationNextWork(entry, focus),
            evidenceNumbers: entry.input.evidenceNumbers || entry.evidenceNumbers
        })
    };
}


export function getKoreanFieldworkNotebookEntriesForDocument(
        document: Document|undefined,
        documents: Document[],
        limit: number = 4
): KoreanFieldworkNotebookEntry[] {

    if (!document?.resource?.id) return [];

    return getKoreanFieldworkNotebookEntries(documents, Number.MAX_SAFE_INTEGER)
        .filter(entry => isNotebookEntryRelatedToDocument(entry, document))
        .slice(0, limit);
}


export const normalizeKoreanFieldworkFieldNoteText = (text: string): string =>
    text.replace(/\r\n/g, '\n').trim();


export function extractKoreanFieldworkFieldNoteInput(text: string): KoreanFieldworkFieldNoteInput {

    const input: KoreanFieldworkFieldNoteInput = {};
    let currentField: keyof KoreanFieldworkFieldNoteInput|undefined;

    normalizeKoreanFieldworkFieldNoteText(text).split('\n').forEach(rawLine => {
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
}


function createNotebookEntryFromRecordMemo(
        memoDocument: Document,
        documentsById: Map<string, Document>
): KoreanFieldworkNotebookEntryWithSortKey[] {

    const noteText = getDocumentFieldNoteText(memoDocument);
    if (!hasMeaningfulFieldNoteText(noteText)) return [];

    const targetDocument = getRelationIds(memoDocument, 'depicts')
        .map(documentId => documentsById.get(documentId))
        .find((document): document is Document => !!document);

    return [
        createNotebookEntry({
            id: memoDocument.resource.id,
            sourceDocument: memoDocument,
            sourceLabel: '메모',
            targetDocument,
            text: noteText
        })
    ];
}


function createNotebookEntriesFromDailyLog(
        dailyLogDocument: Document,
        documents: Document[]
): KoreanFieldworkNotebookEntryWithSortKey[] {

    return getDailyLogEntryBlocks(dailyLogDocument).flatMap((block, index) => {
        const text = block.lines.join('\n');
        if (!hasMeaningfulFieldNoteText(text)) return [];

        const targetDocument = block.contextLabel
            ? findDailyLogContextDocument(block.contextLabel, documents)
            : undefined;

        return createNotebookEntry({
            id: `${dailyLogDocument.resource.id}-${index}`,
            sourceDocument: dailyLogDocument,
            sourceLabel: '일지',
            targetDocument,
            targetLabelFallback: block.contextLabel,
            text,
            timeLabel: block.timeLabel,
            order: index
        });
    });
}


function createNotebookEntry({
        id,
        sourceDocument,
        sourceLabel,
        targetDocument,
        targetLabelFallback,
        text,
        timeLabel,
        order = 0
}: {
    id: string;
    sourceDocument: Document;
    sourceLabel: string;
    targetDocument?: Document;
    targetLabelFallback?: string;
    text: string;
    timeLabel?: string;
    order?: number;
}): KoreanFieldworkNotebookEntryWithSortKey {

    const input = extractKoreanFieldworkFieldNoteInput(text);
    const targetLabel = targetDocument
        ? getDocumentLabel(targetDocument)
        : targetLabelFallback || getDocumentLabel(sourceDocument);
    const targetCategoryLabel = targetDocument
        ? getKoreanFieldworkCategoryLabel(targetDocument.resource.category)
        : getKoreanFieldworkCategoryLabel(sourceDocument.resource.category);
    const detail = getNotebookEntryDetail(input, text);
    const nextWork = normalizeKoreanFieldworkFieldNoteText(input.nextWork ?? '');
    const evidenceNumbers = normalizeKoreanFieldworkFieldNoteText(input.evidenceNumbers ?? '');

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
        needsEvidenceNumbers: !evidenceNumbers
            && shouldPromptEvidenceNumbers(input, targetDocument ?? sourceDocument),
        input,
        sortKey: getNotebookEntrySortKey(sourceDocument, timeLabel, order)
    };
}


function getNotebookEntryDetail(input: KoreanFieldworkFieldNoteInput, text: string): string {

    return normalizeKoreanFieldworkFieldNoteText(input.observation ?? '')
        || normalizeKoreanFieldworkFieldNoteText(input.interpretation ?? '')
        || stripFieldNoteSectionLabel(stripDailyLogEntryPrefix(getLastMeaningfulLine(text)));
}


function hasMeaningfulFieldNoteText(text: string): boolean {

    const noteText = normalizeKoreanFieldworkFieldNoteText(text);
    if (!noteText) return false;

    const input = extractKoreanFieldworkFieldNoteInput(noteText);
    if (FIELD_NOTE_SECTION_DEFINITIONS.some(section =>
        normalizeKoreanFieldworkFieldNoteText(input[section.id] ?? '').length > 0
    )) return true;

    return noteText.split('\n').some(rawLine => {
        const line = stripDailyLogEntryPrefix(rawLine.trim());
        return line.length > 0 && !isFieldNoteSectionHeadingOnly(line);
    });
}


function isFieldNoteSectionHeadingOnly(line: string): boolean {

    const match = line.match(/^\[([^\]]+)\]\s*$/);

    return !!match && !!getFieldNoteSectionId(match[1]);
}


function isNotebookEntryRelatedToDocument(
        entry: KoreanFieldworkNotebookEntry,
        document: Document
): boolean {

    const documentId = document.resource.id;
    const identifier = document.resource.identifier;

    return entry.sourceDocument.resource.id === documentId
        || entry.targetDocument?.resource.id === documentId
        || (
            !!identifier
            && !entry.targetDocument
            && entry.targetLabel === identifier
        );
}


function getNotebookEntryDateLabel(document: Document, timeLabel: string|undefined): string {

    return [
        getFieldNoteHistoryDateLabel(document),
        timeLabel
    ].filter((value): value is string => !!value && value.length > 0).join(' ');
}


function getNotebookEntrySortKey(document: Document, timeLabel: string|undefined, order: number): number {

    const date = getStringField(document, 'date');
    const dateTimestamp = date
        ? new Date(`${date}T00:00:00`).getTime()
        : getTimestamp(document);
    const baseTimestamp = Number.isNaN(dateTimestamp) ? getTimestamp(document) : dateTimestamp;
    const minutes = timeLabel ? getTimeLabelMinutes(timeLabel) : 0;

    return baseTimestamp + (minutes * 60 * 1000) + order;
}


function getTimeLabelMinutes(timeLabel: string): number {

    const match = timeLabel.match(/^(\d{2}):(\d{2})$/);
    if (!match) return 0;

    return (Number(match[1]) * 60) + Number(match[2]);
}


function getDailyLogEntryBlocks(dailyLogDocument: Document): {
    contextLabel?: string;
    lines: string[];
    timeLabel?: string;
}[] {

    const lines = getStringField(dailyLogDocument, 'description')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    const blocks: { contextLabel?: string; lines: string[]; timeLabel?: string }[] = [];

    lines.forEach(line => {
        const match = line.match(/^(\d{2}:\d{2})\s+(.+?)\s-\s+(.*)$/);
        if (match || blocks.length === 0) {
            blocks.push({
                contextLabel: match?.[2],
                lines: [match ? `${match[1]} ${match[2]} - ${match[3]}` : line],
                timeLabel: match?.[1]
            });
            return;
        }

        blocks[blocks.length - 1].lines.push(line);
    });

    return blocks.filter(block => block.lines.length > 0);
}


function findDailyLogContextDocument(contextLabel: string, documents: Document[]): Document|undefined {

    return documents.find(document =>
        document.resource.identifier === contextLabel
        || document.resource.id === contextLabel
    );
}


function getDocumentFieldNoteText(document: Document): string {

    return [
        getStringField(document, 'penMemoReviewedTranscript'),
        getStringField(document, 'penMemoAutoTranscript'),
        getStringField(document, 'description'),
        getStringField(document, 'diaryAbstract'),
        getStringField(document, 'shortDescription')
    ].find(value => value.length > 0) ?? '';
}


function shouldPromptEvidenceNumbers(input: KoreanFieldworkFieldNoteInput, document: Document): boolean {

    if (EVIDENCE_NUMBER_CATEGORIES.has(document.resource.category)) return true;

    return /사진|도면|실측|촬영|유물|시료|수습|채취|번호/.test([
        input.observation,
        input.interpretation,
        input.nextWork
    ].join(' '));
}


function getFieldNoteHistoryDateLabel(document: Document): string {

    const date = getStringField(document, 'date');
    if (date) return date;

    const timestamp = getTimestamp(document);
    return timestamp > 0 ? formatDate(new Date(timestamp)) : '';
}


function isDocumentDate(document: Document, dateLabel: string): boolean {

    const date = getStringField(document, 'date');
    if (date) return date === dateLabel;

    const timestamp = getTimestamp(document);
    return timestamp > 0 && formatDate(new Date(timestamp)) === dateLabel;
}


function getFieldNoteSectionId(label: string): keyof KoreanFieldworkFieldNoteInput|undefined {

    return FIELD_NOTE_SECTION_DEFINITIONS.find(section => section.label === label)?.id
        ?? FIELD_NOTE_SECTION_ALIASES[label];
}


function appendFieldNoteInputLine(
        input: KoreanFieldworkFieldNoteInput,
        field: keyof KoreanFieldworkFieldNoteInput,
        line: string
) {

    const text = line.trim();
    if (!text) return;

    input[field] = [input[field], text]
        .filter((value): value is string => !!value && value.length > 0)
        .join('\n');
}


function trimFieldNoteInput(input: KoreanFieldworkFieldNoteInput): KoreanFieldworkFieldNoteInput {

    return {
        observation: normalizeKoreanFieldworkFieldNoteText(input.observation ?? ''),
        interpretation: normalizeKoreanFieldworkFieldNoteText(input.interpretation ?? ''),
        nextWork: normalizeKoreanFieldworkFieldNoteText(input.nextWork ?? ''),
        evidenceNumbers: normalizeKoreanFieldworkFieldNoteText(input.evidenceNumbers ?? '')
    };
}


function getNotebookContinuationNextWork(
        entry: KoreanFieldworkNotebookEntry,
        focus: KoreanFieldworkNotebookContinuationFocus|undefined
): string {

    return focus === 'evidenceNumbers'
        ? mergeFieldNoteValue(
            entry.input.nextWork || entry.nextWork,
            '사진·도면·스케치·유물·시료 번호를 이어서 확인.'
        )
        : entry.input.nextWork || entry.nextWork;
}


function getNotebookContinuationSourceLabel(
        entry: KoreanFieldworkNotebookEntry,
        focus: KoreanFieldworkNotebookContinuationFocus|undefined
): string {

    if (focus === 'evidenceNumbers') return `${entry.sourceLabel} 번호 보강`;
    if (focus === 'nextWork') return `${entry.sourceLabel} 남은 작업`;

    return entry.sourceLabel;
}


function mergeFieldNoteValue(previous: string|undefined, next: string|undefined): string {

    const normalizedPrevious = normalizeKoreanFieldworkFieldNoteText(previous ?? '');
    const normalizedNext = normalizeKoreanFieldworkFieldNoteText(next ?? '');

    if (!normalizedPrevious) return normalizedNext;
    if (!normalizedNext || normalizedPrevious.includes(normalizedNext)) return normalizedPrevious;

    return `${normalizedPrevious}\n${normalizedNext}`;
}


function stripDailyLogEntryPrefix(line: string): string {

    return line.replace(/^\d{2}:\d{2}\s+.+?\s-\s+/, '');
}


function stripFieldNoteSectionLabel(line: string): string {

    return line.replace(/^\[[^\]]+\]\s*/, '');
}


function getStringField(document: Document, fieldName: string): string {

    const value = document.resource[fieldName];
    return typeof value === 'string' ? value.trim() : '';
}


function getRelationIds(document: Document, relationName: string): string[] {

    const value = document.resource.relations?.[relationName];
    if (Array.isArray(value)) return value.filter(item => typeof item === 'string');
    return typeof value === 'string' ? [value] : [];
}


function getLastMeaningfulLine(text: string): string {

    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .pop() ?? '';
}


function compareNewestFirst(documentA: Document, documentB: Document): number {

    return getTimestamp(documentB) - getTimestamp(documentA);
}


function getTimestamp(document: Document): number {

    const modifiedDate = getLastModifiedDate(document);
    if (modifiedDate) return modifiedDate.getTime();

    const createdDate = normalizeDateValue(document.created?.date);
    return createdDate?.getTime() ?? 0;
}


function getLastModifiedDate(document: Document): Date|undefined {

    const modified = document.modified;
    if (!Array.isArray(modified) || modified.length === 0) return undefined;

    return normalizeDateValue(modified[modified.length - 1]?.date);
}


function normalizeDateValue(value: unknown): Date|undefined {

    if (value instanceof Date) return value;
    if (typeof value !== 'string' && typeof value !== 'number') return undefined;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
}


function formatDate(date: Date): string {

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}


function pad2(value: number): string {

    return value.toString().padStart(2, '0');
}


function getDocumentLabel(document: Document): string {

    return document.resource.identifier || document.resource.id;
}


function getKoreanFieldworkCategoryLabel(categoryName: string): string {

    return CATEGORY_LABELS[categoryName] ?? categoryName;
}
