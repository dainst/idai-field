jest.mock('src/app/electron/electron', () => ({
    electronRemote: undefined
}), { virtual: true });

import {
    KoreanFieldworkRecordContextPanelComponent
} from '../../../../../src/app/components/docedit/core/korean-fieldwork-record-context-panel.component';
import * as fs from 'fs';
import * as path from 'path';


describe('KoreanFieldworkRecordContextPanelComponent', () => {

    it('summarizes the current record context, parents, children, links, and status chips', async () => {

        const operation = createDocument('operation-1', 'Operation', 'OP1');
        const trench = createDocument('trench-1', 'Trench', 'TR1', {
            liesWithin: ['operation-1']
        });
        const feature = createDocument('feature-1', 'Feature', 'F1', {
            liesWithin: ['trench-1']
        }, {
            featureType: 'kiln',
            featureRecordingStatus: 'confirmed',
            potteryKilnPartInvestigation: ['combustionPartRecorded', 'firingPartRecorded'],
            verificationState: 'observedInField',
            longAxisOrientation: 'N-23°-E',
            orientationReference: '자북'
        });
        const segment = createDocument('segment-1', 'FeatureSegment', 'F1-pit', {
            liesWithin: ['feature-1']
        });
        const layer = createDocument('layer-1', 'Layer', 'L1', {
            isRecordedInFeature: ['feature-1']
        });
        const photo = createDocument('photo-1', 'Photo', 'P1', {
            depicts: ['feature-1']
        });
        const soilProfilePhoto = createDocument('soil-photo-1', 'SoilProfilePhoto', 'SP1', {
            depicts: ['feature-1']
        }, {
            soilColorAssistStatus: 'candidatesAvailable',
            soilColorAssistCandidates: '1: 10YR 4/3 (높음, 차이 0.0)'
        });
        const memo = createDocument('memo-1', 'PenMemo', 'M1', {
            depicts: ['feature-1']
        }, {
            date: getTodayLabel(),
            penMemoReviewedTranscript: [
                '[관찰 내용] 북쪽 경계에서 소토 확인.',
                '[다음 작업] 사진 보강 후 단면 정리.'
            ].join('\n')
        });
        const component = createComponent({
            find: jest.fn().mockResolvedValue({
                documents: [operation, trench, feature, segment, layer, photo, soilProfilePhoto, memo]
            })
        });
        component.document = feature as any;
        component.fieldDefinitions = [
            field('featureRecordingStatus'),
            field('verificationState'),
            field('longAxisOrientation'),
            checkboxesField('potteryKilnPartInvestigation')
        ] as any;

        await component.ngOnChanges();

        expect(component.shouldShow()).toBe(true);
        expect(component.getCategoryLabel()).toBe('유구');
        expect(component.getCurrentIdentifier()).toBe('F1');
        expect(component.parentPathLabel).toBe('OP1 > TR1');
        expect(component.metrics).toEqual([
            { id: 'children', label: '이어진 기록', count: 2 },
            { id: 'linkedEvidence', label: '연결', count: 3 }
        ]);
        expect(component.getEvidenceMetrics()).toEqual(expect.arrayContaining([
            { id: 'featureSegments', label: '피트', count: 1, canCreate: false },
            { id: 'layers', label: '토색 메모', count: 1, canCreate: false },
            { id: 'photos', label: '사진', count: 1, canCreate: false },
            { id: 'soilProfilePhotos', label: '토층사진', count: 1, canCreate: false },
            { id: 'penMemos', label: '야장 메모', count: 1, canCreate: false }
        ]));
        expect(component.getEvidenceInsights()).toEqual([
            {
                id: 'soilColor:soil-photo-1',
                label: '토색 후보',
                detail: 'SP1 · 먼셀 후보 10YR 4/3',
                tone: 'info'
            }
        ]);
        expect(component.getStatusChips()).toEqual(expect.arrayContaining([
            { label: '장축 N-23°-E · 자북', tone: 'info' },
            { label: '완료', tone: 'success' },
            { label: '가마 핵심 연소부·소성부', tone: 'success' },
            { label: '현장 확인', tone: 'success' }
        ]));
        expect(component.hasNotebookEntries()).toBe(true);
        expect(component.getNotebookEntries()[0]).toMatchObject({
            sourceLabel: '메모',
            targetLabel: 'F1',
            nextWork: '사진 보강 후 단면 정리.'
        });
        expect(component.getNotebookEntryTone(component.getNotebookEntries()[0])).toBe('warning');
    });


    it('warns when a selected feature type has no core attributes recorded', async () => {

        const feature = createDocument('feature-1', 'Feature', 'F1', {}, {
            featureType: 'kiln',
            featureRecordingStatus: 'investigating'
        });
        const component = createComponent({
            find: jest.fn().mockResolvedValue({ documents: [feature] })
        });
        component.document = feature as any;
        component.fieldDefinitions = [
            field('featureRecordingStatus'),
            checkboxesField('potteryKilnPartInvestigation')
        ] as any;

        await component.ngOnChanges();

        expect(component.getStatusChips()).toEqual(expect.arrayContaining([
            { label: '조사 중', tone: 'info' },
            { label: '가마 핵심 속성 미기록', tone: 'warning' }
        ]));
    });


    it('renders parent scope with included-location wording', () => {

        const template = fs.readFileSync(
            path.resolve(
                __dirname,
                '../../../../../src/app/components/docedit/core/korean-fieldwork-record-context-panel.html'
            ),
            'utf8'
        );

        expect(template).toContain('포함 위치: {{parentPathLabel}}');
    });


    it('stays hidden outside Korean fieldwork contexts', async () => {

        const component = createComponent({
            find: jest.fn().mockResolvedValue({ documents: [] })
        });
        component.document = createDocument('type-1', 'Type', 'Type 1') as any;
        component.fieldDefinitions = [
            field('shortDescription')
        ] as any;

        await component.ngOnChanges();

        expect(component.shouldShow()).toBe(false);
        expect(component.parentPathLabel).toBeUndefined();
        expect(component.metrics).toEqual([]);
        expect(component.getEvidenceMetrics()).toEqual([]);
    });


    it('opens the source notebook record from the context panel', async () => {

        const routing = { jumpToResource: jest.fn() };
        const memo = createDocument('memo-1', 'PenMemo', 'M1', {}, {
            date: getTodayLabel(),
            penMemoReviewedTranscript: '[다음 작업] 사진 보강.'
        });
        const component = createComponent({
            find: jest.fn().mockResolvedValue({
                documents: [memo]
            })
        }, routing);
        component.document = memo as any;
        component.fieldDefinitions = [
            field('recordCreationTiming')
        ] as any;

        await component.ngOnChanges();
        await component.openNotebookEntry(component.getNotebookEntries()[0]);

        expect(routing.jumpToResource).toHaveBeenCalledWith(memo);
    });


    it('appends a related tablet field note to the current record narrative once', async () => {

        const feature = createDocument('feature-1', 'Feature', 'F1', {}, {
            description: '기존 기록.'
        });
        const memo = createDocument('memo-1', 'PenMemo', 'M1', {
            depicts: ['feature-1']
        }, {
            date: getTodayLabel(),
            penMemoReviewedTranscript: [
                '[관찰 내용] 북쪽 경계에서 소토 확인.',
                '[해석] 폐기층 가능성 있음.',
                '[다음 작업] 사진 보강 후 단면 정리.'
            ].join('\n')
        });
        const component = createComponent({
            find: jest.fn().mockResolvedValue({
                documents: [feature, memo]
            })
        });
        const handleChanged = jest.fn();
        component.onChanged.subscribe(handleChanged);
        component.document = feature as any;
        component.fieldDefinitions = [
            field('longAxisOrientation'),
            textField('description', '설명')
        ] as any;

        await component.ngOnChanges();
        expect(component.canApplyNotebookEntry(component.getNotebookEntries()[0])).toBe(true);
        expect(component.getNotebookEntryApplyTargetLabel(component.getNotebookEntries()[0])).toBe('설명');

        component.applyNotebookEntry(component.getNotebookEntries()[0]);
        component.applyNotebookEntry(component.getNotebookEntries()[0]);

        expect(feature.resource.description).toContain('기존 기록.');
        expect(feature.resource.description).toContain('[메모 ');
        expect(feature.resource.description).toContain('관찰: 북쪽 경계에서 소토 확인.');
        expect(feature.resource.description).toContain('해석: 폐기층 가능성 있음.');
        expect(feature.resource.description).toContain('다음 작업: 사진 보강 후 단면 정리.');
        expect(feature.resource.description.match(/\[메모/g)).toHaveLength(1);
        expect(handleChanged).toHaveBeenCalledTimes(1);
    });


    it('creates continuation records with inherited operation context', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const feature = createDocument('feature-1', 'Feature', 'F1', {
            isRecordedIn: ['operation-1']
        }, {
            featureRecordingStatus: 'investigating'
        });
        const savedSegment = createDocument('segment-1', 'FeatureSegment', 'feature-segment-1700000000000', {
            isRecordedIn: ['operation-1'],
            liesWithin: ['feature-1']
        }, {
            featureRecordingStatus: 'candidate',
            featureInvestigationChecklist: []
        });
        const modalRef = {
            componentInstance: {
                setDocument: jest.fn().mockResolvedValue(undefined)
            },
            result: Promise.resolve({ documents: [savedSegment] })
        };
        const modalService = { open: jest.fn().mockReturnValue(modalRef) };
        const datastore = {
            find: jest.fn().mockResolvedValue({ documents: [feature] })
        };
        const component = createComponent(
            datastore,
            { jumpToResource: jest.fn() },
            createProjectConfiguration({
                'FeatureSegment:Feature': ['liesWithin'],
                'Photo:Feature': ['depicts']
            }),
            modalService
        );
        const handleChanged = jest.fn();
        component.onChanged.subscribe(handleChanged);
        component.document = feature as any;
        component.fieldDefinitions = [
            field('featureRecordingStatus')
        ] as any;

        await component.ngOnChanges();

        expect(component.getContinuationActions().map(action => action.categoryName))
            .toEqual(['FeatureSegment', 'Photo']);
        expect(component.getEvidenceMetrics()).toEqual(expect.arrayContaining([
            { id: 'featureSegments', label: '피트', count: 0, canCreate: true },
            { id: 'photos', label: '사진', count: 0, canCreate: true }
        ]));
        expect(component.getContinuationActionLabel(component.getContinuationActions()[0]))
            .toBe('세부유구');
        expect(component.getContinuationActionDetail(component.getContinuationActions()[0]))
            .toBe('포함 위치: 현재 기록');
        expect(component.getRecordActions().some(action =>
            action.type === 'createDocument' && action.categoryName === 'FeatureSegment'
        )).toBe(true);

        await component.runRecordAction(component.getRecordActions().find(action =>
            action.type === 'createDocument' && action.categoryName === 'FeatureSegment'
        )!);

        expect(modalService.open).toHaveBeenCalled();
        expect(modalRef.componentInstance.setDocument).toHaveBeenCalledWith(expect.objectContaining({
            resource: expect.objectContaining({
                identifier: 'feature-segment-1700000000000',
                category: 'FeatureSegment',
                relations: {
                    isRecordedIn: ['operation-1'],
                    liesWithin: ['feature-1']
                },
                featureRecordingStatus: 'candidate',
                featureInvestigationChecklist: []
            })
        }));
        expect(handleChanged).toHaveBeenCalledTimes(1);
        expect(component.metrics).toEqual(expect.arrayContaining([
            { id: 'children', label: '이어진 기록', count: 1 }
        ]));

        jest.restoreAllMocks();
    });


    it('creates typed feature continuation drafts from the desktop context flow', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const trench = createDocument('trench-1', 'Trench', 'T1');
        const savedFeature = createDocument('feature-1', 'Feature', '가마-1700000000000', {
            liesWithin: ['trench-1']
        }, {
            featureType: 'kiln',
            featureInterpretationType: ['kiln'],
            featureRecordingStatus: 'candidate',
            featureInvestigationChecklist: []
        });
        const modalRef = {
            componentInstance: {
                setDocument: jest.fn().mockResolvedValue(undefined)
            },
            result: Promise.resolve({ documents: [savedFeature] })
        };
        const modalService = { open: jest.fn().mockReturnValue(modalRef) };
        const component = createComponent(
            { find: jest.fn().mockResolvedValue({ documents: [trench] }) },
            { jumpToResource: jest.fn() },
            createProjectConfiguration({
                'Feature:Trench': ['liesWithin']
            }),
            modalService
        );
        const handleChanged = jest.fn();
        component.onChanged.subscribe(handleChanged);
        component.document = trench as any;
        component.fieldDefinitions = [
            field('recordCreationTiming')
        ] as any;

        await component.ngOnChanges();

        const featureAction = component.getContinuationActions().find(action =>
            action.categoryName === 'Feature'
        )!;
        const kilnPreset = component.getFeatureContinuationPresets().find(preset =>
            preset.featureType === 'kiln'
        )!;

        expect(component.isFeatureContinuationAction(featureAction)).toBe(true);
        expect(component.getFeatureContinuationPresetLabel(
            component.getFeatureContinuationPresets().find(preset => preset.featureType === 'unknown')!
        )).toBe('유구로 만들기');
        expect(component.getFeatureContinuationPresetLabel(kilnPreset)).toBe('가마');
        expect(component.getFeatureContinuationDetail(featureAction))
            .toBe('포함 위치: 현재 기록 · 성격을 고른 뒤 시작');

        await component.createFeatureContinuationRecord(featureAction, kilnPreset);

        expect(modalService.open).toHaveBeenCalled();
        expect(modalRef.componentInstance.setDocument).toHaveBeenCalledWith(expect.objectContaining({
            resource: expect.objectContaining({
                identifier: '가마-1700000000000',
                category: 'Feature',
                relations: {
                    liesWithin: ['trench-1']
                },
                featureType: 'kiln',
                featureInterpretationType: ['kiln'],
                featureRecordingStatus: 'candidate',
                featureInvestigationChecklist: []
            })
        }));
        expect(handleChanged).toHaveBeenCalledTimes(1);

        jest.restoreAllMocks();
    });


    it('opens records from prioritized fieldwork actions', async () => {

        const feature = createDocument('feature-1', 'Feature', 'F1', {}, {
            featureRecordingStatus: 'investigating'
        });
        const photo = createDocument('photo-1', 'Photo', 'P1', {
            depicts: ['feature-1']
        });
        const routing = { jumpToResource: jest.fn() };
        const datastore = {
            find: jest.fn().mockResolvedValue({ documents: [feature, photo] }),
            get: jest.fn().mockResolvedValue(photo)
        };
        const component = createComponent(datastore, routing);
        component.document = feature as any;
        component.fieldDefinitions = [
            field('featureRecordingStatus')
        ] as any;

        await component.runRecordAction({
            id: 'open-photo',
            type: 'openDocument',
            label: '사진 열기',
            detail: '연결된 사진 확인',
            icon: 'mdi-camera-outline',
            tone: 'info',
            documentId: 'photo-1'
        });

        expect(datastore.get).toHaveBeenCalledWith('photo-1');
        expect(routing.jumpToResource).toHaveBeenCalledWith(photo);
    });


    it('shows tablet handwriting transcription backlog as an openable record action', async () => {

        const feature = createDocument('feature-1', 'Feature', 'F1', {}, {
            featureRecordingStatus: 'investigating'
        });
        const memo = createDocument('memo-1', 'PenMemo', 'M1', {
            depicts: ['feature-1']
        }, {
            penMemoStrokes: '{"version":1,"strokes":[{"points":[{"x":10,"y":20}]}]}',
            penMemoTranscriptionStatus: 'pending'
        });
        const routing = { jumpToResource: jest.fn() };
        const datastore = {
            find: jest.fn().mockResolvedValue({ documents: [feature, memo] }),
            get: jest.fn().mockResolvedValue(memo)
        };
        const component = createComponent(datastore, routing);
        component.document = feature as any;
        component.fieldDefinitions = [
            field('featureRecordingStatus')
        ] as any;

        await component.ngOnChanges();

        expect(component.getEvidenceMetrics()).toEqual(expect.arrayContaining([
            { id: 'penMemos', label: '야장 메모', count: 1, canCreate: false },
            { id: 'penMemoSketches', label: '스케치 메모', count: 1, canCreate: false }
        ]));
        expect(component.getEvidenceInsights()).toEqual([
            {
                id: 'penMemoSketch:memo-1',
                label: '태블릿 야장 전사',
                detail: 'M1 · 태블릿 손글씨 원자료 · 스케치 메모 1획/1점.',
                sketchPreview: {
                    label: '스케치 메모 1획/1점.',
                    path: 'M 30 8 L 34 8 M 32 6 L 32 10',
                    viewBox: '0 0 120 72'
                },
                tone: 'warning'
            }
        ]);

        const [action] = component.getRecordActions();
        expect(action).toMatchObject({
            id: 'issue-pen-memo-handwriting-transcription-memo-1',
            type: 'openDocument',
            label: '관련 점검',
            detail: '태블릿 손글씨 원자료 · 스케치 메모 1획/1점. 태블릿 손글씨 원자료를 읽어 검토 전사문으로 남기세요.',
            documentId: 'memo-1',
            tone: 'warning'
        });

        await component.runRecordAction(action);

        expect(datastore.get).toHaveBeenCalledWith('memo-1');
        expect(routing.jumpToResource).toHaveBeenCalledWith(memo);
    });


    it('shows a stable empty state when the current record has no immediate actions', async () => {

        const photo = createDocument('photo-1', 'Photo', 'P1');
        const component = createComponent({
            find: jest.fn().mockResolvedValue({ documents: [photo] })
        });
        component.document = photo as any;
        component.fieldDefinitions = [
            field('recordCreationTiming')
        ] as any;

        await component.ngOnChanges();

        expect(component.shouldShow()).toBe(true);
        expect(component.getRecordActions()).toEqual([]);
        expect(component.hasRecordActionEmptyState()).toBe(true);
    });


    it('applies report identifiers while preserving the field number', async () => {

        const feature = createDocument('feature-1', 'Feature', '수혈 17', {}, {
            featureRecordingStatus: 'confirmed'
        });
        const component = createComponent({
            find: jest.fn().mockResolvedValue({ documents: [feature] })
        });
        const handleChanged = jest.fn();
        component.onChanged.subscribe(handleChanged);
        component.document = feature as any;
        component.fieldDefinitions = [
            field('featureRecordingStatus'),
            field('fieldIdentifier'),
            field('reportIdentifier'),
            field('identifierRevisionHistory'),
            field('identifierRevisionNote')
        ] as any;

        await component.ngOnChanges();

        expect(component.canShowIdentifierRevision()).toBe(true);
        expect(component.getIdentifierRevisionFieldIdentifier()).toBe('수혈 17');

        component.setIdentifierRevisionNextValue(' 조선시대 3호 수혈 ');
        component.setIdentifierRevisionReason('전면 제토 후 번호 재배정');
        expect(component.canApplyIdentifierRevision()).toBe(true);

        component.applyIdentifierRevision();

        expect(feature.resource).toMatchObject({
            identifier: '조선시대 3호 수혈',
            fieldIdentifier: '수혈 17',
            reportIdentifier: '조선시대 3호 수혈',
            identifierRevisionNote: '전면 제토 후 번호 재배정'
        });
        expect(feature.resource.identifierRevisionHistory).toEqual([
            expect.objectContaining({
                previousIdentifier: '수혈 17',
                nextIdentifier: '조선시대 3호 수혈',
                fieldIdentifier: '수혈 17',
                reason: '전면 제토 후 번호 재배정'
            })
        ]);
        expect(component.getIdentifierRevisionHistoryCount()).toBe(1);
        expect(handleChanged).toHaveBeenCalledTimes(1);
    });


    it('does not show identifier revision controls for non-feature records', async () => {

        const trench = createDocument('trench-1', 'Trench', 'T1', {}, {
            featureRecordingStatus: 'confirmed'
        });
        const component = createComponent({
            find: jest.fn().mockResolvedValue({ documents: [trench] })
        });
        component.document = trench as any;
        component.fieldDefinitions = [
            field('featureRecordingStatus'),
            field('fieldIdentifier'),
            field('reportIdentifier'),
            field('identifierRevisionHistory'),
            field('identifierRevisionNote')
        ] as any;

        await component.ngOnChanges();

        expect(component.canShowIdentifierRevision()).toBe(false);
    });
});


