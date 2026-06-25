import {
    getKoreanFieldworkCloseoutSummary,
    makeKoreanFieldworkCloseoutSummary
} from '../../../src/app/util/korean-fieldwork-closeout';


describe('korean-fieldwork-closeout', () => {

    it('blocks closeout when critical issues remain', () => {

        const summary = getKoreanFieldworkCloseoutSummary([
            createIssue('warning', 'feature-2', '이어서 볼 유구', 'w'),
            createIssue('critical', 'feature-1', '먼저 볼 유구', 'c'),
            createIssue('info', 'sample-1', '살펴볼 시료', 'i')
        ] as any);

        expect(summary.status).toBe('blocked');
        expect(summary.title).toBe('먼저 볼 항목');
        expect(summary.counts).toEqual({ critical: 1, warning: 1, info: 1 });
        expect(summary.issues.map(issue => issue.ruleId)).toEqual(['c', 'w', 'i']);
    });


    it('keeps a review state for warning and info issues', () => {

        const summary = getKoreanFieldworkCloseoutSummary([
            createIssue('info', 'find-1', '유물', 'i'),
            createIssue('warning', 'feature-1', '유구', 'w')
        ] as any);

        expect(summary.status).toBe('needsReview');
        expect(summary.title).toBe('마감 전 확인');
        expect(summary.detail).toBe('이어서 볼 항목 1건, 살펴볼 항목 1건이 남아 있습니다.');
    });


    it('returns a clear state when no issues remain', () => {

        const summary = getKoreanFieldworkCloseoutSummary([]);

        expect(summary.status).toBe('clear');
        expect(summary.title).toBe('마감 가능');
        expect(summary.issues).toEqual([]);
    });


    it('builds closeout summary from project documents', () => {

        const feature = {
            resource: {
                id: 'feature-1',
                identifier: 'feature-1',
                category: 'Feature',
                relations: {},
                featureRecordingStatus: 'confirmed',
                featureInvestigationChecklist: []
            }
        };

        const summary = makeKoreanFieldworkCloseoutSummary([feature] as any);

        expect(summary.status).toBe('needsReview');
        expect(summary.counts.warning).toBe(1);
        expect(summary.issues[0]).toMatchObject({
            documentId: 'feature-1',
            ruleId: 'feature-complete-photo'
        });
    });


    it('adds soil profile color review issues to closeout', () => {

        const soilProfilePhoto = createDocument('soil-photo-1', 'SoilProfilePhoto', '토층사진 1', {
            soilColorAssistStatus: 'candidatesAvailable',
            soilColorAssistCandidates: '1: 10YR 4/3 (높음, 차이 0.0)',
            soilProfileColorSwatches: '[]'
        });

        const summary = makeKoreanFieldworkCloseoutSummary([soilProfilePhoto] as any);

        expect(summary.status).toBe('needsReview');
        expect(summary.counts.warning).toBe(2);
        expect(summary.issues.map(issue => issue.ruleId)).toEqual([
            'soil-color-candidates-review',
            'soil-profile-color-swatches-missing'
        ]);
        expect(summary.issues[0].message).toBe('사진에서 읽은 먼셀 후보를 검토해야 합니다.');
        expect(summary.issues[0].recommendedAction).toContain('먼셀값');
        expect(summary.issues[0].recommendedAction).toContain('먼셀 후보 10YR 4/3');
        expect(summary.issues.map(issue => `${issue.message} ${issue.recommendedAction}`).join('\n'))
            .not.toContain('Munsell');
    });


    it('adds unreviewed PenMemo transcription issues to closeout', () => {

        const handwrittenMemo = createDocument('memo-1', 'PenMemo', '메모 1', {
            penMemoStrokes: '{"version":1,"strokes":[[{"x":1,"y":2}]]}',
            penMemoTranscriptionStatus: 'pending'
        });
        const reviewedMemo = createDocument('memo-2', 'PenMemo', '메모 2', {
            penMemoReviewedTranscript: '[관찰 내용] 바닥면 정리 완료.',
            penMemoStrokes: '{"version":1,"strokes":[[{"x":1,"y":2}]]}',
            penMemoTranscriptionStatus: 'reviewed'
        });

        const summary = makeKoreanFieldworkCloseoutSummary([
            handwrittenMemo,
            reviewedMemo
        ] as any);

        expect(summary.status).toBe('needsReview');
        expect(summary.counts.warning).toBe(1);
        expect(summary.issues[0]).toMatchObject({
            documentId: 'memo-1',
            ruleId: 'pen-memo-handwriting-transcription',
            message: '태블릿 손글씨 야장 메모가 아직 전사되지 않았습니다. 스케치 메모 1획/1점.',
            recommendedAction: '태블릿 손글씨 원자료 · 스케치 메모 1획/1점. 태블릿 손글씨 원자료를 읽어 검토 전사문으로 남기세요.'
        });
    });
});


const createIssue = (
    severity: 'critical'|'warning'|'info',
    documentId: string,
    identifier: string,
    ruleId: string
) => ({
    severity,
    documentId,
    identifier,
    ruleId,
    category: 'Feature',
    message: 'message',
    relatedFields: [],
    recommendedAction: '확인하세요.',
    blocksSave: false
});


const createDocument = (
        id: string,
        category: string,
        identifier: string,
        fields: Record<string, unknown> = {}
) => ({
    resource: {
        id,
        identifier,
        category,
        relations: {},
        ...fields
    }
});
