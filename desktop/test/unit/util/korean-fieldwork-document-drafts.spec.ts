import {
    createDraftIdentifier,
    createKoreanFieldworkDraftRelations,
    createKoreanFieldworkDraftResource,
    getKoreanFieldworkContinuationActions
} from '../../../src/app/util/korean-fieldwork-document-drafts';


describe('Korean fieldwork document drafts', () => {

    beforeEach(() => {
        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    });


    afterEach(() => {
        jest.restoreAllMocks();
    });


    it('creates immediately saveable trench drafts below operation records', () => {

        const operationDoc = createDoc('operation-1', 'Operation');
        const config = createConfig({
            'Trench:Operation': ['isRecordedIn', 'liesWithin']
        });

        const draft = createKoreanFieldworkDraftResource(operationDoc, 'Trench', config);

        expect(draft).toMatchObject({
            identifier: 'trench-1700000000000',
            category: 'Trench',
            relations: {
                isRecordedIn: ['operation-1'],
                liesWithin: ['operation-1']
            },
            recordCreationTiming: 'duringFieldwork',
            fieldRecordQuality: [],
            featureInvestigationChecklist: []
        });
    });


    it('keeps nested feature drafts linked to their operation and parent feature', () => {

        const featureDoc = createDoc('feature-1', 'Feature', {
            isRecordedIn: ['operation-1']
        });
        const config = createConfig({
            'FeatureSegment:Feature': ['liesWithin']
        });

        const draft = createKoreanFieldworkDraftResource(featureDoc, 'FeatureSegment', config);

        expect(draft).toMatchObject({
            identifier: 'feature-segment-1700000000000',
            category: 'FeatureSegment',
            relations: {
                isRecordedIn: ['operation-1'],
                liesWithin: ['feature-1']
            },
            featureRecordingStatus: 'candidate',
            featureGeometryEditStatus: 'roughSketch',
            featureGeometryRevisionHistory: '[]',
            featureInvestigationChecklist: [],
            featureSoilProfilePhotoCount: 0
        });
    });


    it('starts feature drafts with a fieldwork feature type and supports typed feature drafts', () => {

        const operationDoc = createDoc('operation-1', 'Operation');
        const config = createConfig({
            'Feature:Operation': ['isRecordedIn', 'liesWithin']
        });

        expect(createKoreanFieldworkDraftResource(operationDoc, 'Feature', config)).toMatchObject({
            identifier: '유구-1700000000000',
            category: 'Feature',
            relations: {
                isRecordedIn: ['operation-1'],
                liesWithin: ['operation-1']
            },
            featureType: 'unknown',
            featureRecordingStatus: 'candidate',
            featureInvestigationChecklist: []
        });
        expect(createKoreanFieldworkDraftResource(operationDoc, 'Feature', config, {
            featureType: 'kiln'
        })).toMatchObject({
            identifier: '가마-1700000000000',
            featureType: 'kiln',
            featureInterpretationType: ['kiln']
        });
    });


    it('creates photo and survey boundary drafts with Korean fieldwork defaults', () => {

        const featureDoc = createDoc('feature-1', 'Feature');
        const operationDoc = createDoc('operation-1', 'Operation');
        const config = createConfig({
            'Photo:Feature': ['depicts'],
            'SurveyBoundary:Operation': ['isRecordedIn']
        });

        expect(createKoreanFieldworkDraftResource(featureDoc, 'Photo', config)).toMatchObject({
            identifier: 'photo-1700000000000',
            category: 'Photo',
            relations: { depicts: ['feature-1'] },
            fieldworkPhotoQuality: 0.35,
            fieldworkPhotoSizeHintKb: 512,
            mediaEvidenceRole: ['fieldResultRecord']
        });
        expect(createKoreanFieldworkDraftResource(operationDoc, 'SurveyBoundary', config, {
            boundarySummary: '  1구역 북쪽 능선부터 남쪽 농로까지  '
        })).toMatchObject({
            identifier: 'survey-boundary-1700000000000',
            category: 'SurveyBoundary',
            relations: { isRecordedIn: ['operation-1'] },
            shortDescription: '1구역 북쪽 능선부터 남쪽 농로까지',
            referenceBasemapProvider: 'none',
            surveyBoundaryAccuracy: 'visualReference',
            surveyBoundaryNote: '1구역 북쪽 능선부터 남쪽 농로까지',
            surveyBoundarySource: 'manualBasemapTrace',
            surveyBoundaryType: 'operationBoundary'
        });
    });


    it('can seed SurveyBoundary draft metadata for imported desktop vector boundaries', () => {

        const operationDoc = createDoc('operation-1', 'Operation');
        const config = createConfig({
            'SurveyBoundary:Operation': ['isRecordedIn']
        });

        expect(createKoreanFieldworkDraftResource(operationDoc, 'SurveyBoundary', config, {
            boundaryAccuracy: 'importedReference',
            boundarySource: 'shpImport',
            boundarySummary: '  SHP 파일에서 가져온 조사 경계  ',
            referenceBasemapProvider: 'importedVectorLayer'
        })).toMatchObject({
            identifier: 'survey-boundary-1700000000000',
            category: 'SurveyBoundary',
            relations: { isRecordedIn: ['operation-1'] },
            shortDescription: 'SHP 파일에서 가져온 조사 경계',
            referenceBasemapProvider: 'importedVectorLayer',
            surveyBoundaryAccuracy: 'importedReference',
            surveyBoundaryNote: 'SHP 파일에서 가져온 조사 경계',
            surveyBoundarySource: 'shpImport',
            surveyBoundaryType: 'operationBoundary'
        });
    });


    it('can seed selected-record PenMemo drafts with a field note template', () => {

        const featureDoc = createDoc('feature-1', 'Feature', {}, { identifier: '수혈 1' });
        const config = createConfig({
            'PenMemo:Feature': ['depicts']
        });

        expect(createKoreanFieldworkDraftResource(featureDoc, 'PenMemo', config, {
            recordMemoTemplate: true
        })).toMatchObject({
            identifier: 'pen-memo-1700000000000',
            category: 'PenMemo',
            relations: { depicts: ['feature-1'] },
            shortDescription: '수혈 1 현장 메모',
            description: '[관찰 내용]\n\n[스케치·약측/근거 번호]\n\n[다음 작업]',
            penMemoStrokes: '[]',
            penMemoTranscriptionStatus: 'pending'
        });
    });


    it('can seed PenMemo drafts from notebook continuations', () => {

        const featureDoc = createDoc('feature-1', 'Feature', {}, { identifier: '수혈 1' });
        const config = createConfig({
            'PenMemo:Feature': ['depicts']
        });

        expect(createKoreanFieldworkDraftResource(featureDoc, 'PenMemo', config, {
            recordMemoContinuation: {
                id: 'memo-1',
                sourceLabel: '메모 남은 작업',
                input: {
                    observation: '바닥면 정리 중 원형 윤곽 확인.',
                    nextWork: '사진 보강.',
                    evidenceNumbers: '사진 12'
                }
            }
        })).toMatchObject({
            identifier: 'pen-memo-1700000000000',
            category: 'PenMemo',
            relations: { depicts: ['feature-1'] },
            shortDescription: '수혈 1 메모 남은 작업',
            description: '[관찰 내용] 바닥면 정리 중 원형 윤곽 확인.\n\n[스케치·약측/근거 번호] 사진 12\n\n[다음 작업] 사진 보강.',
            penMemoStrokes: '[]',
            penMemoTranscriptionStatus: 'pending'
        });
    });


    it('recommends next child and evidence actions in fieldwork order', () => {

        const featureDoc = createDoc('feature-1', 'Feature');
        const config = createConfig({
            'FeatureSegment:Feature': ['liesWithin'],
            'Photo:Feature': ['depicts'],
            'Sample:Feature': ['liesWithin']
        });

        expect(getKoreanFieldworkContinuationActions(featureDoc, config))
            .toEqual([
                { id: 'FeatureSegment:liesWithin', categoryName: 'FeatureSegment', relationName: 'liesWithin' },
                { id: 'Photo:depicts', categoryName: 'Photo', relationName: 'depicts' },
                { id: 'Sample:liesWithin', categoryName: 'Sample', relationName: 'liesWithin' }
            ]);
    });


    it('keeps sketch memos visible before finds and samples in continuation actions', () => {

        const featureDoc = createDoc('feature-1', 'Feature');
        const config = createConfig({
            'FeatureSegment:Feature': ['liesWithin'],
            'Photo:Feature': ['depicts'],
            'SoilProfilePhoto:Feature': ['depicts'],
            'Drawing:Feature': ['depicts'],
            'PenMemo:Feature': ['depicts'],
            'Find:Feature': ['liesWithin'],
            'Sample:Feature': ['liesWithin']
        });

        expect(getKoreanFieldworkContinuationActions(featureDoc, config)
            .map(action => action.categoryName))
            .toEqual(['FeatureSegment', 'Photo', 'SoilProfilePhoto', 'Drawing', 'PenMemo']);
    });


    it('falls back to inherited operation context when no direct relation is configured', () => {

        const featureDoc = createDoc('feature-1', 'Feature', {
            isRecordedIn: ['operation-1']
        });
        const config = createConfig({});

        expect(createKoreanFieldworkDraftRelations(featureDoc, 'Find', config))
            .toEqual({
                isRecordedIn: ['operation-1'],
                liesWithin: ['feature-1']
            });
    });


    it('uses kebab-case identifiers for categories without a dedicated prefix', () => {

        expect(createDraftIdentifier('CustomRecordType')).toBe('custom-record-type-1700000000000');
    });
});


