import {
    makeKoreanFieldworkWorkbenchItems
} from '../../../src/app/util/korean-fieldwork-workbench';


describe('korean-fieldwork-workbench', () => {

    it('prioritizes records that need field decisions and preserves parent context', () => {

        const operation = createDocument('operation-1', 'Operation', '조사구역 1', {}, {
            fieldRecordQuality: ['immediateRecording'],
            recordCreationTiming: 'duringFieldwork',
            verificationState: 'observedInField'
        });
        const trench = createDocument('trench-1', 'Trench', 'T1', {
            liesWithin: ['operation-1']
        }, {
            fieldRecordQuality: [],
            recordCreationTiming: '',
            verificationState: 'observedInField'
        });
        const feature = createDocument('feature-1', 'Feature', '수혈 1', {
            liesWithin: ['trench-1']
        }, {
            featureRecordingStatus: 'candidate',
            featureInvestigationChecklist: ['preInvestigationPhotoTaken'],
            fieldRecordQuality: [],
            recordCreationTiming: '',
            verificationState: 'pendingDecision'
        });

        const items = makeKoreanFieldworkWorkbenchItems([
            operation,
            trench,
            feature
        ] as any);

        expect(items.map(item => ({
            id: item.id,
            categoryLabel: item.categoryLabel,
            parentPath: item.parentPath,
            reasons: item.reasons,
            tone: item.tone
        }))).toEqual([
            {
                id: 'feature-1',
                categoryLabel: '유구',
                parentPath: '조사구역 1 > T1',
                reasons: ['조사 전', '과정 1/8', '추가 확인', '기록 보완'],
                tone: 'info'
            },
            {
                id: 'trench-1',
                categoryLabel: '트렌치',
                parentPath: '조사구역 1',
                reasons: ['기록 보완', '시점 미입력'],
                tone: 'neutral'
            }
        ]);
    });


    it('omits records that have no active workbench reason', () => {

        const operation = createDocument('operation-1', 'Operation', '조사구역 1', {}, {
            fieldRecordQuality: ['immediateRecording'],
            recordCreationTiming: 'duringFieldwork',
            verificationState: 'observedInField'
        });

        expect(makeKoreanFieldworkWorkbenchItems([operation] as any)).toEqual([]);
    });


    it('surfaces soil profile photos with photo-derived Munsell candidates for desktop review', () => {

        const operation = createCompleteRecord('operation-1', 'Operation', '조사구역 1');
        const layer = createCompleteRecord('layer-1', 'Layer', '토층 1', {
            liesWithin: ['operation-1']
        });
        const soilProfilePhoto = createDocument('soil-photo-1', 'SoilProfilePhoto', '토층사진 1', {
            depicts: ['layer-1']
        }, {
            soilColorAssistStatus: 'candidatesAvailable',
            soilColorAssistCandidates: '1: 10YR 4/3 (높음, 차이 0.0)',
            soilProfileColorSwatches: '[]'
        });

        const items = makeKoreanFieldworkWorkbenchItems([
            operation,
            layer,
            soilProfilePhoto
        ] as any);

        expect(items).toEqual([
            expect.objectContaining({
                id: 'soil-photo-1',
                categoryLabel: '토층사진',
                parentPath: '조사구역 1 > 토층 1',
                reasons: ['토색 후보', '먼셀 후보 10YR 4/3', '토색 미기록'],
                tone: 'warning',
                actionLabel: '토색 검토'
            })
        ]);
    });


    it('omits reviewed soil profile photos from the workbench', () => {

        const soilProfilePhoto = createDocument('soil-photo-1', 'SoilProfilePhoto', '토층사진 1', {}, {
            soilColorAssistStatus: 'reviewed',
            soilProfileColorSwatches: '1: 10YR 4/3'
        });

        expect(makeKoreanFieldworkWorkbenchItems([soilProfilePhoto] as any)).toEqual([]);
    });


    it('surfaces handwritten PenMemo records that still need transcription review', () => {

        const feature = createCompleteRecord('feature-1', 'Feature', '수혈 1');
        const memo = createDocument('memo-1', 'PenMemo', '메모 1', {
            depicts: ['feature-1']
        }, {
            penMemoStrokes: '{"version":1,"strokes":[[{"x":1,"y":2}]]}',
            penMemoTranscriptionStatus: 'pending'
        });

        const items = makeKoreanFieldworkWorkbenchItems([
            feature,
            memo
        ] as any);

        expect(items).toContainEqual(expect.objectContaining({
            id: 'memo-1',
            categoryLabel: '야장 메모',
            parentPath: '수혈 1',
            reasons: ['태블릿 손글씨 원자료', '스케치 메모 1획/1점.'],
            tone: 'warning',
            actionLabel: '메모 검토'
        }));
    });


    it('surfaces auto-transcribed PenMemo records until a reviewed transcript exists', () => {

        const memo = createDocument('memo-1', 'PenMemo', '메모 1', {}, {
            penMemoAutoTranscript: '[관찰 내용] 바닥면 추가 정리.',
            penMemoTranscriptionStatus: 'pending',
            penMemoStrokes: '[]'
        });

        const items = makeKoreanFieldworkWorkbenchItems([memo] as any);

        expect(items).toEqual([
            expect.objectContaining({
                id: 'memo-1',
                reasons: ['자동 전사 검토'],
                tone: 'warning',
                actionLabel: '메모 검토'
            })
        ]);
    });


    it('omits empty and reviewed PenMemo records from the workbench', () => {

        const emptyMemo = createDocument('memo-empty', 'PenMemo', '빈 메모', {}, {
            penMemoStrokes: '[]',
            penMemoTranscriptionStatus: 'pending'
        });
        const reviewedMemo = createDocument('memo-reviewed', 'PenMemo', '검토 메모', {}, {
            penMemoStrokes: '{"version":1,"strokes":[[{"x":1,"y":2}]]}',
            penMemoReviewedTranscript: '[관찰 내용] 바닥면 정리 완료.',
            penMemoTranscriptionStatus: 'reviewed'
        });

        expect(makeKoreanFieldworkWorkbenchItems([
            emptyMemo,
            reviewedMemo
        ] as any)).toEqual([]);
    });
});


const createDocument = (
        id: string,
        category: string,
        identifier: string,
        relations: Record<string, string[]> = {},
        fields: Record<string, unknown> = {}
) => ({
    resource: {
        id,
        identifier,
        category,
        relations,
        ...fields
    }
});


const createCompleteRecord = (
        id: string,
        category: string,
        identifier: string,
        relations: Record<string, string[]> = {}
) => createDocument(id, category, identifier, relations, {
    fieldRecordQuality: ['immediateRecording'],
    recordCreationTiming: 'duringFieldwork',
    verificationState: 'observedInField'
});
