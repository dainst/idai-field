jest.mock('src/app/electron/electron', () => ({
    electronFs: { promises: {} },
    electronIpc: undefined,
    electronPath: { sep: '/' },
    electronRemote: undefined
}), { virtual: true });
jest.mock('../../../../src/app/services/menu-modal-launcher', () => ({
    MenuModalLauncher: jest.fn()
}));

import { Subject } from 'rxjs';
import {
    KoreanFieldworkPriorityStripComponent
} from '../../../../src/app/components/resources/korean-fieldwork-priority-strip.component';


describe('KoreanFieldworkPriorityStripComponent', () => {

    it('shows priority issues for Korean fieldwork projects', async () => {

        const component = createComponent({
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    createDocument('feature-1', 'Feature', {
                        featureRecordingStatus: 'confirmed',
                        featureInvestigationChecklist: []
                    })
                ]
            }),
            get: jest.fn()
        });

        await component.refresh();

        expect(component.shouldShow()).toBe(true);
        expect(component.hasPriorityIssues()).toBe(true);
        expect(component.getPriorityIssues()).toEqual([
            expect.objectContaining({
                documentId: 'feature-1',
                identifier: 'feature-1',
                severity: 'warning',
                recommendedAction: '현장 마감 전 완료 사진을 남겼는지 확인하세요.'
            })
        ]);
        expect(component.getSummaryLabel()).toBe('일지 0 · 경계 0 · 유구 후보 0 · 확인 1');
        expect(component.getIssueBreakdownLabel()).toBe('필수 0 · 보완 1 · 참고 0');
        expect(component.getStatusLabel()).toBe('보완 필요');
        expect(component.getStatusTone()).toBe('warning');
        expect(component.getScopeSummary()).toMatchObject({
            title: '조사 방식 미정',
            structureCount: 1,
            issueCount: 1,
            actionLabel: '프로젝트 정보'
        });
        expect(component.getScopeMetricLabel()).toBe('현장 기록 1 · 자료 0 · 일지·점검 0 · 확인 1');
        expect(component.getCloseoutSummary()).toMatchObject({
            status: 'needsReview',
            title: '마감 전 확인',
            counts: { critical: 0, warning: 1, info: 0 }
        });
        expect(component.getCloseoutCountsLabel()).toBe('필수 0 · 보완 1 · 참고 0');
        expect(component.getCloseoutIssues()[0]).toMatchObject({
            documentId: 'feature-1',
            ruleId: 'feature-complete-photo'
        });
        expect(component.hasCloseoutBatchUpdates()).toBe(true);
        expect(component.getCloseoutBatchUpdateCount()).toBe(1);
        expect(component.getCloseoutBatchDocumentCount()).toBe(1);
        expect(component.getWorkflowSteps().map(step => [step.id, step.status])).toEqual([
            ['project', 'done'],
            ['mode', 'current'],
            ['boundary', 'todo'],
            ['operation', 'todo'],
            ['targets', 'done'],
            ['recording', 'todo']
        ]);
        expect(component.getWorkflowSteps()[1].actionLabel).toBe('선택');
        expect(component.getWorkflowSteps()[2].actionLabel).toBe('지도');
        expect(component.getWorkflowSteps()[2].secondaryActionLabel).toBe('가져오기');
        expect(component.getWorkflowSteps()[3].actionLabel).toBe('지도');
        expect(component.hasProgressItems()).toBe(true);
        expect(component.getProgressItems()[0]).toMatchObject({
            documentId: 'feature-1',
            stage: '보완',
            tone: 'warning'
        });
        expect(component.hasUnitMatrixItems()).toBe(true);
        expect(component.getUnitMatrixItems()[0]).toMatchObject({
            documentId: 'feature-1',
            categoryLabel: '유구',
            issueCount: 1,
            tone: 'warning'
        });
        expect(component.hasFeatureOverviewItems()).toBe(true);
        expect(component.getFeatureOverviewItems()[0]).toMatchObject({
            documentId: 'feature-1',
            statusLabel: '보완 필요',
            evidenceLabel: '없음',
            nextActionLabel: '보완 항목 확인'
        });
        expect(component.hasWorkbenchItems()).toBe(true);
        expect(component.getWorkbenchItems()[0]).toMatchObject({
            documentId: 'feature-1',
            categoryLabel: '유구',
            tone: 'warning'
        });
        expect(component.getWorkbenchItems()[0].reasons).toContain('확인 1');
        expect(component.hasRecordWorkFilterCounts()).toBe(true);
        expect(component.getRecordWorkFilters().map(filter => [
            filter.label,
            component.getRecordWorkFilterCount(filter)
        ])).toEqual([
            ['전체', 1],
            ['확인 필요', 1],
            ['조사 중', 0],
            ['자료 보강', 1],
            ['오늘 작성', 0]
        ]);
    });


    it('shows project status even when there are no priority issues', async () => {

        const component = createComponent({
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    createDocument('feature-candidate-1', 'Feature', {
                        featureRecordingStatus: 'candidate'
                    })
                ]
            }),
            get: jest.fn()
        });

        await component.refresh();

        expect(component.shouldShow()).toBe(true);
        expect(component.hasPriorityIssues()).toBe(false);
        expect(component.getPriorityIssues()).toEqual([]);
        expect(component.getSummaryLabel()).toBe('일지 0 · 경계 0 · 유구 후보 1 · 확인 0');
        expect(component.getIssueBreakdownLabel()).toBe('우선 확인 없음');
        expect(component.getStatusLabel()).toBe('조사 진행');
        expect(component.getStatusTone()).toBe('info');
        expect(component.getCloseoutSummary()).toMatchObject({
            status: 'clear',
            title: '마감 가능'
        });
    });


    it('filters desktop record work panels by the selected work status', async () => {

        const component = createComponent({
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    createDocument('feature-review', 'Feature', {
                        featureRecordingStatus: 'confirmed',
                        featureInvestigationChecklist: []
                    }),
                    createDocument('feature-pending', 'Feature', {
                        featureRecordingStatus: 'candidate'
                    })
                ]
            }),
            get: jest.fn()
        });

        await component.refresh();
        component.setActivePanel('records');

        const pendingFilter = component.getRecordWorkFilters()
            .find(filter => filter.id === 'pending')!;
        component.setActiveRecordWorkFilter(pendingFilter);

        expect(component.isRecordWorkFilterActive(pendingFilter)).toBe(true);
        expect(component.getFilteredProgressItems().map(item => item.documentId))
            .toEqual(['feature-pending']);
        expect(component.getFilteredUnitMatrixItems().map(item => item.documentId))
            .toEqual(['feature-pending']);
        expect(component.getFilteredFeatureOverviewItems().map(item => item.documentId))
            .toEqual(['feature-pending']);
        expect(component.getFilteredWorkbenchItems().map(item => item.documentId))
            .toEqual(['feature-pending']);

        const reviewFilter = component.getRecordWorkFilters()
            .find(filter => filter.id === 'needsReview')!;
        component.setActiveRecordWorkFilter(reviewFilter);

        expect(component.getFilteredProgressItems().map(item => item.documentId))
            .toEqual(['feature-review']);
        expect(component.getFilteredUnitMatrixItems().map(item => item.documentId))
            .toEqual(['feature-review']);
        expect(component.getFilteredWorkbenchItems().map(item => item.documentId))
            .toEqual(['feature-review']);

        const todayFilter = component.getRecordWorkFilters()
            .find(filter => filter.id === 'today')!;
        component.setActiveRecordWorkFilter(todayFilter);

        expect(component.hasFilteredRecordWorkItems()).toBe(false);
        expect(component.getFilteredRecordWorkEmptyLabel())
            .toBe('오늘 작성 기록이 없습니다');
        expect(component.getFilteredRecordWorkEmptyState()).toEqual({
            title: '오늘 작성 기록이 없습니다',
            detail: '오늘 작성 필터만 비어 있습니다. 전체를 누르면 기존 기록을 다시 볼 수 있습니다.'
        });
    });


    it('shows the full fieldwork sequence when setup and records are in place', async () => {

        const component = createComponent({
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project', {
                        projectBoundarySummary: 'A구역',
                        projectInvestigationMode: 'excavation'
                    }),
                    createDocument('operation-1', 'Operation'),
                    createDocument('boundary-1', 'SurveyBoundary'),
                    createDocument('feature-1', 'Feature', {
                        relations: { liesWithin: ['operation-1'] },
                        featureRecordingStatus: 'confirmed',
                        featureInvestigationChecklist: ['completionPhotoTaken']
                    }),
                    createDocument('daily-1', 'DailyLog')
                ]
            }),
            get: jest.fn()
        });

        await component.refresh();

        expect(component.getWorkflowSteps().map(step => [step.label, step.status])).toEqual([
            ['프로젝트', 'done'],
            ['조사 선택', 'done'],
            ['조사 구역', 'done'],
            ['조사 구역 기록', 'done'],
            ['유구 추가', 'done'],
            ['야장·마감', 'done']
        ]);
        expect(component.getWorkflowStepStatusLabel('current')).toBe('다음');
        expect(component.getWorkflowStepStatusLabel('attention')).toBe('확인');
        expect(component.getScopeSummary()).toMatchObject({
            title: '조사 범위 준비',
            detail: '발굴조사 · A구역',
            structureCount: 2,
            reviewCount: 2,
            actionLabel: '지도'
        });
        expect(component.getScopeMetricLabel()).toBe('현장 기록 2 · 자료 0 · 일지·점검 2 · 확인 0');
    });


    it('keeps the desktop fieldwork header focused with selectable workflow panels', async () => {

        const component = createComponent({
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    createDocument('feature-1', 'Feature', {
                        featureRecordingStatus: 'confirmed',
                        featureInvestigationChecklist: []
                    }),
                    createDocument('memo-1', 'PenMemo', {
                        date: getTodayLabel(),
                        penMemoReviewedTranscript: '[다음 작업] 사진 보강.',
                        relations: { depicts: ['feature-1'] }
                    })
                ]
            }),
            get: jest.fn()
        });

        await component.refresh();

        expect(component.activePanel).toBe('workflow');
        expect(component.shouldShowPanelNavigation()).toBe(true);
        expect(component.getPanelOptions().map(panel => panel.label)).toEqual([
            '작업 순서',
            '오늘 할 일',
            '기록 작업',
            '야장',
            '마감'
        ]);
        expect(component.getPanelOptions().map(panel => panel.id)).toEqual([
            'workflow',
            'today',
            'records',
            'notebook',
            'closeout'
        ]);

        component.setActivePanel('records');

        expect(component.isPanelActive('records')).toBe(true);

        component.notebookDigest = undefined;
        component.setActivePanel('notebook');

        expect(component.isPanelActive('records')).toBe(true);
    });


    it('runs today quick actions from the desktop header', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const operation = createDocument('operation-1', 'Operation');
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project', {
                        projectBoundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지'
                    }),
                    operation
                ]
            }),
            get: jest.fn().mockResolvedValue(operation)
        };
        const doceditLauncher = {
            editDocument: jest.fn().mockResolvedValue(undefined)
        };
        const component = createComponent(
            datastore,
            createActionProjectConfiguration(),
            { jumpToResource: jest.fn() },
            { deselect: jest.fn(), setMode: jest.fn() },
            { openInformationModal: jest.fn() },
            { navigate: jest.fn() },
            doceditLauncher
        );

        await component.refresh();
        component.setActivePanel('today');

        const actions = component.getTodayQuickActions();
        expect(actions.map(action => action.label)).toEqual([
            '오늘 일지',
            '경계 만들기',
            '마감 점검'
        ]);

        await component.runTodayQuickAction(actions[0]);
        await component.runTodayQuickAction(actions[1]);
        await component.runTodayQuickAction(actions[2]);

        expect(doceditLauncher.editDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                resource: expect.objectContaining({
                    identifier: 'daily-log-1700000000000',
                    category: 'DailyLog',
                    relations: { isRecordedIn: ['operation-1'] }
                })
            })
        );
        expect(doceditLauncher.editDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                resource: expect.objectContaining({
                    identifier: 'survey-boundary-1700000000000',
                    category: 'SurveyBoundary',
                    relations: { isRecordedIn: ['operation-1'] },
                    shortDescription: '1구역 북쪽 능선부터 남쪽 농로까지',
                    surveyBoundaryNote: '1구역 북쪽 능선부터 남쪽 농로까지'
                })
            })
        );
        expect(component.isPanelActive('closeout')).toBe(true);
        expect(component.hasPendingFeatureDraft()).toBe(false);

        jest.restoreAllMocks();
    });


    it('uses the desktop quick record button for the next record after the survey boundary exists', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const operation = createDocument('operation-1', 'Operation');
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    operation,
                    createDocument('boundary-1', 'SurveyBoundary', {
                        relations: { isRecordedIn: ['operation-1'] }
                    })
                ]
            }),
            get: jest.fn().mockResolvedValue(operation)
        };
        const component = createComponent(
            datastore,
            createActionProjectConfiguration(),
            { jumpToResource: jest.fn() },
            { deselect: jest.fn(), setMode: jest.fn() },
            { openInformationModal: jest.fn() },
            { navigate: jest.fn() },
            { editDocument: jest.fn() }
        );

        await component.refresh();
        component.setActivePanel('today');

        const actions = component.getTodayQuickActions();
        expect(actions.map(action => action.label)).toEqual([
            '오늘 일지',
            '유구 만들기',
            '마감 점검'
        ]);

        await component.runTodayQuickAction(actions[1]);

        component.setActivePanel('records');
        expect(component.hasPendingFeatureDraft()).toBe(true);
        expect(component.getPendingFeatureDraftParentLabel()).toBe('operation-1');

        jest.restoreAllMocks();
    });


    it('runs workflow actions from the sequence strip', async () => {

        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    createDocument('operation-1', 'Operation'),
                    createDocument('feature-1', 'Feature')
                ]
            }),
            get: jest.fn().mockResolvedValue(createDocument('feature-1', 'Feature'))
        };
        const routing = {
            jumpToResource: jest.fn()
        };
        const viewFacade = {
            deselect: jest.fn().mockResolvedValue(undefined),
            setMode: jest.fn()
        };
        const menuModalLauncher = {
            openInformationModal: jest.fn().mockResolvedValue(undefined)
        };
        const router = {
            navigate: jest.fn().mockResolvedValue(true)
        };
        const component = createComponent(
            datastore,
            createProjectConfiguration(),
            routing,
            viewFacade,
            menuModalLauncher,
            router
        );

        await component.refresh();

        const projectStep = component.getWorkflowSteps().find(step => step.id === 'project')!;
        const operationStep = component.getWorkflowSteps().find(step => step.id === 'operation')!;
        const boundaryStep = component.getWorkflowSteps().find(step => step.id === 'boundary')!;
        const targetStep = component.getWorkflowSteps().find(step => step.id === 'targets')!;

        expect(boundaryStep.secondaryActionDetail).toBe(
            'SHP/DXF/CSV는 데스크톱 가져오기에서 불러온 뒤 동기화하면 태블릿 지도에서도 조사 경계로 보입니다.'
        );

        await component.runWorkflowStep(projectStep);
        await component.runWorkflowStep(operationStep);
        await component.runWorkflowStep(boundaryStep);
        await component.runWorkflowStepSecondaryAction(boundaryStep);
        await component.runWorkflowStep(targetStep);

        expect(menuModalLauncher.openInformationModal).toHaveBeenCalled();
        expect(viewFacade.deselect).toHaveBeenCalled();
        expect(viewFacade.setMode).toHaveBeenCalledWith('map');
        expect(router.navigate).toHaveBeenCalledWith(['import']);
        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(routing.jumpToResource).toHaveBeenCalledWith(createDocument('feature-1', 'Feature'));
    });


    it('offers import as a secondary boundary setup action from priority tasks', async () => {

        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project')
                ]
            }),
            get: jest.fn()
        };
        const viewFacade = {
            deselect: jest.fn().mockResolvedValue(undefined),
            setMode: jest.fn()
        };
        const router = {
            navigate: jest.fn().mockResolvedValue(true)
        };
        const component = createComponent(
            datastore,
            createProjectConfiguration(),
            { jumpToResource: jest.fn() },
            viewFacade,
            { openInformationModal: jest.fn() },
            router
        );

        await component.refresh();

        const [task] = component.getPriorityTasks();
        expect(task).toMatchObject({
            id: 'start-operation',
            action: { type: 'openMap' },
            secondaryAction: { type: 'openImport' },
            secondaryActionDetail: 'SHP/DXF/CSV는 데스크톱 가져오기에서 불러온 뒤 동기화하면 태블릿 지도에서도 조사 경계로 보입니다.',
            secondaryActionLabel: '경계 가져오기'
        });
        expect(component.canRunPriorityTaskSecondaryAction(task)).toBe(true);

        await component.runPriorityTask(task);
        await component.runPriorityTaskSecondaryAction(task);

        expect(viewFacade.deselect).toHaveBeenCalled();
        expect(viewFacade.setMode).toHaveBeenCalledWith('map');
        expect(router.navigate).toHaveBeenCalledWith(['import']);
    });


    it('runs scope summary actions from the desktop header', async () => {

        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project', {
                        projectInvestigationMode: 'trialTrench'
                    }),
                    createDocument('operation-1', 'Operation')
                ]
            }),
            get: jest.fn()
        };
        const viewFacade = {
            deselect: jest.fn().mockResolvedValue(undefined),
            setMode: jest.fn()
        };
        const router = {
            navigate: jest.fn().mockResolvedValue(true)
        };
        const component = createComponent(
            datastore,
            createProjectConfiguration(),
            { jumpToResource: jest.fn() },
            viewFacade,
            { openInformationModal: jest.fn() },
            router
        );

        await component.refresh();
        const summary = component.getScopeSummary()!;

        expect(summary.title).toBe('조사 구역 필요');

        await component.runScopeSummaryAction(summary.action);
        await component.runScopeSummaryAction(summary.secondaryAction);

        expect(viewFacade.deselect).toHaveBeenCalled();
        expect(viewFacade.setMode).toHaveBeenCalledWith('map');
        expect(router.navigate).toHaveBeenCalledWith(['import']);
    });


    it('stays hidden outside Korean fieldwork projects', async () => {

        const component = createComponent(
            {
                find: jest.fn().mockResolvedValue({
                    documents: [
                        createDocument('project', 'Project'),
                        createDocument('feature-1', 'Feature', {
                            featureRecordingStatus: 'confirmed',
                            featureInvestigationChecklist: []
                        })
                    ]
                }),
                get: jest.fn()
            },
            createProjectConfiguration(false)
        );

        await component.refresh();

        expect(component.shouldShow()).toBe(false);
        expect(component.getPriorityIssues()).toEqual([]);
    });


    it('opens priority issue documents', async () => {

        const issueDocument = createDocument('feature-1', 'Feature');
        const datastore = {
            find: jest.fn(),
            get: jest.fn().mockResolvedValue(issueDocument)
        };
        const routing = {
            jumpToResource: jest.fn()
        };
        const component = createComponent(datastore, createProjectConfiguration(), routing);

        await component.openIssue({
            documentId: 'feature-1',
            identifier: 'feature-1',
            category: 'Feature',
            severity: 'warning',
            message: '완료 사진 항목이 체크되지 않았습니다.',
            recommendedAction: '현장 마감 전 완료 사진을 남겼는지 확인하세요.'
        });

        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(routing.jumpToResource).toHaveBeenCalledWith(issueDocument);
    });


    it('opens closeout issue documents', async () => {

        const issueDocument = createDocument('feature-1', 'Feature');
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    createDocument('feature-1', 'Feature', {
                        featureRecordingStatus: 'confirmed',
                        featureInvestigationChecklist: []
                    })
                ]
            }),
            get: jest.fn().mockResolvedValue(issueDocument)
        };
        const routing = {
            jumpToResource: jest.fn()
        };
        const component = createComponent(datastore, createProjectConfiguration(), routing);

        await component.refresh();
        await component.openCloseoutIssue(component.getCloseoutIssues()[0]);

        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(routing.jumpToResource).toHaveBeenCalledWith(issueDocument);
    });


    it('batch-applies safe closeout updates from the desktop header', async () => {

        let documents = [
            createDocument('project', 'Project'),
            createDocument('feature-1', 'Feature', {
                featureRecordingStatus: 'confirmed',
                featureInvestigationChecklist: []
            })
        ];
        const datastore = {
            find: jest.fn().mockImplementation(() => Promise.resolve({ documents })),
            get: jest.fn(),
            bulkUpdate: jest.fn().mockImplementation(async (updatedDocuments: any[]) => {
                documents = documents.map(document =>
                    updatedDocuments.find(updated =>
                        updated.resource.id === document.resource.id
                    ) ?? document
                );
                return updatedDocuments;
            })
        };
        const component = createComponent(datastore);

        await component.refresh();
        expect(component.hasCloseoutBatchUpdates()).toBe(true);

        await component.resolveCloseoutBatchUpdates();

        expect(datastore.bulkUpdate).toHaveBeenCalledWith([
            expect.objectContaining({
                resource: expect.objectContaining({
                    id: 'feature-1',
                    featureInvestigationChecklist: ['completionPhotoTaken']
                })
            })
        ]);
        expect(component.hasCloseoutBatchUpdates()).toBe(false);
        expect(component.getCloseoutSummary()).toMatchObject({
            status: 'clear',
            title: '마감 가능'
        });
    });


    it('shows today notebook follow-ups from tablet field notes', async () => {

        const component = createComponent({
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    createDocument('feature-1', 'Feature'),
                    createDocument('memo-1', 'PenMemo', {
                        date: getTodayLabel(),
                        penMemoReviewedTranscript: [
                            '[관찰 내용] 북쪽 경계에서 소토 확인.',
                            '[다음 작업] 사진 보강 후 단면 정리.'
                        ].join('\n'),
                        relations: { depicts: ['feature-1'] }
                    }),
                    createDocument('memo-2', 'PenMemo', {
                        date: getTodayLabel(),
                        penMemoReviewedTranscript: [
                            '[관찰 내용] 바닥면 정리 완료.'
                        ].join('\n'),
                        relations: { depicts: ['feature-1'] }
                    })
                ]
            }),
            get: jest.fn()
        });

        await component.refresh();

        expect(component.hasNotebookDigest()).toBe(true);
        expect(component.hasNotebookFollowUps()).toBe(true);
        expect(component.hasNotebookRecentEntries()).toBe(true);
        expect(component.getNotebookSummaryLabel()).toBe('기록 2 · 다음 1 · 번호 1');
        expect(component.getNotebookNextWorkEntries()[0].targetLabel).toBe('feature-1');
        expect(component.getNotebookEvidenceMissingEntries()[0].sourceLabel).toBe('메모');
        expect(component.getNotebookRecentEntries()).toHaveLength(1);
        expect(component.getNotebookRecentEntries()[0]).toMatchObject({
            targetLabel: 'feature-1',
            detail: '바닥면 정리 완료.'
        });
    });

    it('shows selected record notebook history in the desktop notebook panel', async () => {

        const feature = createDocument('feature-1', 'Feature');
        const memo = createDocument('memo-1', 'PenMemo', {
            date: getTodayLabel(),
            penMemoReviewedTranscript: [
                '[관찰 내용] 바닥면 정리 완료.',
                '[다음 작업] 단면 사진 보강.'
            ].join('\n'),
            relations: { depicts: ['feature-1'] }
        });
        const routing = {
            jumpToResource: jest.fn()
        };
        const component = createComponent(
            {
                find: jest.fn().mockResolvedValue({
                    documents: [
                        createDocument('project', 'Project'),
                        feature,
                        memo
                    ]
                }),
                get: jest.fn()
            },
            createActionProjectConfiguration(),
            routing,
            {
                deselect: jest.fn(),
                setMode: jest.fn(),
                getSelectedDocument: jest.fn().mockReturnValue(feature)
            }
        );

        await component.refresh();

        expect(component.hasNotebookPanel()).toBe(true);
        expect(component.hasNotebookSelectedRecordEntries()).toBe(true);
        expect(component.getNotebookSummaryLabel()).toContain('선택 1');
        expect(component.getNotebookSelectedRecordLabel()).toBe('feature-1');
        expect(component.getNotebookSelectedRecordEntries()[0]).toMatchObject({
            sourceLabel: '메모',
            detail: '바닥면 정리 완료.',
            nextWork: '단면 사진 보강.'
        });

        await component.openNotebookEntrySource(component.getNotebookSelectedRecordEntries()[0]);

        expect(routing.jumpToResource).toHaveBeenCalledWith(memo);
    });


    it('keeps the notebook panel available to create today daily logs', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const operation = createDocument('operation-1', 'Operation');
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    operation
                ]
            }),
            get: jest.fn().mockResolvedValue(operation)
        };
        const doceditLauncher = {
            editDocument: jest.fn().mockResolvedValue(undefined)
        };
        const component = createComponent(
            datastore,
            createActionProjectConfiguration(),
            { jumpToResource: jest.fn() },
            { deselect: jest.fn(), setMode: jest.fn() },
            { openInformationModal: jest.fn() },
            { navigate: jest.fn() },
            doceditLauncher
        );

        await component.refresh();

        expect(component.getPanelOptions().map(panel => panel.id)).toContain('notebook');
        expect(component.hasNotebookPanel()).toBe(true);
        expect(component.hasNotebookDigest()).toBe(false);
        expect(component.getNotebookDailyLogActionLabel()).toBe('오늘 작업일지 만들기');

        await component.runNotebookDailyLogAction();

        expect(datastore.get).toHaveBeenCalledWith('operation-1');
        expect(doceditLauncher.editDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                resource: expect.objectContaining({
                    identifier: 'daily-log-1700000000000',
                    category: 'DailyLog',
                    relations: { isRecordedIn: ['operation-1'] }
                })
            })
        );

        jest.restoreAllMocks();
    });


    it('opens today daily log from the notebook panel when it already exists', async () => {

        const dailyLog = createDocument('daily-1', 'DailyLog', {
            date: getTodayLabel(),
            relations: { isRecordedIn: ['operation-1'] }
        });
        const routing = {
            jumpToResource: jest.fn()
        };
        const component = createComponent(
            {
                find: jest.fn().mockResolvedValue({
                    documents: [
                        createDocument('project', 'Project'),
                        createDocument('operation-1', 'Operation'),
                        dailyLog
                    ]
                }),
                get: jest.fn()
            },
            createActionProjectConfiguration(),
            routing
        );

        await component.refresh();

        expect(component.hasNotebookPanel()).toBe(true);
        expect(component.getNotebookDailyLogActionLabel()).toBe('오늘 작업일지 열기');

        await component.runNotebookDailyLogAction();

        expect(routing.jumpToResource).toHaveBeenCalledWith(dailyLog);
    });

    it('runs selected record workbench commands from the records panel', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const feature = createDocument('feature-1', 'Feature');
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    feature
                ]
            }),
            get: jest.fn().mockResolvedValue(feature)
        };
        const routing = {
            jumpToResource: jest.fn()
        };
        const viewFacade = {
            deselect: jest.fn().mockResolvedValue(undefined),
            setMode: jest.fn(),
            getSelectedDocument: jest.fn().mockReturnValue(feature)
        };
        const doceditLauncher = {
            editDocument: jest.fn().mockResolvedValue(undefined)
        };
        const component = createComponent(
            datastore,
            createActionProjectConfiguration(),
            routing,
            viewFacade,
            { openInformationModal: jest.fn() },
            { navigate: jest.fn() },
            doceditLauncher
        );

        await component.refresh();

        expect(component.getPanelOptions().map(panel => panel.id)).toContain('records');
        expect(component.hasSelectedRecordWorkbench()).toBe(true);
        expect(component.getSelectedRecordWorkbenchCategoryLabel()).toBe('유구');
        expect(component.getSelectedRecordWorkbenchLabel()).toBe('feature-1');

        await component.openSelectedRecordWorkbenchOnMap();
        await component.openSelectedRecordWorkbenchDocument();
        await component.clearSelectedRecordWorkbench();

        expect(viewFacade.setMode).toHaveBeenCalledWith('map');
        expect(routing.jumpToResource).toHaveBeenCalledWith(feature);
        expect(viewFacade.deselect).toHaveBeenCalled();

        const createAction = component.getSelectedRecordWorkbenchActions()
            .find(action => action.type === 'createDocument' && !!action.categoryName);
        expect(createAction).toBeDefined();

        await component.runSelectedRecordWorkbenchAction(createAction!);

        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(doceditLauncher.editDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                resource: expect.objectContaining({
                    identifier: `${createAction!.categoryName!.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}-1700000000000`,
                    category: createAction!.categoryName
                })
            })
        );

        jest.restoreAllMocks();
    });

    it('shows connected record hierarchy lanes in the desktop records panel', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const operation = createDocument('operation-1', 'Operation');
        const trench = createDocument('trench-1', 'Trench', {
            relations: { liesWithin: ['operation-1'] }
        });
        const feature = createDocument('feature-1', 'Feature', {
            relations: { liesWithin: ['trench-1'] },
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: []
        });
        const layer = createDocument('layer-1', 'Layer', {
            relations: { liesWithin: ['feature-1'] }
        });
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    operation,
                    trench,
                    feature,
                    layer
                ]
            }),
            get: jest.fn().mockImplementation(async (documentId: string) =>
                [operation, trench, feature, layer].find(document =>
                    document.resource.id === documentId
                )
            )
        };
        const routing = { jumpToResource: jest.fn() };
        const doceditLauncher = { editDocument: jest.fn().mockResolvedValue(undefined) };
        const component = createComponent(
            datastore,
            createActionProjectConfiguration(),
            routing,
            {
                deselect: jest.fn(),
                setMode: jest.fn(),
                getSelectedDocument: jest.fn().mockReturnValue(feature)
            },
            { openInformationModal: jest.fn() },
            { navigate: jest.fn() },
            doceditLauncher
        );

        await component.refresh();
        component.setActivePanel('records');

        expect(component.hasHierarchyLanes()).toBe(true);
        expect(component.getHierarchyScopeLabel()).toBe('feature-1');
        expect(component.getHierarchyLanes().map(lane => [lane.label, lane.totalCount]))
            .toEqual([
                ['조사 구역 기록', 1],
                ['트렌치', 1],
                ['유구', 1],
                ['세부 단위', 0],
                ['토층', 1]
            ]);
        expect(component.getHierarchyLanes().find(lane => lane.categoryName === 'Feature')?.items[0])
            .toMatchObject({
                documentId: 'feature-1',
                isCurrentScope: true,
                parentIdentifier: 'trench-1',
                childCount: 1,
                issueCount: 1
            });

        const featureItem = component.getHierarchyLanes()
            .find(lane => lane.categoryName === 'Feature')!.items[0];
        await component.openHierarchyItem(featureItem);
        await component.createHierarchyItemChild(featureItem);

        expect(routing.jumpToResource).toHaveBeenCalledWith(feature);
        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(doceditLauncher.editDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                resource: expect.objectContaining({
                    identifier: 'feature-segment-1700000000000',
                    category: 'FeatureSegment',
                    relations: expect.objectContaining({
                        liesWithin: ['feature-1']
                    })
                })
            })
        );

        jest.restoreAllMocks();
    });

    it('revises selected record identifiers from the desktop records panel', async () => {

        let documents = [
            createDocument('project', 'Project'),
            createDocument('feature-1', 'Feature', {
                identifier: 'F-17',
                fieldIdentifier: 'F-17'
            })
        ];
        const datastore = {
            find: jest.fn().mockImplementation(() => Promise.resolve({ documents })),
            get: jest.fn(),
            bulkUpdate: jest.fn().mockImplementation(async (updatedDocuments: any[]) => {
                documents = documents.map(document =>
                    updatedDocuments.find(updated =>
                        updated.resource.id === document.resource.id
                    ) ?? document
                );
                return updatedDocuments;
            })
        };
        const viewFacade = {
            deselect: jest.fn(),
            setMode: jest.fn(),
            getSelectedDocument: jest.fn().mockReturnValue(documents[1])
        };
        const component = createComponent(
            datastore,
            createActionProjectConfiguration(),
            { jumpToResource: jest.fn() },
            viewFacade
        );

        await component.refresh();

        expect(component.hasSelectedRecordWorkbench()).toBe(true);
        expect(component.canReviseSelectedRecordIdentifier()).toBe(true);
        expect(component.getSelectedRecordFieldIdentifier()).toBe('F-17');
        expect(component.getSelectedRecordReportIdentifier()).toBe('F-17');
        expect(component.getSelectedRecordIdentifierRevisionHistoryLabel()).toBe('변경 이력 없음');
        expect(component.canApplySelectedRecordIdentifierRevision('F-17')).toBe(false);
        expect(component.canApplySelectedRecordIdentifierRevision('조선시대 1호 가마')).toBe(true);

        await component.applySelectedRecordIdentifierRevision(
            '조선시대 1호 가마',
            '현장번호 정리'
        );

        expect(datastore.bulkUpdate).toHaveBeenCalledWith([
            expect.objectContaining({
                resource: expect.objectContaining({
                    id: 'feature-1',
                    identifier: '조선시대 1호 가마',
                    fieldIdentifier: 'F-17',
                    reportIdentifier: '조선시대 1호 가마',
                    identifierRevisionNote: '현장번호 정리',
                    identifierRevisionHistory: [
                        expect.objectContaining({
                            previousIdentifier: 'F-17',
                            nextIdentifier: '조선시대 1호 가마',
                            fieldIdentifier: 'F-17',
                            reason: '현장번호 정리',
                            changedAt: expect.any(String)
                        })
                    ]
                })
            })
        ]);
        expect(component.getSelectedRecordWorkbenchLabel()).toBe('조선시대 1호 가마');
        expect(component.getSelectedRecordIdentifierRevisionHistoryLabel())
            .toBe('이력 1 · 최근 F-17에서 조선시대 1호 가마');
    });


    it('creates selected record pen memo drafts from the notebook panel', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const feature = createDocument('feature-1', 'Feature');
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    feature
                ]
            }),
            get: jest.fn().mockResolvedValue(feature)
        };
        const viewFacade = {
            deselect: jest.fn(),
            setMode: jest.fn(),
            getSelectedDocument: jest.fn().mockReturnValue(feature)
        };
        const doceditLauncher = {
            editDocument: jest.fn().mockResolvedValue(undefined)
        };
        const component = createComponent(
            datastore,
            createActionProjectConfiguration(),
            { jumpToResource: jest.fn() },
            viewFacade,
            { openInformationModal: jest.fn() },
            { navigate: jest.fn() },
            doceditLauncher
        );

        await component.refresh();

        expect(component.getPanelOptions().map(panel => panel.id)).toContain('notebook');
        expect(component.hasNotebookPanel()).toBe(true);
        expect(component.canRunNotebookRecordMemoAction()).toBe(true);
        expect(component.getNotebookRecordMemoActionLabel()).toBe('선택 기록 메모');
        expect(component.getNotebookRecordMemoActionDetail()).toContain('feature-1');

        await component.runNotebookRecordMemoAction();

        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(doceditLauncher.editDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                resource: expect.objectContaining({
                    identifier: 'pen-memo-1700000000000',
                    category: 'PenMemo',
                    shortDescription: 'feature-1 현장 메모',
                    description: '[관찰 내용]\n\n[스케치·약측/근거 번호]\n\n[다음 작업]',
                    penMemoStrokes: '[]',
                    penMemoTranscriptionStatus: 'pending',
                    relations: { depicts: ['feature-1'] }
                })
            })
        );

        jest.restoreAllMocks();
    });


    it('does not offer selected record memos for project setup records', async () => {

        const project = createDocument('project', 'Project');
        const component = createComponent(
            {
                find: jest.fn().mockResolvedValue({
                    documents: [project]
                }),
                get: jest.fn()
            },
            createActionProjectConfiguration(),
            { jumpToResource: jest.fn() },
            {
                deselect: jest.fn(),
                setMode: jest.fn(),
                getSelectedDocument: jest.fn().mockReturnValue(project)
            }
        );

        await component.refresh();

        expect(component.canRunNotebookRecordMemoAction()).toBe(false);
        expect(component.hasNotebookPanel()).toBe(false);
        expect(component.getPanelOptions().map(panel => panel.id)).not.toContain('notebook');
    });


    it('opens progress board records', async () => {

        const progressDocument = createDocument('feature-1', 'Feature');
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    progressDocument
                ]
            }),
            get: jest.fn().mockResolvedValue(progressDocument)
        };
        const routing = {
            jumpToResource: jest.fn()
        };
        const component = createComponent(datastore, createProjectConfiguration(), routing);

        await component.refresh();
        await component.openProgressItem(component.getProgressItems()[0]);

        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(routing.jumpToResource).toHaveBeenCalledWith(progressDocument);
    });


    it('opens unit matrix records', async () => {

        const matrixDocument = createDocument('feature-1', 'Feature');
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    matrixDocument
                ]
            }),
            get: jest.fn().mockResolvedValue(matrixDocument)
        };
        const routing = {
            jumpToResource: jest.fn()
        };
        const component = createComponent(datastore, createProjectConfiguration(), routing);

        await component.refresh();
        await component.openUnitMatrixItem(component.getUnitMatrixItems()[0]);

        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(routing.jumpToResource).toHaveBeenCalledWith(matrixDocument);
    });


    it('creates unit matrix child drafts through the resource editor flow', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const feature = createDocument('feature-1', 'Feature', {
            featureRecordingStatus: 'candidate'
        });
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    feature
                ]
            }),
            get: jest.fn().mockResolvedValue(feature)
        };
        const doceditLauncher = {
            editDocument: jest.fn().mockResolvedValue(undefined)
        };
        const component = createComponent(
            datastore,
            createActionProjectConfiguration(),
            { jumpToResource: jest.fn() },
            { deselect: jest.fn(), setMode: jest.fn() },
            { openInformationModal: jest.fn() },
            { navigate: jest.fn() },
            doceditLauncher
        );

        await component.refresh();
        const item = component.getUnitMatrixItems()
            .find(entry => entry.documentId === 'feature-1')!;

        expect(item.nextChildCategoryName).toBe('FeatureSegment');

        await component.createUnitMatrixRecord(item, item.nextChildCategoryName!);

        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(doceditLauncher.editDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                resource: expect.objectContaining({
                    identifier: 'feature-segment-1700000000000',
                    category: 'FeatureSegment',
                    relations: { liesWithin: ['feature-1'] }
                })
            })
        );

        jest.restoreAllMocks();
    });


    it('asks for a feature type before opening dashboard Feature drafts', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const trench = createDocument('trench-1', 'Trench');
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    trench
                ]
            }),
            get: jest.fn().mockResolvedValue(trench)
        };
        const doceditLauncher = {
            editDocument: jest.fn().mockResolvedValue(undefined)
        };
        const component = createComponent(
            datastore,
            createActionProjectConfiguration(),
            { jumpToResource: jest.fn() },
            { deselect: jest.fn(), setMode: jest.fn() },
            { openInformationModal: jest.fn() },
            { navigate: jest.fn() },
            doceditLauncher
        );

        await component.refresh();
        const item = component.getUnitMatrixItems()
            .find(entry => entry.documentId === 'trench-1')!;

        expect(item.nextChildCategoryName).toBe('Feature');

        await component.createUnitMatrixRecord(item, item.nextChildCategoryName!);

        expect(doceditLauncher.editDocument).not.toHaveBeenCalled();
        expect(component.hasPendingFeatureDraft()).toBe(true);
        expect(component.getPendingFeatureDraftParentLabel()).toBe('trench-1');
        expect(component.getFeatureDraftPresetLabel(
            component.getFeatureDraftPresets().find(preset => preset.featureType === 'unknown')!
        )).toBe('유구로 만들기');

        const kilnPreset = component.getFeatureDraftPresets().find(preset =>
            preset.featureType === 'kiln'
        )!;

        await component.createPendingFeatureDraft(kilnPreset);

        expect(component.hasPendingFeatureDraft()).toBe(false);
        expect(datastore.get).toHaveBeenCalledWith('trench-1');
        expect(doceditLauncher.editDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                resource: expect.objectContaining({
                    identifier: '가마-1700000000000',
                    category: 'Feature',
                    relations: expect.objectContaining({ liesWithin: ['trench-1'] }),
                    featureType: 'kiln',
                    featureInterpretationType: ['kiln'],
                    featureRecordingStatus: 'candidate',
                    featureInvestigationChecklist: []
                })
            })
        );

        jest.restoreAllMocks();
    });


    it('opens desktop workbench records', async () => {

        const workbenchDocument = createDocument('feature-1', 'Feature');
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    createDocument('feature-1', 'Feature', {
                        featureRecordingStatus: 'candidate'
                    })
                ]
            }),
            get: jest.fn().mockResolvedValue(workbenchDocument)
        };
        const routing = {
            jumpToResource: jest.fn()
        };
        const component = createComponent(datastore, createProjectConfiguration(), routing);

        await component.refresh();
        await component.openWorkbenchItem(component.getWorkbenchItems()[0]);

        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(routing.jumpToResource).toHaveBeenCalledWith(workbenchDocument);
    });


    it('runs compact workbench actions through the resource editor flow', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const feature = createDocument('feature-1', 'Feature', {
            featureRecordingStatus: 'candidate'
        });
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    feature
                ]
            }),
            get: jest.fn().mockResolvedValue(feature)
        };
        const doceditLauncher = {
            editDocument: jest.fn().mockResolvedValue(undefined)
        };
        const component = createComponent(
            datastore,
            createActionProjectConfiguration(),
            { jumpToResource: jest.fn() },
            { deselect: jest.fn(), setMode: jest.fn() },
            { openInformationModal: jest.fn() },
            { navigate: jest.fn() },
            doceditLauncher
        );

        await component.refresh();
        const [item] = component.getWorkbenchItems();
        const createAction = component.getWorkbenchActions(item)
            .find(action => action.type === 'createDocument');

        expect(createAction).toMatchObject({
            label: '세부 단위 추가',
            categoryName: 'FeatureSegment'
        });

        await component.runWorkbenchAction(item, createAction!);

        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(doceditLauncher.editDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                resource: expect.objectContaining({
                    identifier: 'feature-segment-1700000000000',
                    category: 'FeatureSegment',
                    relations: { liesWithin: ['feature-1'] }
                })
            })
        );

        jest.restoreAllMocks();
    });


    it('creates desktop priority task drafts through the resource editor flow', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const operation = createDocument('operation-1', 'Operation');
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    operation
                ]
            }),
            get: jest.fn().mockResolvedValue(operation)
        };
        const doceditLauncher = {
            editDocument: jest.fn().mockResolvedValue(undefined)
        };
        const component = createComponent(
            datastore,
            createActionProjectConfiguration(),
            { jumpToResource: jest.fn() },
            { deselect: jest.fn(), setMode: jest.fn() },
            { openInformationModal: jest.fn() },
            { navigate: jest.fn() },
            doceditLauncher
        );

        await component.refresh();
        expect(component.hasPriorityTasks()).toBe(true);
        await component.runPriorityTask(component.getPriorityTasks()[0]);

        expect(datastore.get).toHaveBeenCalledWith('operation-1');
        expect(doceditLauncher.editDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                resource: expect.objectContaining({
                    identifier: 'daily-log-1700000000000',
                    category: 'DailyLog',
                    relations: { isRecordedIn: ['operation-1'] }
                })
            })
        );

        jest.restoreAllMocks();
    });


    it('opens notebook follow-up targets', async () => {

        const feature = createDocument('feature-1', 'Feature');
        const memo = createDocument('memo-1', 'PenMemo', {
            date: getTodayLabel(),
            penMemoReviewedTranscript: '[다음 작업] 사진 보강.',
            relations: { depicts: ['feature-1'] }
        });
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    feature,
                    memo
                ]
            }),
            get: jest.fn()
        };
        const routing = {
            jumpToResource: jest.fn()
        };
        const component = createComponent(datastore, createProjectConfiguration(), routing);

        await component.refresh();
        await component.openNotebookEntry(component.getNotebookNextWorkEntries()[0]);

        expect(routing.jumpToResource).toHaveBeenCalledWith(feature);
    });


    it('continues notebook entries as seeded PenMemo drafts', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const feature = createDocument('feature-1', 'Feature');
        const memo = createDocument('memo-1', 'PenMemo', {
            date: getTodayLabel(),
            penMemoReviewedTranscript: [
                '[관찰 내용] 바닥면 정리 중 원형 윤곽 확인.',
                '[다음 작업] 사진 보강.'
            ].join('\n'),
            relations: { depicts: ['feature-1'] }
        });
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    createDocument('project', 'Project'),
                    feature,
                    memo
                ]
            }),
            get: jest.fn().mockResolvedValue(feature)
        };
        const doceditLauncher = {
            editDocument: jest.fn().mockResolvedValue(undefined)
        };
        const component = createComponent(
            datastore,
            createActionProjectConfiguration(),
            { jumpToResource: jest.fn() },
            { deselect: jest.fn(), setMode: jest.fn() },
            { openInformationModal: jest.fn() },
            { navigate: jest.fn() },
            doceditLauncher
        );

        await component.refresh();

        const [entry] = component.getNotebookNextWorkEntries();
        expect(component.canContinueNotebookEntry(entry, 'nextWork')).toBe(true);
        expect(component.getNotebookContinuationActionLabel(entry, 'nextWork')).toBe('다음 이어쓰기');

        await component.continueNotebookEntry(entry, 'nextWork');

        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(doceditLauncher.editDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                resource: expect.objectContaining({
                    identifier: 'pen-memo-1700000000000',
                    category: 'PenMemo',
                    relations: { depicts: ['feature-1'] },
                    shortDescription: 'feature-1 메모 남은 작업',
                    description: '[관찰 내용] 바닥면 정리 중 원형 윤곽 확인.\n\n[스케치·약측/근거 번호]\n\n[다음 작업] 사진 보강.'
                })
            })
        );

        jest.restoreAllMocks();
    });
});


