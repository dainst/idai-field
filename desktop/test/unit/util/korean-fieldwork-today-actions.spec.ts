import {
    makeKoreanFieldworkPriorityTasks
} from '../../../src/app/util/korean-fieldwork-today-actions';


describe('korean-fieldwork-today-actions', () => {

    it('starts empty projects from explicit boundary setup choices', () => {

        const tasks = makeKoreanFieldworkPriorityTasks(
            [createDocument('project', 'Project')] as any,
            createDocument('project', 'Project') as any,
            createConfig() as any
        );

        expect(tasks).toHaveLength(1);
        expect(tasks[0]).toMatchObject({
            id: 'start-operation',
            title: '조사 경계부터 만들기',
            detail: '지도에서 GPS 임시 경계, SHP/DXF/CSV, 위성지도 중 하나로 조사 경계를 먼저 잡아야 기록 흐름이 이어집니다.',
            action: { type: 'openMap' },
            actionLabel: '지도 열기',
            secondaryAction: { type: 'openImport' },
            secondaryActionDetail: 'SHP/DXF/CSV는 데스크톱 가져오기에서 불러온 뒤 동기화하면 태블릿 지도에서도 조사 경계로 보입니다.',
            secondaryActionLabel: '경계 가져오기'
        });
    });


    it('builds startup tasks for missing desktop field records', () => {

        const operation = createDocument('operation-1', 'Operation', '조사구역 1');
        const tasks = makeKoreanFieldworkPriorityTasks(
            [operation] as any,
            createDocument('project', 'Project') as any,
            createConfig() as any
        );

        expect(tasks.map(task => task.id)).toEqual([
            'create-daily-log',
            'create-survey-boundary',
            'create-trench',
            'create-detected-feature'
        ]);
        expect(tasks[1].detail).toBe(
            'GPS 임시 경계, 가져온 SHP/DXF/CSV, 위성지도 기준 중 무엇으로 확정했는지 조사 경계 기록에 남기세요.'
        );
        expect(tasks[1]).toMatchObject({
            secondaryAction: { type: 'openImport' },
            secondaryActionDetail: 'SHP/DXF/CSV는 데스크톱 가져오기에서 불러온 뒤 동기화하면 태블릿 지도에서도 조사 경계로 보입니다.',
            secondaryActionLabel: '파일 가져오기'
        });
        expect(tasks[0].action).toEqual({
            type: 'createDocument',
            parentDocumentId: 'operation-1',
            categoryName: 'DailyLog'
        });
        expect(tasks[3].action).toEqual({
            type: 'createDocument',
            parentDocumentId: 'operation-1',
            categoryName: 'Feature'
        });
    });


    it('keeps trial trench mode centered on trench setup before feature entry', () => {

        const operation = createDocument('operation-1', 'Operation', '조사구역 1');
        const tasks = makeKoreanFieldworkPriorityTasks(
            [operation] as any,
            createDocument('project', 'Project', 'project', {}, {
                projectInvestigationMode: 'trialTrench'
            }) as any,
            createConfig() as any
        );

        expect(tasks.map(task => task.id)).toEqual([
            'create-daily-log',
            'create-survey-boundary',
            'create-trench'
        ]);
        expect(tasks[2]).toMatchObject({
            title: '표본·시굴 트렌치 설정',
            action: {
                type: 'createDocument',
                parentDocumentId: 'operation-1',
                categoryName: 'Trench'
            }
        });
    });


    it('guides trial trench records through trench photos and pit soil photos', () => {

        const operation = createDocument('operation-1', 'Operation', '조사구역 1');
        const trench = createDocument('trench-1', 'Trench', 'Trench 1', {
            isRecordedIn: ['operation-1']
        });
        const feature = createDocument('feature-1', 'Feature', '유구 1', {
            isRecordedIn: ['trench-1']
        });
        const segment = createDocument('segment-1', 'FeatureSegment', 'Pit 1', {
            isRecordedInFeature: ['feature-1']
        });
        const tasks = makeKoreanFieldworkPriorityTasks(
            [
                operation,
                trench,
                feature,
                segment,
                createDocument('daily-1', 'DailyLog', '오늘 일지'),
                createDocument('boundary-1', 'SurveyBoundary', 'A구역'),
                createDocument('trench-profile-1', 'SoilProfilePhoto', '트렌치 토층', {
                    depicts: ['trench-1']
                })
            ] as any,
            createDocument('project', 'Project', 'project', {}, {
                projectInvestigationMode: 'trialTrench'
            }) as any,
            createConfig() as any
        );

        expect(tasks.map(task => task.id)).toEqual([
            'create-pit-profile-photo',
            'create-trench-photo'
        ]);
        expect(tasks[0]).toMatchObject({
            title: '피트 토층사진',
            action: {
                type: 'createDocument',
                parentDocumentId: 'segment-1',
                categoryName: 'SoilProfilePhoto'
            }
        });
        expect(tasks[1]).toMatchObject({
            title: '트렌치 사진 기록',
            action: {
                type: 'createDocument',
                parentDocumentId: 'trench-1',
                categoryName: 'Photo'
            }
        });
    });


    it('guides existing root records into an operation before adding more fieldwork', () => {

        const feature = createDocument('feature-1', 'Feature', '유구 1');
        const photo = createDocument('photo-1', 'Photo', '유구 사진', {
            depicts: ['feature-1']
        });
        const tasks = makeKoreanFieldworkPriorityTasks(
            [
                createDocument('project', 'Project'),
                feature,
                photo
            ] as any,
            createDocument('project', 'Project') as any,
            createConfig() as any
        );

        expect(tasks).toHaveLength(1);
        expect(tasks[0]).toMatchObject({
            id: 'wrap-legacy-records',
            title: '조사 구역 정리',
            detail: '조사 구역 없이 떠 있는 기록 1개를 먼저 정리하세요.',
            action: { type: 'openMap' },
            actionLabel: '지도에서 정리'
        });
    });


    it('guides excavation feature records through photos, sectioning, soil photos, and drawings', () => {

        const operation = createDocument('operation-1', 'Operation', '조사구역 1');
        const feature = createDocument('feature-1', 'Feature', '유구 1', {
            liesWithin: ['operation-1']
        });
        const tasks = makeKoreanFieldworkPriorityTasks(
            [
                operation,
                feature,
                createDocument('daily-1', 'DailyLog', '오늘 일지'),
                createDocument('boundary-1', 'SurveyBoundary', 'A구역')
            ] as any,
            createDocument('project', 'Project', 'project', {}, {
                projectInvestigationMode: 'excavation'
            }) as any,
            createConfig() as any
        );

        expect(tasks.map(task => task.id)).toEqual([
            'create-pre-investigation-photo',
            'create-excavation-section',
            'create-excavation-profile-photo',
            'create-excavation-drawing'
        ]);
        expect(tasks[0].action).toEqual({
            type: 'createDocument',
            parentDocumentId: 'feature-1',
            categoryName: 'Photo'
        });
    });
});


const createDocument = (
        id: string,
        category: string,
        identifier: string = id,
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


const createConfig = () => ({
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
        if (relationName === 'isMapLayerOf') return false;
        if (['Photo', 'SoilProfilePhoto', 'Drawing'].includes(categoryName)) {
            return relationName === 'depicts';
        }
        if (['DailyLog', 'SurveyBoundary'].includes(categoryName)) {
            return relationName === 'isRecordedIn';
        }
        return relationName === 'liesWithin' || relationName === 'isRecordedIn';
    }
});
