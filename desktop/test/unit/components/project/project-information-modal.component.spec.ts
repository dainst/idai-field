jest.mock('src/app/electron/electron', () => ({
    electronFs: { promises: {} },
    electronIpc: undefined,
    electronPath: { sep: '/' },
    electronRemote: undefined
}), { virtual: true });

import {
    ProjectInformationModalComponent
} from '../../../../src/app/components/project/project-information-modal.component';
import {
    makeKoreanFieldworkDailyNotebookDigest
} from '../../../../src/app/util/korean-fieldwork-notebook-digest';


describe('ProjectInformationModalComponent', () => {

    it('updates Korean fieldwork setup on the project document', async () => {

        const projectDocument = createProjectDocument({
            projectInvestigationMode: 'trialTrench',
            projectBoundarySummary: '1구역 북쪽'
        });
        const datastore = {
            update: jest.fn(async document => document),
            find: jest.fn().mockResolvedValue({ documents: [projectDocument] })
        };
        const component = createComponent(datastore);

        component.projectDocument = projectDocument as any;
        component.koreanInvestigationMode = 'excavation';
        component.koreanBoundarySummary = '  2구역 남쪽 경계  ';

        await component.saveKoreanProjectSetup();

        const updatedProjectDocument = datastore.update.mock.calls[0][0];
        expect(updatedProjectDocument.resource).toEqual(expect.objectContaining({
            projectInvestigationMode: 'excavation',
            projectBoundarySetupState: 'draftBoundary',
            projectBoundarySummary: '2구역 남쪽 경계',
            shortDescription: '2구역 남쪽 경계'
        }));
        expect(component.projectDocument?.resource.projectInvestigationMode).toBe('excavation');
        expect((component.projectDocument?.resource as any).projectBoundarySummary).toBe('2구역 남쪽 경계');
        expect(component.koreanProjectSetupSaved).toBe(true);
        expect(component.getKoreanWorkflowSteps().map(step => [step.id, step.status])).toEqual([
            ['project', 'done'],
            ['mode', 'done'],
            ['boundary', 'attention'],
            ['operation', 'todo'],
            ['targets', 'todo'],
            ['recording', 'todo']
        ]);
    });


    it('allows Korean fieldwork setup edits when project fields exist but values are empty', () => {

        const component = createComponent({ update: jest.fn() });
        component.projectDocument = createProjectDocument({});
        component.koreanInvestigationMode = 'trialTrench';
        component.koreanBoundarySummary = '신규 조사 경계';

        expect(component.isKoreanFieldworkProject()).toBe(true);
        expect(component.canSaveKoreanProjectSetup()).toBe(true);
    });


    it('shows Korean fieldwork today stats for Korean projects', () => {

        const component = createComponent({ update: jest.fn() });
        component.projectDocument = createProjectDocument({
            projectInvestigationMode: 'excavation',
            projectBoundarySummary: '2구역'
        });
        component.koreanTodayStats = {
            dailyLogCount: 1,
            surveyBoundaryCount: 1,
            featureCandidateCount: 2,
            openIssueCount: 3,
            criticalIssueCount: 0,
            warningIssueCount: 2,
            infoIssueCount: 1,
            statusLabel: '보완 필요',
            statusTone: 'warning',
            priorityIssues: [
                {
                    documentId: 'feature-1',
                    identifier: 'feature-1',
                    category: 'Feature',
                    severity: 'warning',
                    message: '완료 사진 항목이 체크되지 않았습니다.',
                    recommendedAction: '현장 마감 전 완료 사진을 남겼는지 확인하세요.'
                }
            ]
        };

        expect(component.shouldShowKoreanTodayStats()).toBe(true);
        expect(component.getKoreanPriorityIssues().length).toBe(1);
    });


    it('shows Korean fieldwork workflow steps in the project information modal', () => {

        const component = createComponent({ update: jest.fn() });
        component.projectDocument = createProjectDocument({
            projectInvestigationMode: 'trialTrench',
            projectBoundarySummary: '1구역'
        });
        component.koreanTodayStats = {
            dailyLogCount: 0,
            surveyBoundaryCount: 1,
            featureCandidateCount: 0,
            openIssueCount: 0,
            criticalIssueCount: 0,
            warningIssueCount: 0,
            infoIssueCount: 0,
            statusLabel: '조사 진행',
            statusTone: 'info',
            priorityIssues: []
        };
        component.koreanWorkflowSteps = [
            {
                id: 'targets',
                label: '트렌치·유구',
                detail: '시굴은 먼저 트렌치를 잡고, 확인된 유구 후보를 그 안에 기록하세요.',
                status: 'current',
                action: { type: 'openMap' },
                actionLabel: '지도'
            }
        ];

        expect(component.hasKoreanWorkflowSteps()).toBe(true);
        expect(component.getKoreanWorkflowStepStatusLabel('current')).toBe('다음');
        expect(component.getKoreanWorkflowStepStatusLabel('attention')).toBe('확인');
        expect(component.getKoreanWorkflowSteps()[0].label).toBe('트렌치·유구');
        expect(component.canRunKoreanWorkflowStep(component.getKoreanWorkflowSteps()[0])).toBe(true);
    });

    it('runs Korean workflow actions from the project information modal', async () => {

        const feature = createProjectDocument({
            id: 'feature-1',
            identifier: 'F-1',
            category: 'Feature'
        });
        const datastore = {
            get: jest.fn().mockResolvedValue(feature),
            update: jest.fn()
        };
        const routing = { jumpToResource: jest.fn() };
        const activeModal = { close: jest.fn() };
        const router = { navigate: jest.fn().mockResolvedValue(true) };
        const viewFacade = {
            deselect: jest.fn().mockResolvedValue(undefined),
            setMode: jest.fn()
        };
        const component = createComponent(
            datastore,
            routing,
            activeModal,
            router,
            viewFacade
        );
        const boundaryStep = {
            id: 'boundary',
            label: '조사 구역',
            detail: '지도에서 경계를 그리거나 가져오세요.',
            status: 'current' as const,
            action: { type: 'openMap' as const },
            actionLabel: '지도',
            secondaryAction: { type: 'openImport' as const },
            secondaryActionLabel: '가져오기'
        };
        const targetStep = {
            id: 'targets',
            label: '유구 추가',
            detail: '기록 열기',
            status: 'done' as const,
            action: { type: 'openDocument' as const, documentId: 'feature-1' },
            actionLabel: '열기'
        };

        await component.runKoreanWorkflowStep(boundaryStep);
        await component.runKoreanWorkflowStepSecondaryAction(boundaryStep);
        await component.runKoreanWorkflowStep(targetStep);

        expect(viewFacade.deselect).toHaveBeenCalled();
        expect(viewFacade.setMode).toHaveBeenCalledWith('map');
        expect(router.navigate).toHaveBeenCalledWith(['import']);
        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(routing.jumpToResource).toHaveBeenCalledWith(feature);
        expect(activeModal.close).toHaveBeenCalledTimes(3);
    });


    it('opens Korean priority issue documents from the project summary', async () => {

        const issueDocument = createProjectDocument({
            identifier: 'feature-1',
            category: 'Feature'
        });
        const datastore = {
            get: jest.fn().mockResolvedValue(issueDocument),
            update: jest.fn()
        };
        const routing = {
            jumpToResource: jest.fn()
        };
        const activeModal = {
            close: jest.fn()
        };
        const component = createComponent(datastore, routing, activeModal);

        await component.openKoreanPriorityIssue({
            documentId: 'feature-1',
            identifier: 'feature-1',
            category: 'Feature',
            severity: 'warning',
            message: '완료 사진 항목이 체크되지 않았습니다.',
            recommendedAction: '현장 마감 전 완료 사진을 남겼는지 확인하세요.'
        });

        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(activeModal.close).toHaveBeenCalled();
        expect(routing.jumpToResource).toHaveBeenCalledWith(issueDocument);
    });


    it('shows Korean fieldwork notebook digest entries from tablet notes', () => {

        const feature = createProjectDocument({
            id: 'feature-1',
            identifier: 'F-1',
            category: 'Feature'
        });
        const memo = createProjectDocument({
            id: 'memo-1',
            identifier: 'M-1',
            category: 'PenMemo',
            date: '2026-06-24',
            penMemoReviewedTranscript: [
                '[관찰 내용] 북쪽 경계 확인.',
                '[다음 작업] 사진 보강.'
            ].join('\n'),
            relations: { depicts: ['feature-1'] }
        });
        const component = createComponent({ update: jest.fn() });
        component.projectDocument = createProjectDocument({
            projectInvestigationMode: 'excavation',
            projectBoundarySummary: '2구역'
        }) as any;
        component.koreanNotebookDigest = makeKoreanFieldworkDailyNotebookDigest(
            [feature, memo] as any,
            new Date('2026-06-24T12:00:00')
        );

        expect(component.shouldShowKoreanNotebookDigest()).toBe(true);
        expect(component.getKoreanNotebookEntryCount()).toBe(1);
        expect(component.getKoreanNotebookNextWorkCount()).toBe(1);
        expect(component.getKoreanNotebookEvidenceMissingCount()).toBe(1);
        expect(component.getKoreanNotebookNextWorkEntries()[0].targetLabel).toBe('F-1');
        expect(component.getKoreanNotebookVisibleEntries()[0].targetLabel).toBe('F-1');
    });


    it('filters Korean notebook digest entries like the tablet ledger', () => {

        const operation = createProjectDocument({
            id: 'operation-1',
            identifier: 'A구역',
            category: 'Operation'
        });
        const feature = createProjectDocument({
            id: 'feature-1',
            identifier: 'F-1',
            category: 'Feature'
        });
        const dailyLog = createProjectDocument({
            id: 'daily-log-1',
            identifier: '2026-06-24 일지',
            category: 'DailyLog',
            date: '2026-06-24',
            description: '09:30 A구역 - [다음 작업] 북쪽 트렌치 배수 상태 확인.',
            relations: { isRecordedIn: ['operation-1'] }
        });
        const memo = createProjectDocument({
            id: 'memo-1',
            identifier: 'M-1',
            category: 'PenMemo',
            date: '2026-06-24',
            penMemoReviewedTranscript: [
                '[관찰 내용] 북쪽 경계 확인.',
                '[다음 작업] 사진 보강.'
            ].join('\n'),
            relations: { depicts: ['feature-1'] }
        });
        const component = createComponent({ update: jest.fn() });
        component.projectDocument = createProjectDocument({
            projectInvestigationMode: 'excavation',
            projectBoundarySummary: '2구역'
        }) as any;
        component.koreanNotebookDigest = makeKoreanFieldworkDailyNotebookDigest(
            [operation, feature, dailyLog, memo] as any,
            new Date('2026-06-24T12:00:00')
        );

        expect(component.getKoreanNotebookFilterCount('recent')).toBe(2);
        expect(component.getKoreanNotebookVisibleEntries().map(entry => entry.id))
            .toEqual(['daily-log-1-0', 'memo-1']);

        component.setKoreanNotebookFilter('nextWork');
        expect(component.getKoreanNotebookVisibleEntries().map(entry => entry.id))
            .toEqual(['daily-log-1-0', 'memo-1']);
        expect(component.getKoreanNotebookEntryTone(component.getKoreanNotebookVisibleEntries()[1]))
            .toBe('warning');

        component.setKoreanNotebookFilter('needsEvidence');
        expect(component.getKoreanNotebookVisibleEntries().map(entry => entry.id))
            .toEqual(['memo-1']);
        expect(component.getKoreanNotebookEntryDetail(component.getKoreanNotebookVisibleEntries()[0]))
            .toBe('사진·도면·스케치·유물·시료 번호를 이어서 확인하세요.');
    });


    it('opens Korean notebook digest targets and daily logs', () => {

        const feature = createProjectDocument({
            id: 'feature-1',
            identifier: 'F-1',
            category: 'Feature'
        });
        const dailyLog = createProjectDocument({
            id: 'daily-log-1',
            identifier: '2026-06-24 일지',
            category: 'DailyLog',
            date: '2026-06-24',
            description: '09:30 F-1 - [다음 작업] 단면 정리.'
        });
        const memo = createProjectDocument({
            id: 'memo-1',
            identifier: 'M-1',
            category: 'PenMemo',
            date: '2026-06-24',
            penMemoReviewedTranscript: '[다음 작업] 사진 보강.',
            relations: { depicts: ['feature-1'] }
        });
        const routing = { jumpToResource: jest.fn() };
        const activeModal = { close: jest.fn() };
        const component = createComponent({ update: jest.fn() }, routing, activeModal);
        component.projectDocument = createProjectDocument({
            projectInvestigationMode: 'excavation',
            projectBoundarySummary: '2구역'
        }) as any;
        component.koreanNotebookDigest = makeKoreanFieldworkDailyNotebookDigest(
            [feature, dailyLog, memo] as any,
            new Date('2026-06-24T12:00:00')
        );

        component.openKoreanNotebookEntry(component.getKoreanNotebookNextWorkEntries()[0]);
        expect(activeModal.close).toHaveBeenCalled();
        expect(routing.jumpToResource).toHaveBeenCalledWith(feature);

        const memoEntry = component.getKoreanNotebookNextWorkEntries()
            .find(entry => entry.id === 'memo-1')!;
        expect(component.canOpenKoreanNotebookSource(memoEntry)).toBe(true);
        component.openKoreanNotebookSource(memoEntry);
        expect(routing.jumpToResource).toHaveBeenLastCalledWith(memo);

        component.openKoreanDailyLog();
        expect(routing.jumpToResource).toHaveBeenLastCalledWith(dailyLog);
    });
});


