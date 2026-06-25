import {
    getPenMemoSketchPreview,
    getPenMemoSketchSummaries,
    getPenMemoTranscriptionSummaryLabel,
    getPendingPenMemoTranscriptionDocuments,
    getSoilColorCandidateSummaries,
    makeKoreanFieldworkEvidenceReview
} from '../../../src/app/util/korean-fieldwork-evidence-review';


describe('korean-fieldwork-evidence-review', () => {

    it('flags tablet handwriting PenMemo records until a reviewed transcript exists', () => {

        const feature = createDocument('feature-1', 'Feature');
        const pendingHandwritingMemo = createDocument('memo-1', 'PenMemo', {
            relations: { depicts: ['feature-1'] },
            penMemoStrokes: '{"version":1,"strokes":[{"points":[{"x":10,"y":20}]}]}',
            penMemoTranscriptionStatus: 'pending'
        });
        const reviewedHandwritingMemo = createDocument('memo-2', 'PenMemo', {
            relations: { depicts: ['feature-1'] },
            penMemoReviewedTranscript: '[관찰 내용] 바닥면 정리 완료.',
            penMemoStrokes: '{"version":1,"strokes":[{"points":[{"x":30,"y":40}]}]}',
            penMemoTranscriptionStatus: 'reviewed'
        });

        const review = makeKoreanFieldworkEvidenceReview(feature as any, [
            feature,
            pendingHandwritingMemo,
            reviewedHandwritingMemo,
            createDocument('photo-1', 'Photo', { relations: { depicts: ['feature-1'] } }),
            createDocument('drawing-1', 'Drawing', { relations: { depicts: ['feature-1'] } }),
            createDocument('report-1', 'ReportPreparationReview', { relations: { isRecordedIn: ['feature-1'] } })
        ] as any);

        expect(review.penMemos.length).toBe(2);
        expect(review.pendingPenMemoTranscriptions.map(document => document.resource.id))
            .toEqual(['memo-1']);
        expect(review.penMemoTranscriptionSummaries.map(summary => ({
            id: summary.document.resource.id,
            label: summary.label
        }))).toEqual([
            {
                id: 'memo-1',
                label: '태블릿 손글씨 원자료 · 스케치 메모 1획/1점.'
            }
        ]);
        expect(review.penMemoSketchSummaries.map(summary => ({
            id: summary.document.resource.id,
            strokeCount: summary.strokeCount,
            pointCount: summary.pointCount,
            pendingTranscription: summary.pendingTranscription
        }))).toEqual([
            {
                id: 'memo-1',
                strokeCount: 1,
                pointCount: 1,
                pendingTranscription: true
            },
            {
                id: 'memo-2',
                strokeCount: 1,
                pointCount: 1,
                pendingTranscription: false
            }
        ]);
        expect(review.missingEvidenceKinds).toContain('penMemoTranscription');
        expect(review.issues).toEqual(expect.arrayContaining([
            expect.objectContaining({
                documentId: 'memo-1',
                ruleId: 'pen-memo-handwriting-transcription',
                message: '태블릿 손글씨 야장 메모가 아직 전사되지 않았습니다. 스케치 메모 1획/1점.',
                recommendedAction: '태블릿 손글씨 원자료 · 스케치 메모 1획/1점. 태블릿 손글씨 원자료를 읽어 검토 전사문으로 남기세요.'
            })
        ]));
        expect(review.reportReady).toBe(false);
    });


    it('summarizes tablet sketch memo stroke and point counts for desktop review', () => {

        const summaries = getPenMemoSketchSummaries([
            createDocument('memo-sketch', 'PenMemo', {
                penMemoStrokes: '{"version":1,"strokes":[{"points":[{"x":10,"y":20},{"x":12,"y":21}]},{"points":[{"x":30,"y":40}]}]}',
                penMemoTranscriptionStatus: 'pending'
            }),
            createDocument('memo-reviewed', 'PenMemo', {
                penMemoReviewedTranscript: '[관찰 내용] 평면 약측 전사.',
                penMemoStrokes: '[[{"x":1,"y":2},{"x":3,"y":4}]]',
                penMemoTranscriptionStatus: 'reviewed'
            }),
            createDocument('memo-empty', 'PenMemo', {
                penMemoStrokes: '[]'
            })
        ] as any);

        expect(summaries.map(summary => ({
            id: summary.document.resource.id,
            strokeCount: summary.strokeCount,
            pointCount: summary.pointCount,
            pendingTranscription: summary.pendingTranscription
        }))).toEqual([
            {
                id: 'memo-sketch',
                strokeCount: 2,
                pointCount: 3,
                pendingTranscription: true
            },
            {
                id: 'memo-reviewed',
                strokeCount: 1,
                pointCount: 2,
                pendingTranscription: false
            }
        ]);
    });


    it('builds desktop SVG previews from tablet sketch memo strokes', () => {

        const preview = getPenMemoSketchPreview(JSON.stringify({
            version: 1,
            strokes: [
                { points: [{ x: 10, y: 20 }, { x: 40, y: 50 }] },
                { points: [{ x: 80, y: 20 }] }
            ]
        }));

        expect(preview).toEqual({
            label: '스케치 메모 2획/3점.',
            path: 'M 8 13.7 L 52.6 58.3 M 110 13.7 L 114 13.7 M 112 11.7 L 112 15.7',
            viewBox: '0 0 120 72'
        });
        expect(getPenMemoSketchPreview('[]')).toBeUndefined();
    });


    it('summarizes photo-derived soil color candidates for desktop review panels', () => {

        const summaries = getSoilColorCandidateSummaries([
            createDocument('soil-photo-1', 'SoilProfilePhoto', {
                soilColorAssistCandidates: '1: 10YR 4/3 (높음)\n2: 7.5YR 4/3 (보통)'
            }),
            createDocument('soil-photo-empty', 'SoilProfilePhoto', {
                soilColorAssistCandidates: '사진 색상 샘플을 읽지 못했습니다.'
            })
        ] as any);

        expect(summaries).toEqual([
            expect.objectContaining({
                candidates: ['10YR 4/3', '7.5YR 4/3'],
                document: expect.objectContaining({
                    resource: expect.objectContaining({ id: 'soil-photo-1' })
                }),
                label: '먼셀 후보 10YR 4/3, 7.5YR 4/3'
            })
        ]);
    });


    it('flags auto-transcribed PenMemo records until desktop review confirms the transcript', () => {

        const pendingAutoMemo = createDocument('memo-auto', 'PenMemo', {
            penMemoAutoTranscript: '[관찰 내용] 바닥 추가 정리.',
            penMemoTranscriptionStatus: 'pending',
            penMemoStrokes: '[]'
        });
        const reviewedAutoMemo = createDocument('memo-reviewed', 'PenMemo', {
            penMemoAutoTranscript: '[관찰 내용] 아궁이 정리.',
            penMemoReviewedTranscript: '[관찰 내용] 아궁이 정리.',
            penMemoTranscriptionStatus: 'reviewed',
            penMemoStrokes: '[]'
        });

        expect(getPendingPenMemoTranscriptionDocuments([
            pendingAutoMemo,
            reviewedAutoMemo
        ] as any).map(document => document.resource.id)).toEqual(['memo-auto']);

        expect(makeKoreanFieldworkEvidenceReview(
            createDocument('feature-1', 'Feature') as any,
            [
                createDocument('feature-1', 'Feature'),
                {
                    ...pendingAutoMemo,
                    resource: {
                        ...pendingAutoMemo.resource,
                        relations: { depicts: ['feature-1'] }
                    }
                }
            ] as any
        ).issues).toEqual(expect.arrayContaining([
            expect.objectContaining({
                documentId: 'memo-auto',
                ruleId: 'pen-memo-auto-transcript-review',
                recommendedAction: '자동 전사 검토. 자동 전사를 확인하고 검토 전사문으로 확정하세요.'
            })
        ]));
    });


    it('labels mixed handwriting and auto transcription as a source comparison task', () => {

        const memo = createDocument('memo-mixed', 'PenMemo', {
            penMemoAutoTranscript: '[관찰 내용] 평면 윤곽 전사.',
            penMemoStrokes: '{"version":1,"strokes":[{"points":[{"x":10,"y":20},{"x":11,"y":21}]}]}',
            penMemoTranscriptionStatus: 'pending'
        });

        expect(getPenMemoTranscriptionSummaryLabel(memo as any))
            .toBe('태블릿 손글씨·자동 전사 · 스케치 메모 1획/2점.');
        expect(makeKoreanFieldworkEvidenceReview(
            createDocument('feature-1', 'Feature') as any,
            [
                createDocument('feature-1', 'Feature'),
                {
                    ...memo,
                    resource: {
                        ...memo.resource,
                        relations: { depicts: ['feature-1'] }
                    }
                }
            ] as any
        ).issues).toEqual(expect.arrayContaining([
            expect.objectContaining({
                ruleId: 'pen-memo-auto-transcript-review',
                recommendedAction: '태블릿 손글씨·자동 전사 · 스케치 메모 1획/2점. 자동 전사를 원본 손글씨와 대조하고 검토 전사문으로 확정하세요.'
            })
        ]));
    });
});


const createDocument = (
    id: string,
    category: string,
    resource: Record<string, unknown> = {}
) => ({
    resource: {
        id,
        identifier: id,
        category,
        relations: {},
        ...resource
    }
});