const createComponent = (
    datastore: any,
    routing: any = { jumpToResource: jest.fn() },
    projectConfiguration: any = createProjectConfiguration(),
    modalService: any = { open: jest.fn() }
) => new KoreanFieldworkRecordContextPanelComponent(
    datastore as any,
    { get: (item: any) => item.label ?? item.name } as any,
    projectConfiguration as any,
    routing as any,
    modalService as any
);


const createDocument = (
    id: string,
    category: string,
    identifier: string,
    relations: { [relationName: string]: string[] } = {},
    fields: any = {}
) => ({
    resource: {
        id,
        identifier,
        category,
        relations,
        ...fields
    }
});


const field = (name: string, valuelistId?: string) => ({
    name,
    editable: true,
    ...(valuelistId ? { valuelist: { id: valuelistId } } : {})
});


const checkboxesField = (name: string, valuelistId?: string) => ({
    ...field(name, valuelistId),
    inputType: 'checkboxes'
});


const textField = (name: string, label: string) => ({
    name,
    label,
    editable: true,
    inputType: 'text'
});


const createProjectConfiguration = (
    allowedRelations: Record<string, string[]> = {}
) => ({
    getCategory: (categoryName: string) => createCategory(categoryName),
    isAllowedRelationDomainCategory: (
        categoryName: string,
        parentCategoryName: string,
        relationName: string
    ) => (allowedRelations[`${categoryName}:${parentCategoryName}`] ?? []).includes(relationName)
});


const createCategory = (name: string) => ({
    name,
    label: getCategoryLabel(name),
    mustLieWithin: false,
    groups: [{
        name: 'koreanFieldwork',
        fields: createFields(name)
    }]
});


const createFields = (name: string) => {

    switch (name) {
        case 'Feature':
            return [
                field('featureType'),
                field('featureInterpretationType'),
                field('featureRecordingStatus', 'KoreanFieldwork-featureRecordingStatus'),
                field('featureInvestigationChecklist')
            ];
        case 'FeatureSegment':
            return [
                field('featureRecordingStatus', 'KoreanFieldwork-featureRecordingStatus'),
                field('featureInvestigationChecklist')
            ];
        default:
            return [];
    }
};


const getCategoryLabel = (name: string) => ({
    Feature: '유구',
    FeatureSegment: '세부유구',
    Photo: '사진'
}[name] ?? name);


const getTodayLabel = () => {
    const today = new Date();

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');
};