const createComponent = (
    datastore: any,
    projectConfiguration: any = createProjectConfiguration(),
    routing: any = { jumpToResource: jest.fn() },
    viewFacade: any = { deselect: jest.fn(), setMode: jest.fn() },
    menuModalLauncher: any = { openInformationModal: jest.fn() },
    router: any = { navigate: jest.fn() },
    doceditLauncher: any = undefined
) => new KoreanFieldworkPriorityStripComponent(
    datastore,
    { changesNotifications: () => new Subject().asObservable() } as any,
    projectConfiguration,
    routing,
    viewFacade,
    menuModalLauncher,
    router,
    { add: jest.fn() } as any,
    doceditLauncher
);


const createProjectConfiguration = (withKoreanFields: boolean = true) => ({
    getCategory: (categoryName: string) => {
        if (categoryName !== 'Project') return undefined;

        return {
            groups: [
                {
                    name: 'stem',
                    fields: withKoreanFields
                        ? [
                            { name: 'projectInvestigationMode' },
                            { name: 'projectBoundarySummary' }
                        ]
                        : []
                }
            ]
        };
    }
});


const createActionProjectConfiguration = () => ({
    getCategory: (categoryName: string) => ({
        name: categoryName,
        mustLieWithin: false,
        groups: [
            {
                name: 'stem',
                fields: getActionCategoryFields(categoryName)
            }
        ]
    }),
    isAllowedRelationDomainCategory: (
        categoryName: string,
        _parentCategoryName: string,
        relationName: string
    ) => {
        if (relationName === 'isMapLayerOf') return false;
        if (['Photo', 'SoilProfilePhoto', 'Drawing', 'PenMemo'].includes(categoryName)) {
            return relationName === 'depicts';
        }
        if (['DailyLog', 'SurveyBoundary'].includes(categoryName)) {
            return relationName === 'isRecordedIn';
        }
        if (['FeatureSegment', 'Layer'].includes(categoryName)) {
            return relationName === 'liesWithin';
        }
        return relationName === 'liesWithin' || relationName === 'isRecordedIn';
    }
});