const createComponent = (
    datastore: any,
    routing: any = {},
    activeModal: any = { close: jest.fn() },
    router: any = { navigate: jest.fn() },
    viewFacade: any = { deselect: jest.fn(), setMode: jest.fn() }
) => new ProjectInformationModalComponent(
    activeModal as any,
    {} as any,
    datastore,
    {} as any,
    { getSettings: () => ({ selectedProject: 'fieldwork-1' }) } as any,
    createProjectConfiguration() as any,
    { add: jest.fn() } as any,
    { isLoading: () => false } as any,
    routing as any,
    router as any,
    viewFacade as any,
    {} as any,
    { getContext: () => '' } as any
);


const createProjectConfiguration = () => ({
    getCategory: (categoryName: string) => categoryName === 'Project'
        ? {
            groups: [
                {
                    name: 'stem',
                    fields: [
                        { name: 'projectInvestigationMode' },
                        { name: 'projectBoundarySummary' }
                    ]
                }
            ]
        }
        : undefined
});


const createProjectDocument = (fields: { [fieldName: string]: unknown }) => ({
    _id: 'project',
    resource: {
        id: 'project',
        category: 'Project',
        identifier: 'fieldwork-1',
        relations: {},
        ...fields
    },
    created: { user: 'tester', date: new Date() },
    modified: [{ user: 'tester', date: new Date() }]
});