const createDoc = (id: string,
                   category: string,
                   relations: Record<string, string[]> = {},
                   fields: Record<string, any> = {}) => ({
    resource: {
        id,
        category,
        relations,
        ...fields
    }
} as any);


const createConfig = (allowed: Record<string, string[]>) => ({
    getCategory: (categoryName: string) => createCategory(categoryName),
    isAllowedRelationDomainCategory: (
        categoryName: string,
        parentCategoryName: string,
        relationName: string
    ) => (allowed[`${categoryName}:${parentCategoryName}`] ?? []).includes(relationName)
} as any);


const createCategory = (name: string) => ({
    name,
    mustLieWithin: false,
    groups: [{
        name: 'koreanFieldwork',
        fields: createFields(name)
    }]
} as any);


const createFields = (categoryName: string) => {

    switch (categoryName) {
        case 'FeatureSegment':
            return [
                field('featureRecordingStatus', 'KoreanFieldwork-featureRecordingStatus'),
                field('featureGeometryEditStatus'),
                field('featureGeometryRevisionHistory'),
                field('featureInvestigationChecklist'),
                field('featureSoilProfilePhotoCount')
            ];
        case 'Trench':
            return [
                field('recordCreationTiming', 'KoreanFieldwork-recordCreationTiming'),
                field('fieldRecordQuality'),
                field('featureInvestigationChecklist')
            ];
        case 'Feature':
            return [
                field('featureType'),
                field('featureInterpretationType'),
                field('featureRecordingStatus', 'KoreanFieldwork-featureRecordingStatus'),
                field('featureGeometryEditStatus'),
                field('featureGeometryRevisionHistory'),
                field('featureInvestigationChecklist'),
                field('featureSoilProfilePhotoCount')
            ];
        case 'Photo':
            return [
                field('fieldworkPhotoQuality'),
                field('fieldworkPhotoSizeHintKb'),
                field('mediaEvidenceRole')
            ];
        case 'SurveyBoundary':
            return [
                field('shortDescription'),
                field('referenceBasemapProvider'),
                field('surveyBoundaryAccuracy'),
                field('surveyBoundaryNote'),
                field('surveyBoundarySource'),
                field('surveyBoundaryType', 'KoreanFieldwork-surveyBoundaryType')
            ];
        case 'PenMemo':
            return [
                field('shortDescription'),
                field('description'),
                field('penMemoStrokes'),
                field('penMemoTranscriptionStatus')
            ];
        default:
            return [];
    }
};


const field = (name: string, valuelistId?: string) => ({
    name,
    ...(valuelistId ? { valuelist: { id: valuelistId } } : {})
});
