import {
    makeKoreanFieldworkWorkflowSteps
} from '../../../src/app/util/korean-fieldwork-workflow';
import {
    makeKoreanFieldworkTodayStats
} from '../../../src/app/util/korean-fieldwork-today-stats';


describe('korean-fieldwork-workflow', () => {

    it('guides the user from project creation to survey boundary setup', () => {

        const projectDocument = createDocument('project', 'Project');
        const documents = [projectDocument] as any;
        const steps = makeKoreanFieldworkWorkflowSteps(
            documents,
            projectDocument as any,
            makeKoreanFieldworkTodayStats(documents)
        );

        expect(steps.map(step => [step.id, step.status])).toEqual([
            ['project', 'done'],
            ['mode', 'current'],
            ['boundary', 'todo'],
            ['operation', 'todo'],
            ['targets', 'todo'],
            ['recording', 'todo']
        ]);
        expect(steps[1].detail).toBe('시굴·발굴·지표·입회 중 이 프로젝트의 조사 방식을 정하세요.');
        expect(steps[2].detail).toBe('지도에서 조사 경계를 만들거나 SHP/DXF/CSV·위성지도 기준으로 구역을 기록하세요.');
        expect(steps[3].detail).toBe('지도에서 조사 경계를 만들면 그 구역 안에 트렌치·유구 기록을 이어서 넣을 수 있습니다.');
        expect(steps[0].action).toEqual({ type: 'openProjectInfo' });
        expect(steps[1].action).toEqual({ type: 'openProjectInfo' });
        expect(steps[2].action).toEqual({ type: 'openMap' });
        expect(steps[2].secondaryAction).toEqual({ type: 'openImport' });
        expect(steps[2].secondaryActionDetail).toBe(
            'SHP/DXF/CSV는 데스크톱 가져오기에서 불러온 뒤 동기화하면 태블릿 지도에서도 조사 경계로 보입니다.'
        );
        expect(steps[2].secondaryActionLabel).toBe('가져오기');
        expect(steps[3].action).toEqual({ type: 'openMap' });
    });


    it('asks for an operation before trench and feature creation', () => {

        const projectDocument = createDocument('project', 'Project', {
            projectBoundarySummary: 'A구역 북쪽 능선',
            projectInvestigationMode: 'trialTrench'
        });
        const documents = [
            projectDocument,
            createDocument('boundary-1', 'SurveyBoundary', {
                referenceBasemapProvider: 'kakaoHybrid',
                surveyBoundaryAccuracy: 'visualReference',
                surveyBoundarySource: 'manualBasemapTrace'
            })
        ] as any;
        const steps = makeKoreanFieldworkWorkflowSteps(
            documents,
            projectDocument as any,
            makeKoreanFieldworkTodayStats(documents)
        );

        expect(steps.map(step => [step.id, step.status])).toEqual([
            ['project', 'done'],
            ['mode', 'done'],
            ['boundary', 'done'],
            ['operation', 'current'],
            ['targets', 'todo'],
            ['recording', 'todo']
        ]);
        expect(steps[2].detail).toBe('A구역 북쪽 능선 · 카카오 위성지도 기준');
        expect(steps[3]).toEqual(expect.objectContaining({
            label: '조사 구역 기록',
            detail: '지도에서 조사 경계를 만들면 그 구역 안에 트렌치·유구 기록을 이어서 넣을 수 있습니다.',
            action: { type: 'openMap' },
            actionLabel: '지도'
        }));
        expect(steps[4]).toEqual(expect.objectContaining({
            label: '트렌치·유구',
            detail: '시굴은 먼저 트렌치를 잡고, 확인된 유구 후보를 그 안에 기록하세요.',
            action: { type: 'openMap' },
            actionLabel: '지도'
        }));
        expect(steps[1].detail).toBe('시굴·표본 작업 순서');
    });


    it('moves trial trench projects with an operation toward trench and feature creation', () => {

        const projectDocument = createDocument('project', 'Project', {
            projectBoundarySummary: 'A구역 북쪽 능선',
            projectInvestigationMode: 'trialTrench'
        });
        const documents = [
            projectDocument,
            createDocument('operation-1', 'Operation'),
            createDocument('boundary-1', 'SurveyBoundary')
        ] as any;
        const steps = makeKoreanFieldworkWorkflowSteps(
            documents,
            projectDocument as any,
            makeKoreanFieldworkTodayStats(documents)
        );

        expect(steps.map(step => [step.id, step.status])).toEqual([
            ['project', 'done'],
            ['mode', 'done'],
            ['boundary', 'done'],
            ['operation', 'done'],
            ['targets', 'current'],
            ['recording', 'todo']
        ]);
        expect(steps[4]).toEqual(expect.objectContaining({
            label: '트렌치·유구',
            detail: '시굴은 먼저 트렌치를 잡고, 확인된 유구 후보를 그 안에 기록하세요.',
            action: { type: 'openDocument', documentId: 'operation-1' },
            actionLabel: '열기'
        }));
        expect(steps[1].detail).toBe('시굴·표본 작업 순서');
    });


    it('keeps a boundary-summary-only project on the survey boundary confirmation step', () => {

        const projectDocument = createDocument('project', 'Project', {
            projectBoundarySummary: 'A구역 북쪽 능선',
            projectInvestigationMode: 'trialTrench'
        });
        const documents = [projectDocument] as any;
        const steps = makeKoreanFieldworkWorkflowSteps(
            documents,
            projectDocument as any,
            makeKoreanFieldworkTodayStats(documents)
        );

        expect(steps.map(step => [step.id, step.status])).toEqual([
            ['project', 'done'],
            ['mode', 'done'],
            ['boundary', 'attention'],
            ['operation', 'todo'],
            ['targets', 'todo'],
            ['recording', 'todo']
        ]);
        expect(steps[2]).toEqual(expect.objectContaining({
            label: '조사 구역',
            detail: 'A구역 북쪽 능선 기준만 있음. 지도에서 조사 경계를 만들거나 SHP/DXF/CSV·위성지도 기준으로 확정하세요.',
            action: { type: 'openMap' },
            actionLabel: '지도',
            secondaryAction: { type: 'openImport' },
            secondaryActionDetail: 'SHP/DXF/CSV는 데스크톱 가져오기에서 불러온 뒤 동기화하면 태블릿 지도에서도 조사 경계로 보입니다.',
            secondaryActionLabel: '가져오기'
        }));
        expect(steps[3]).toEqual(expect.objectContaining({
            label: '조사 구역 기록',
            detail: '지도에서 조사 경계를 만들면 그 구역 안에 트렌치·유구 기록을 이어서 넣을 수 있습니다.',
            action: { type: 'openMap' },
            actionLabel: '지도'
        }));
    });


    it('asks to confirm the survey boundary once an operation exists with only a boundary summary', () => {

        const projectDocument = createDocument('project', 'Project', {
            projectBoundarySummary: 'A구역 북쪽 능선',
            projectInvestigationMode: 'trialTrench'
        });
        const documents = [
            projectDocument,
            createDocument('operation-1', 'Operation')
        ] as any;
        const steps = makeKoreanFieldworkWorkflowSteps(
            documents,
            projectDocument as any,
            makeKoreanFieldworkTodayStats(documents)
        );

        expect(steps.map(step => [step.id, step.status])).toEqual([
            ['project', 'done'],
            ['mode', 'done'],
            ['boundary', 'attention'],
            ['operation', 'done'],
            ['targets', 'todo'],
            ['recording', 'todo']
        ]);
        expect(steps[2]).toEqual(expect.objectContaining({
            label: '조사 구역',
            detail: 'A구역 북쪽 능선 기준만 있음. 지도에서 GPS 임시 경계를 만들거나 SHP/DXF/CSV·위성지도 기준으로 확정하세요.',
            action: { type: 'openMap' },
            actionLabel: '지도',
            secondaryAction: { type: 'openImport' },
            secondaryActionDetail: 'SHP/DXF/CSV는 데스크톱 가져오기에서 불러온 뒤 동기화하면 태블릿 지도에서도 조사 경계로 보입니다.',
            secondaryActionLabel: '가져오기'
        }));
    });


    it('keeps existing root field records in an operation cleanup step', () => {

        const projectDocument = createDocument('project', 'Project', {
            projectBoundarySummary: 'A구역',
            projectInvestigationMode: 'excavation'
        });
        const documents = [
            projectDocument,
            createDocument('boundary-1', 'SurveyBoundary'),
            createDocument('feature-1', 'Feature')
        ] as any;
        const steps = makeKoreanFieldworkWorkflowSteps(
            documents,
            projectDocument as any,
            makeKoreanFieldworkTodayStats(documents)
        );

        expect(steps.map(step => [step.id, step.status])).toEqual([
            ['project', 'done'],
            ['mode', 'done'],
            ['boundary', 'done'],
            ['operation', 'attention'],
            ['targets', 'done'],
            ['recording', 'todo']
        ]);
        expect(steps[3]).toEqual(expect.objectContaining({
            label: '조사 구역 정리',
            detail: '조사 구역 없이 떠 있는 기록 1건',
            action: { type: 'openMap' },
            actionLabel: '지도'
        }));
    });


    it('marks closeout attention when field records exist but open issues remain', () => {

        const projectDocument = createDocument('project', 'Project', {
            projectBoundarySummary: 'B구역',
            projectInvestigationMode: 'excavation'
        });
        const documents = [
            projectDocument,
            createDocument('operation-1', 'Operation'),
            createDocument('boundary-1', 'SurveyBoundary'),
            createDocument('feature-1', 'Feature', {
                relations: { liesWithin: ['operation-1'] },
                featureRecordingStatus: 'confirmed',
                featureInvestigationChecklist: []
            }),
            createDocument('daily-1', 'DailyLog')
        ] as any;
        const steps = makeKoreanFieldworkWorkflowSteps(
            documents,
            projectDocument as any,
            makeKoreanFieldworkTodayStats(documents)
        );

        expect(steps.map(step => [step.id, step.status])).toEqual([
            ['project', 'done'],
            ['mode', 'done'],
            ['boundary', 'done'],
            ['operation', 'done'],
            ['targets', 'done'],
            ['recording', 'attention']
        ]);
        expect(steps[5].detail).toBe('마감 전 확인 1건');
        expect(steps[5].action).toEqual({ type: 'openDocument', documentId: 'feature-1' });
        expect(steps[5].actionLabel).toBe('확인');
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
});
