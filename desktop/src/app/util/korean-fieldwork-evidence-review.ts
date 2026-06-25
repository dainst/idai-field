import {
    buildEvidenceBundle,
    Document,
    EvidenceBundle,
    KoreanFieldworkReadinessIssue
} from 'idai-field-core';
import { extractMunsellCandidateOptions, getMunsellCandidateSummaryLabel } from './korean-fieldwork-soil-color-candidates';

export interface KoreanFieldworkEvidenceReview extends EvidenceBundle {
    hasOpenIssues: boolean;
    reportReady: boolean;
    missingEvidenceKinds: string[];
    pendingPenMemoTranscriptions: Document[];
    penMemoTranscriptionSummaries: KoreanFieldworkPenMemoTranscriptionSummary[];
    penMemoSketchSummaries: KoreanFieldworkPenMemoSketchSummary[];
    soilColorCandidateSummaries: KoreanFieldworkSoilColorCandidateSummary[];
}

export interface KoreanFieldworkPenMemoSketchSummary {
    document: Document;
    strokeCount: number;
    pointCount: number;
    pendingTranscription: boolean;
}

export interface KoreanFieldworkPenMemoSketchPreview {
    label: string;
    path: string;
    viewBox: string;
}

interface KoreanFieldworkPenMemoPoint {
    x: number;
    y: number;
}

interface KoreanFieldworkPenMemoStroke {
    points: KoreanFieldworkPenMemoPoint[];
}

export interface KoreanFieldworkPenMemoTranscriptionSummary {
    document: Document;
    label: string;
}

export interface KoreanFieldworkSoilColorCandidateSummary {
    candidates: string[];
    document: Document;
    label: string;
}

export function makeKoreanFieldworkEvidenceReview(
        rootDocument: Document,
        documents: Document[]
): KoreanFieldworkEvidenceReview {

    const bundle = buildEvidenceBundle(rootDocument, documents);
    const pendingPenMemoTranscriptions = getPendingPenMemoTranscriptionDocuments(bundle.penMemos);
    const penMemoTranscriptionSummaries = getPenMemoTranscriptionSummaries(pendingPenMemoTranscriptions);
    const penMemoSketchSummaries = getPenMemoSketchSummaries(bundle.penMemos);
    const soilColorCandidateSummaries = getSoilColorCandidateSummaries(bundle.soilProfilePhotos);
    const missingEvidenceKinds = getMissingEvidenceKinds(bundle, pendingPenMemoTranscriptions);
    const issues = bundle.issues.concat(
        getPendingPenMemoTranscriptionIssues(pendingPenMemoTranscriptions)
    );

    return {
        ...bundle,
        issues,
        hasOpenIssues: issues.length > 0,
        reportReady: issues.length === 0 && missingEvidenceKinds.length === 0,
        missingEvidenceKinds,
        pendingPenMemoTranscriptions,
        penMemoTranscriptionSummaries,
        penMemoSketchSummaries,
        soilColorCandidateSummaries
    };
}

export function getIssueSummary(issues: KoreanFieldworkReadinessIssue[]): string[] {

    return issues.map((issue) => `${issue.identifier}: ${issue.recommendedAction}`);
}

export function getPendingPenMemoTranscriptionDocuments(penMemos: Document[]): Document[] {

    return penMemos.filter(document =>
        !hasTextValue(document.resource.penMemoReviewedTranscript)
        && (
            hasTextValue(document.resource.penMemoAutoTranscript)
            || hasPenMemoHandwriting(document.resource.penMemoStrokes)
        )
    );
}


export function getPenMemoSketchSummaries(penMemos: Document[]): KoreanFieldworkPenMemoSketchSummary[] {

    return penMemos.flatMap(document => {
        const stats = getPenMemoStrokeStats(document.resource.penMemoStrokes);
        if (stats.strokeCount === 0) return [];

        return [{
            document,
            strokeCount: stats.strokeCount,
            pointCount: stats.pointCount,
            pendingTranscription: !hasTextValue(document.resource.penMemoReviewedTranscript)
        }];
    });
}


export function getPenMemoTranscriptionSummaries(
        penMemos: Document[]
): KoreanFieldworkPenMemoTranscriptionSummary[] {

    return penMemos.map(document => ({
        document,
        label: getPenMemoTranscriptionSummaryLabel(document)
    }));
}


export function getPenMemoTranscriptionSummaryLabel(document: Document): string {

    const hasAutoTranscript = hasTextValue(document.resource.penMemoAutoTranscript);
    const hasHandwriting = hasPenMemoHandwriting(document.resource.penMemoStrokes);
    const sourceLabel = hasAutoTranscript && hasHandwriting
        ? '태블릿 손글씨·자동 전사'
        : hasAutoTranscript
            ? '자동 전사 검토'
            : '태블릿 손글씨 원자료';
    const sketchSummaryLabel = getPenMemoSketchSummaryLabel(document.resource.penMemoStrokes);

    return [sourceLabel, sketchSummaryLabel]
        .filter(label => label.trim().length > 0)
        .join(' · ');
}


