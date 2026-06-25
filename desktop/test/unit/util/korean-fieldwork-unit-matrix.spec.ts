import {
    makeKoreanFieldworkFeatureOverviewItems,
    makeKoreanFieldworkUnitMatrixItems
} from '../../../src/app/util/korean-fieldwork-unit-matrix';


describe('korean-fieldwork-unit-matrix', () => {

    it('summarizes structure, evidence, issues, and next desktop actions by unit', () => {

        const operation = createDocument('operation-1', 'Operation');
        const trench = createDocument('trench-1', 'Trench', {
            relations: { liesWithin: ['operation-1'] }
        });
        const feature = createDocument('feature-1', 'Feature', {
            relations: { liesWithin: ['trench-1'] },
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: ['preInvestigationPhotoTaken']
        });
        const photo = createDocument('photo-1', 'Photo', {
            relations: { depicts: ['feature-1'] }
        });

        const items = makeKoreanFieldworkUnitMatrixItems(
            [operation, trench, feature, photo],
            createDocument('project', 'Project'),
            createProjectConfiguration()
        );

        expect(items.find(item => item.id === 'operation-1')).toMatchObject({
            categoryLabel: '조사 구역 기록',
            childStructureCount: 1,
            nextChildCategoryName: 'Trench'
        });
        expect(items.find(item => item.id === 'feature-1')).toMatchObject({
            categoryLabel: '유구',
            evidenceCount: 1,
            issueCount: 1,
            checklistDone: 1,
            checklistTotal: 8,
            nextChildCategoryName: 'FeatureSegment',
            photoCategoryName: 'Photo',
            tone: 'warning'
        });
    });


    it('uses excavation mode to add features directly below an operation', () => {

        const operation = createDocument('operation-1', 'Operation');
        const project = createDocument('project', 'Project', {
            projectInvestigationMode: 'excavation'
        });

        const [item] = makeKoreanFieldworkUnitMatrixItems(
            [operation],
            project,
            createProjectConfiguration()
        );

        expect(item).toMatchObject({
            nextChildCategoryName: 'Feature'
        });
    });


    it('tracks trench process checks in trial trench mode', () => {

        const operation = createDocument('operation-1', 'Operation');
        const trench = createDocument('trench-1', 'Trench', {
            relations: { liesWithin: ['operation-1'] },
            featureInvestigationChecklist: [
                'trenchSoilCleaned',
                'trenchFeatureChecked'
            ]
        });
        const project = createDocument('project', 'Project', {
            projectInvestigationMode: 'trialTrench'
        });

        const items = makeKoreanFieldworkUnitMatrixItems(
            [operation, trench],
            project,
            createProjectConfiguration()
        );

        expect(items.find(item => item.id === 'trench-1')).toMatchObject({
            checklistDone: 2,
            checklistTotal: 9,
            nextChildCategoryName: 'Feature'
        });
    });


    it('builds a compact all-feature overview for desktop review', () => {

        const operation = createDocument('operation-1', 'Operation');
        const trench = createDocument('trench-1', 'Trench', {
            relations: { liesWithin: ['operation-1'] }
        });
        const feature = createDocument('feature-1', 'Feature', {
            relations: { liesWithin: ['trench-1'] },
            featureInvestigationChecklist: ['preInvestigationPhotoTaken']
        });
        const photo = createDocument('photo-1', 'Photo', {
            relations: { depicts: ['feature-1'] }
        });

        const items = makeKoreanFieldworkFeatureOverviewItems(
            [operation, trench, feature, photo],
            createDocument('project', 'Project'),
            createProjectConfiguration()
        );

        expect(items.map(item => item.id)).toEqual(['feature-1']);
        expect(items[0]).toMatchObject({
            identifier: 'feature-1',
            statusLabel: '조사 중',
            evidenceLabel: '근거자료 1',
            nextActionLabel: '조사 과정 1/8'
        });
    });
});


const createDocument = (id: string, category: string, fields: any = {}) => ({
    resource: {
        id,
        identifier: id,
        category,
        relations: {},
        ...fields
    }
} as any);


const createProjectConfiguration = () => ({
    getCategory: (categoryName: string) => ({
        name: categoryName,
        mustLieWithin: false,
        groups: []
    }),
    isAllowedRelationDomainCategory: (
        categoryName: string,
        _parentCategoryName: string,
        relationName: string
    ) => {
        if (['Photo', 'SoilProfilePhoto', 'Drawing'].includes(categoryName)) {
            return relationName === 'depicts';
        }
        if (['DailyLog', 'SurveyBoundary'].includes(categoryName)) {
            return relationName === 'isRecordedIn';
        }
        return relationName === 'liesWithin' || relationName === 'isRecordedIn';
    }
} as any);