const getActionCategoryFields = (categoryName: string) => {
    if (categoryName === 'Project') {
        return [
            { name: 'projectInvestigationMode' },
            { name: 'projectBoundarySummary' }
        ];
    }
    if (categoryName === 'PenMemo') {
        return [
            { name: 'shortDescription' },
            { name: 'description' },
            { name: 'penMemoStrokes' },
            { name: 'penMemoTranscriptionStatus' }
        ];
    }
    if (categoryName === 'Feature') {
        return [
            { name: 'featureType' },
            { name: 'featureInterpretationType' },
            {
                name: 'featureRecordingStatus',
                valuelist: { id: 'KoreanFieldwork-featureRecordingStatus' }
            },
            { name: 'featureInvestigationChecklist' }
        ];
    }
    if (categoryName === 'SurveyBoundary') {
        return [
            { name: 'shortDescription' },
            { name: 'surveyBoundaryNote' },
            {
                name: 'surveyBoundaryType',
                valuelist: { id: 'KoreanFieldwork-surveyBoundaryType' }
            }
        ];
    }
    return [];
};


const createDocument = (id: string, category: string, fields: any = {}) => ({
    resource: {
        id,
        identifier: id,
        category,
        relations: {},
        ...fields
    }
});


const getTodayLabel = () => {
    const today = new Date();

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');
};