export function getSoilColorCandidateSummaries(
        soilProfilePhotos: Document[]
): KoreanFieldworkSoilColorCandidateSummary[] {

    return soilProfilePhotos.flatMap(document => {
        const candidates = extractMunsellCandidateOptions(document.resource.soilColorAssistCandidates);
        if (candidates.length === 0) return [];

        return [{
            candidates,
            document,
            label: getMunsellCandidateSummaryLabel(document.resource.soilColorAssistCandidates)
        }];
    });
}


export function getPendingPenMemoTranscriptionIssues(
        penMemos: Document[]
): KoreanFieldworkReadinessIssue[] {

    return penMemos.map(document => {
        const hasAutoTranscript = hasTextValue(document.resource.penMemoAutoTranscript);
        const hasHandwriting = hasPenMemoHandwriting(document.resource.penMemoStrokes);
        const sketchSummaryLabel = getPenMemoSketchSummaryLabel(document.resource.penMemoStrokes);
        const summaryLabel = getPenMemoTranscriptionSummaryLabel(document);
        const summarySentencePrefix = summaryLabel.replace(/[.。]\s*$/, '');

        return {
            severity: 'warning',
            documentId: document.resource.id,
            identifier: document.resource.identifier || document.resource.id,
            category: document.resource.category,
            ruleId: hasAutoTranscript
                ? 'pen-memo-auto-transcript-review'
                : 'pen-memo-handwriting-transcription',
            message: hasAutoTranscript
                ? [
                    '자동 전사된 야장 메모가 검토되지 않았습니다.',
                    hasHandwriting ? sketchSummaryLabel : ''
                ].filter(Boolean).join(' ')
                : [
                    '태블릿 손글씨 야장 메모가 아직 전사되지 않았습니다.',
                    sketchSummaryLabel
                ].filter(Boolean).join(' '),
            relatedFields: hasAutoTranscript
                ? ['penMemoAutoTranscript', 'penMemoReviewedTranscript', 'penMemoTranscriptionStatus']
                : ['penMemoStrokes', 'penMemoReviewedTranscript', 'penMemoTranscriptionStatus'],
            recommendedAction: hasAutoTranscript
                ? [
                    summarySentencePrefix,
                    hasHandwriting
                        ? '자동 전사를 원본 손글씨와 대조하고 검토 전사문으로 확정하세요.'
                        : '자동 전사를 확인하고 검토 전사문으로 확정하세요.'
                ].filter(Boolean).join('. ')
                : [
                    summaryLabel,
                    '태블릿 손글씨 원자료를 읽어 검토 전사문으로 남기세요.'
                ].filter(Boolean).join(' '),
            blocksSave: false
        };
    });
}


function getMissingEvidenceKinds(bundle: EvidenceBundle,
                                 pendingPenMemoTranscriptions: Document[]): string[] {

    const missing: string[] = [];

    if (bundle.photos.length === 0 && bundle.soilProfilePhotos.length === 0) missing.push('photo');
    if (bundle.drawings.length === 0) missing.push('drawing');
    if (bundle.reportPreparationReviews.length === 0 && bundle.reportEditorialCrossChecks.length === 0) {
        missing.push('reportReview');
    }
    if (pendingPenMemoTranscriptions.length > 0) missing.push('penMemoTranscription');

    return missing;
}


function hasTextValue(value: unknown): boolean {

    return typeof value === 'string' && value.trim().length > 0;
}


function hasPenMemoHandwriting(value: unknown): boolean {

    return getPenMemoStrokeStats(value).strokeCount > 0;
}


export function getPenMemoSketchSummaryLabel(value: unknown): string {

    const stats = getPenMemoStrokeStats(value);
    if (stats.strokeCount === 0) return '';
    if (stats.pointCount === 0) return `스케치 메모 ${stats.strokeCount}획.`;

    return `스케치 메모 ${stats.strokeCount}획/${stats.pointCount}점.`;
}


