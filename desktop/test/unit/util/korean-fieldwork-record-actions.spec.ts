import {
    makeKoreanFieldworkRecordActions
} from '../../../src/app/util/korean-fieldwork-record-actions';


describe('korean-fieldwork-record-actions', () => {

    it('prioritizes open issues before next child and evidence drafts', () => {

        const feature = createDoc('feature-1', 'Feature', {}, {
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: []
        });
        const actions = makeKoreanFieldworkRecordActions(
            feature,
            [feature],
            createConfig({
                'FeatureSegment:Feature': ['liesWithin'],
                'Photo:Feature': ['depicts']
            })
        );

        expect(actions.map(action => action.id)).toEqual([
            'issue-feature-complete-photo-feature-1',
            'create-FeatureSegment',
            'create-Photo'
        ]);
        expect(actions[0]).toMatchObject({
            type: 'openDocument',
            label: '이 기록 점검',
            tone: 'warning',
            documentId: 'feature-1'
        });
        expect(actions[1]).toMatchObject({
            type: 'createDocument',
            label: '세부 단위 추가',
            categoryName: 'FeatureSegment'
        });
    });


    it('skips structural suggestions that already exist and suggests missing evidence', () => {

        const feature = createDoc('feature-1', 'Feature');
        const segment = createDoc('segment-1', 'FeatureSegment', {
            liesWithin: ['feature-1']
        });
        const actions = makeKoreanFieldworkRecordActions(
            feature,
            [feature, segment],
            createConfig({
                'FeatureSegment:Feature': ['liesWithin'],
                'Photo:Feature': ['depicts'],
                'Drawing:Feature': ['depicts']
            })
        );

        expect(actions.map(action => action.id)).not.toContain('create-FeatureSegment');
        expect(actions).toContainEqual(expect.objectContaining({
            id: 'create-Photo',
            label: '사진 추가',
            tone: 'warning'
        }));
    });


    it('respects the requested action limit', () => {

        const layer = createDoc('layer-1', 'Layer');
        const actions = makeKoreanFieldworkRecordActions(
            layer,
            [layer],
            createConfig({
                'SoilProfilePhoto:Layer': ['depicts'],
                'Sample:Layer': ['liesWithin'],
                'Photo:Layer': ['depicts']
            }),
            1
        );

        expect(actions).toHaveLength(1);
        expect(actions[0]).toMatchObject({
            id: 'create-SoilProfilePhoto',
            label: '토층사진 추가'
        });
    });


    it('keeps pen memos out of the missing-evidence warning priority', () => {

        const feature = createDoc('feature-1', 'Feature');
        const actions = makeKoreanFieldworkRecordActions(
            feature,
            [feature],
            createConfig({
                'PenMemo:Feature': ['isRecordedIn']
            })
        );

        expect(actions).toEqual([
            expect.objectContaining({
                id: 'create-PenMemo',
                label: '야장 메모 추가',
                tone: 'neutral'
            })
        ]);
    });


    it('surfaces tablet handwriting PenMemo transcription as a related record check', () => {

        const feature = createDoc('feature-1', 'Feature');
        const memo = createDoc('memo-1', 'PenMemo', {
            depicts: ['feature-1']
        }, {
            penMemoStrokes: '{"version":1,"strokes":[{"points":[{"x":10,"y":20}]}]}',
            penMemoTranscriptionStatus: 'pending'
        });
        const actions = makeKoreanFieldworkRecordActions(
            feature,
            [feature, memo],
            createConfig({})
        );

        expect(actions[0]).toMatchObject({
            id: 'issue-pen-memo-handwriting-transcription-memo-1',
            type: 'openDocument',
            label: '관련 점검',
            detail: '태블릿 손글씨 원자료 · 스케치 메모 1획/1점. 태블릿 손글씨 원자료를 읽어 검토 전사문으로 남기세요.',
            documentId: 'memo-1',
            tone: 'warning'
        });
    });
});


const createDoc = (
    id: string,
    category: string,
    relations: Record<string, string[]> = {},
    extraResource: Record<string, unknown> = {}
) => ({
    resource: {
        id,
        identifier: id,
        category,
        relations,
        ...extraResource
    }
} as any);


const createConfig = (allowed: Record<string, string[]>) => ({
    getCategory: (categoryName: string) => ({
        name: categoryName,
        mustLieWithin: false,
        groups: []
    }),
    isAllowedRelationDomainCategory: (
        categoryName: string,
        parentCategoryName: string,
        relationName: string
    ) => (allowed[`${categoryName}:${parentCategoryName}`] ?? []).includes(relationName)
} as any);