export function getPenMemoSketchPreview(value: unknown): KoreanFieldworkPenMemoSketchPreview|undefined {

    const strokes = getPenMemoStrokes(value);
    if (strokes.length === 0) return undefined;

    const points = strokes.flatMap(stroke => stroke.points);
    const bounds = getPointBounds(points);
    const previewWidth = 120;
    const previewHeight = 72;
    const padding = 8;
    const drawableWidth = previewWidth - (padding * 2);
    const drawableHeight = previewHeight - (padding * 2);
    const sourceWidth = Math.max(1, bounds.maxX - bounds.minX);
    const sourceHeight = Math.max(1, bounds.maxY - bounds.minY);
    const scale = Math.min(drawableWidth / sourceWidth, drawableHeight / sourceHeight);
    const scaledWidth = sourceWidth * scale;
    const scaledHeight = sourceHeight * scale;
    const offsetX = padding + ((drawableWidth - scaledWidth) / 2);
    const offsetY = padding + ((drawableHeight - scaledHeight) / 2);
    const toPreviewPoint = (point: KoreanFieldworkPenMemoPoint) => ({
        x: roundPreviewCoordinate(offsetX + ((point.x - bounds.minX) * scale)),
        y: roundPreviewCoordinate(offsetY + ((point.y - bounds.minY) * scale))
    });
    const path = strokes
        .map(stroke => getPreviewStrokePath(stroke.points.map(toPreviewPoint)))
        .filter(strokePath => strokePath.length > 0)
        .join(' ');

    if (!path) return undefined;

    return {
        label: getPenMemoSketchSummaryLabel(value),
        path,
        viewBox: `0 0 ${previewWidth} ${previewHeight}`
    };
}


function getPenMemoStrokeStats(value: unknown): { strokeCount: number, pointCount: number } {

    if (typeof value !== 'string') return getPenMemoStrokeStatsFromStrokes(getParsedPenMemoStrokes(value));

    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue === '[]') return { strokeCount: 0, pointCount: 0 };

    try {
        return getPenMemoStrokeStatsFromStrokes(getParsedPenMemoStrokes(JSON.parse(trimmedValue)));
    } catch (_err) {
        return { strokeCount: 1, pointCount: 0 };
    }
}


function getPenMemoStrokeStatsFromStrokes(strokes: KoreanFieldworkPenMemoStroke[]): {
    strokeCount: number;
    pointCount: number;
} {

    return {
        strokeCount: strokes.length,
        pointCount: strokes.reduce((sum, stroke) => sum + stroke.points.length, 0)
    };
}


function getPenMemoStrokes(value: unknown): KoreanFieldworkPenMemoStroke[] {

    if (typeof value !== 'string') return getParsedPenMemoStrokes(value);

    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue === '[]') return [];

    try {
        return getParsedPenMemoStrokes(JSON.parse(trimmedValue));
    } catch (_err) {
        return [];
    }
}


function getParsedPenMemoStrokes(value: unknown): KoreanFieldworkPenMemoStroke[] {

    const strokesValue = isRecord(value) && Array.isArray(value.strokes)
        ? value.strokes
        : value;
    if (!Array.isArray(strokesValue)) return [];

    return strokesValue
        .map(getStrokePoints)
        .filter(points => points.length > 0)
        .map(points => ({ points }));
}


function getStrokePoints(stroke: unknown): KoreanFieldworkPenMemoPoint[] {

    const points = isRecord(stroke) && Array.isArray(stroke.points)
        ? stroke.points
        : stroke;

    if (!Array.isArray(points)) return [];

    return points
        .map(getStrokePoint)
        .filter((point): point is KoreanFieldworkPenMemoPoint => point !== undefined);
}


function getStrokePoint(point: unknown): KoreanFieldworkPenMemoPoint|undefined {

    if (!isRecord(point)) return undefined;

    return getFiniteCoordinate(point.x) === undefined || getFiniteCoordinate(point.y) === undefined
        ? undefined
        : {
            x: getFiniteCoordinate(point.x) as number,
            y: getFiniteCoordinate(point.y) as number
        };
}


function getFiniteCoordinate(value: unknown): number|undefined {

    return typeof value === 'number' && Number.isFinite(value)
        ? Math.max(0, Math.min(10000, value))
        : undefined;
}


function getPointBounds(points: KoreanFieldworkPenMemoPoint[]) {

    return points.reduce((bounds, point) => ({
        minX: Math.min(bounds.minX, point.x),
        minY: Math.min(bounds.minY, point.y),
        maxX: Math.max(bounds.maxX, point.x),
        maxY: Math.max(bounds.maxY, point.y)
    }), {
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY
    });
}


function getPreviewStrokePath(points: KoreanFieldworkPenMemoPoint[]): string {

    if (points.length === 0) return '';
    if (points.length === 1) {
        const point = points[0];

        return `M ${roundPreviewCoordinate(point.x - 2)} ${point.y} L ${roundPreviewCoordinate(point.x + 2)} ${point.y} `
            + `M ${point.x} ${roundPreviewCoordinate(point.y - 2)} L ${point.x} ${roundPreviewCoordinate(point.y + 2)}`;
    }

    const [firstPoint, ...restPoints] = points;

    return [
        `M ${firstPoint.x} ${firstPoint.y}`,
        ...restPoints.map(point => `L ${point.x} ${point.y}`)
    ].join(' ');
}


function roundPreviewCoordinate(value: number): number {

    return Math.round(value * 10) / 10;
}


function isRecord(value: unknown): value is Record<string, unknown> {

    return !!value && typeof value === 'object';
}
