jest.mock('src/app/electron/electron', () => ({
    electronRemote: undefined
}), { virtual: true });

import {
    KoreanFieldworkReadinessPanelComponent
} from '../../../../../src/app/components/docedit/core/korean-fieldwork-readiness-panel.component';


describe('KoreanFieldworkReadinessPanelComponent', () => {

    it('shows current document readiness issues from project documents', async () => {

        const featureDocument = createFeatureDocument({
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: []
        });
        const datastore = {
            find: jest.fn().mockResolvedValue({ documents: [featureDocument] })
        };
        const component = createComponent(datastore);
        component.document = featureDocument as any;
        component.fieldDefinitions = [
            { name: 'featureInvestigationChecklist' }
        ] as any;

        await component.refreshIssues();

        expect(datastore.find).toHaveBeenCalledWith({});
        expect(component.shouldShow()).toBe(true);
        expect(component.issues.map(issue => issue.ruleId)).toContain('feature-complete-photo');
        expect(component.getVisibleIssues()[0].documentId).toBe('feature-1');
    });


    it('refreshes issues after checklist values are updated', async () => {

        const featureDocument = createFeatureDocument({
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: []
        });
        const component = createComponent({
            find: jest.fn().mockResolvedValue({ documents: [featureDocument] })
        });
        component.document = featureDocument as any;
        component.fieldDefinitions = [
            { name: 'featureInvestigationChecklist' }
        ] as any;

        await component.refreshIssues();
        expect(component.issues.length).toBe(1);

        featureDocument.resource.featureInvestigationChecklist = ['completionPhotoTaken'];
        await component.refreshIssues();

        expect(component.issues).toEqual([]);
        expect(component.shouldShow()).toBe(true);
        expect(component.getMissingEvidenceLabels()).toEqual(['사진', '도면', '검토 기록']);
    });


    it('resolves safe checklist issues on the current edited document', async () => {

        const featureDocument = createFeatureDocument({
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: []
        });
        const component = createComponent({
            find: jest.fn().mockResolvedValue({ documents: [featureDocument] })
        });
        const onChanged = jest.fn();
        component.document = featureDocument as any;
        component.fieldDefinitions = [
            { name: 'featureInvestigationChecklist' }
        ] as any;
        component.onChanged.subscribe(onChanged);

        await component.refreshIssues();
        await component.resolveIssue(component.issues[0]);

        expect(featureDocument.resource.featureInvestigationChecklist).toEqual(['completionPhotoTaken']);
        expect(onChanged).toHaveBeenCalled();
        expect(component.issues).toEqual([]);
    });


    it('uses the currently edited document when datastore still has an older copy', async () => {

        const persistedDocument = createFeatureDocument({
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: []
        });
        const editedDocument = createFeatureDocument({
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: ['completionPhotoTaken']
        });
        const component = createComponent({
            find: jest.fn().mockResolvedValue({ documents: [persistedDocument] })
        });
        component.document = editedDocument as any;
        component.fieldDefinitions = [
            { name: 'featureInvestigationChecklist' }
        ] as any;

        await component.refreshIssues();

        expect(component.issues).toEqual([]);
    });


    it('does not show readiness issues outside Korean fieldwork forms', async () => {

        const featureDocument = createFeatureDocument({
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: []
        });
        const datastore = {
            find: jest.fn().mockResolvedValue({ documents: [featureDocument] })
        };
        const component = createComponent(datastore);
        component.document = featureDocument as any;
        component.fieldDefinitions = [{ name: 'shortDescription' }] as any;

        await component.refreshIssues();

        expect(datastore.find).not.toHaveBeenCalled();
        expect(component.issues).toEqual([]);
        expect(component.evidenceReview).toBeUndefined();
    });


    it('summarizes linked field evidence for the current record', async () => {

        const featureDocument = createFeatureDocument({
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: ['completionPhotoTaken']
        });
        const linkedPhoto = createRelatedDocument('photo-1', 'Photo');
        const linkedSoilProfilePhoto = createRelatedDocument('soil-photo-1', 'SoilProfilePhoto', undefined, {
            soilColorAssistCandidates: '1: 10YR 4/3 (높음, 차이 0.0)',
            soilColorAssistStatus: 'candidatesAvailable'
        });
        const linkedDrawing = createRelatedDocument('drawing-1', 'Drawing');
        const linkedPenMemo = createRelatedDocument('memo-1', 'PenMemo', undefined, {
            penMemoStrokes: '{"version":1,"strokes":[{"points":[{"x":10,"y":20}]}]}',
            penMemoTranscriptionStatus: 'pending'
        });
        const linkedFind = createRelatedDocument('find-1', 'Find');
        const linkedSegment = createRelatedDocument('segment-1', 'FeatureSegment', {
            liesWithin: ['feature-1']
        });
        const linkedLayer = createRelatedDocument('layer-1', 'Layer', {
            liesWithin: ['feature-1']
        });
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [
                    featureDocument,
                    linkedSegment,
                    linkedLayer,
                    linkedPhoto,
                    linkedSoilProfilePhoto,
                    linkedDrawing,
                    linkedPenMemo,
                    linkedFind
                ]
            })
        };
        const component = createComponent(datastore);
        component.document = featureDocument as any;
        component.fieldDefinitions = [
            { name: 'featureInvestigationChecklist' }
        ] as any;

        await component.refreshIssues();

        expect(component.getEvidenceMetrics()).toEqual(expect.arrayContaining([
            { id: 'featureSegments', label: '피트', count: 1 },
            { id: 'layers', label: '토색 메모', count: 1 },
            { id: 'photos', label: '사진', count: 1 },
            { id: 'soilProfilePhotos', label: '토층사진', count: 1 },
            { id: 'soilColorCandidates', label: '토색 후보', count: 1 },
            { id: 'drawings', label: '도면', count: 1 },
            { id: 'penMemos', label: '야장 메모', count: 1 },
            { id: 'penMemoSketches', label: '스케치 메모', count: 1 },
            { id: 'pendingPenMemoTranscriptions', label: '전사 대기', count: 1 },
            { id: 'finds', label: '유물', count: 1 },
            { id: 'samples', label: '시료', count: 0 }
        ]));
        expect(component.evidenceReview?.soilColorCandidateSummaries).toEqual([
            expect.objectContaining({
                label: '먼셀 후보 10YR 4/3'
            })
        ]);
        expect(component.getMissingEvidenceLabels()).toEqual(['검토 기록', '야장 전사']);
        expect(component.getPenMemoTranscriptionSummaryLabels()).toEqual([
            'memo-1 · 태블릿 손글씨 원자료 · 스케치 메모 1획/1점.'
        ]);
        expect(component.getEvidenceReviewStatusLabel()).toBe('보완 필요');
        const penMemoIssue = component.issues.find(issue =>
            issue.ruleId === 'pen-memo-handwriting-transcription'
        );
        expect(penMemoIssue).toMatchObject({
            documentId: 'memo-1',
            identifier: 'memo-1',
            recommendedAction: '태블릿 손글씨 원자료 · 스케치 메모 1획/1점. 태블릿 손글씨 원자료를 읽어 검토 전사문으로 남기세요.'
        });
        expect(component.canOpenIssueDocument(penMemoIssue!)).toBe(true);
    });


    it('shows readiness issues from linked evidence records', async () => {

        const featureDocument = createFeatureDocument({
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: ['completionPhotoTaken']
        });
        const linkedSample = createRelatedDocument(
            'sample-1',
            'Sample',
            { liesWithin: ['feature-1'] }
        );
        const component = createComponent({
            find: jest.fn().mockResolvedValue({
                documents: [featureDocument, linkedSample]
            })
        });
        component.document = featureDocument as any;
        component.fieldDefinitions = [
            { name: 'featureInvestigationChecklist' }
        ] as any;

        await component.refreshIssues();

        const relatedIssue = component.issues.find(issue => issue.ruleId === 'sample-purpose');

        expect(relatedIssue).toMatchObject({
            documentId: 'sample-1',
            identifier: 'sample-1'
        });
        expect(component.getIssueContextLabel(relatedIssue!)).toBe('sample-1');
        expect(component.canResolveIssue(relatedIssue!)).toBe(false);
        expect(component.canOpenIssueDocument(relatedIssue!)).toBe(true);
    });


    it('shows linked tablet media records whose Field Hub original backup is not confirmed', async () => {

        const featureDocument = createFeatureDocument({
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: ['completionPhotoTaken']
        });
        const linkedPhoto = createRelatedDocument(
            'photo-1',
            'Photo',
            { depicts: ['feature-1'] },
            { fieldworkPhotoUri: 'file:///tablet/photos/photo-1.jpg' }
        );
        const component = createComponent({
            find: jest.fn().mockResolvedValue({
                documents: [featureDocument, linkedPhoto]
            })
        });
        component.document = featureDocument as any;
        component.fieldDefinitions = [
            { name: 'featureInvestigationChecklist' }
        ] as any;

        await component.refreshIssues();

        const backupIssue = component.issues.find(issue =>
            issue.ruleId === 'fieldwork-photo-upload-missing'
        );

        expect(backupIssue).toMatchObject({
            documentId: 'photo-1',
            identifier: 'photo-1',
            relatedFields: [
                'fieldworkImageUploadStatus',
                'fieldworkImageUploadedAt',
                'fieldworkImageUploadedUri',
                'fieldworkImageUploadTarget',
                'fieldworkImageUploadedProject',
                'fieldworkImageUploadedSizeBytes',
                'fieldworkImageUploadedMd5',
                'fieldworkImageStoredSizeBytes',
                'fieldworkImageStoredMd5',
                'fieldworkImageStoredSha256',
                'digitalSourcePreservation'
            ]
        });
        expect(component.canOpenIssueDocument(backupIssue!)).toBe(true);
    });


    it('opens linked evidence records without leaving the current edit context', async () => {

        const featureDocument = createFeatureDocument({
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: ['completionPhotoTaken']
        });
        const linkedSample = createRelatedDocument(
            'sample-1',
            'Sample',
            { liesWithin: ['feature-1'] }
        );
        const updatedSample = {
            ...linkedSample,
            resource: {
                ...linkedSample.resource,
                samplePurpose: '분석 시료'
            }
        };
        const modalRef = {
            componentInstance: {
                setDocument: jest.fn().mockResolvedValue(undefined)
            },
            result: Promise.resolve({ documents: [updatedSample] })
        };
        const modalService = {
            open: jest.fn().mockReturnValue(modalRef)
        };
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [featureDocument, linkedSample]
            }),
            get: jest.fn().mockResolvedValue(linkedSample)
        };
        const component = createComponent(datastore, modalService);
        const onChanged = jest.fn();
        component.document = featureDocument as any;
        component.fieldDefinitions = [
            { name: 'featureInvestigationChecklist' }
        ] as any;
        component.onChanged.subscribe(onChanged);

        await component.refreshIssues();
        const relatedIssue = component.issues.find(issue => issue.ruleId === 'sample-purpose');

        await component.openIssueDocument(relatedIssue!);

        expect(datastore.get).toHaveBeenCalledWith('sample-1');
        expect(modalService.open).toHaveBeenCalled();
        expect(modalRef.componentInstance.setDocument).toHaveBeenCalledWith(linkedSample);
        expect(onChanged).toHaveBeenCalled();
        expect(component.issues.some(issue => issue.ruleId === 'sample-purpose')).toBe(false);
    });


    it('batch-applies safe closeout updates across linked fieldwork records', async () => {

        const featureDocument = createFeatureDocument({
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: ['completionPhotoTaken']
        });
        const linkedSegment = createRelatedDocument(
            'segment-1',
            'FeatureSegment',
            { liesWithin: ['feature-1'] },
            {
                featureRecordingStatus: 'confirmed',
                featureInvestigationChecklist: ['findsRecovered']
            }
        );
        const datastore = {
            find: jest.fn().mockResolvedValue({
                documents: [featureDocument, linkedSegment]
            }),
            bulkUpdate: jest.fn(async (documents: any[]) => documents)
        };
        const component = createComponent(datastore);
        const onChanged = jest.fn();
        component.document = featureDocument as any;
        component.fieldDefinitions = [
            { name: 'featureInvestigationChecklist' }
        ] as any;
        component.onChanged.subscribe(onChanged);

        await component.refreshIssues();

        expect(component.getSafeResolutionIssueCount()).toBe(2);
        expect(component.hasSafeResolutionIssues()).toBe(true);

        await component.resolveSafeProjectIssues();

        expect(datastore.bulkUpdate).toHaveBeenCalledWith([
            expect.objectContaining({
                resource: expect.objectContaining({
                    id: 'segment-1',
                    featureInvestigationChecklist: [
                        'findsRecovered',
                        'completionPhotoTaken',
                        'preRecoveryFindPhotoTaken'
                    ]
                })
            })
        ]);
        expect(onChanged).toHaveBeenCalled();
        expect(component.issues.some(issue =>
            issue.documentId === 'segment-1'
            && ['feature-complete-photo', 'finds-recovered-pre-photo'].includes(issue.ruleId)
        )).toBe(false);
    });


    it('creates safely linkable evidence records from the evidence summary', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const featureDocument = createFeatureDocument({
            featureRecordingStatus: 'confirmed',
            featureInvestigationChecklist: ['completionPhotoTaken']
        });
        const datastore = {
            find: jest.fn().mockResolvedValue({ documents: [featureDocument] }),
            create: jest.fn(async (document: any) => ({
                ...document,
                resource: {
                    id: `${document.resource.category}-1`,
                    ...document.resource
                }
            }))
        };
        const component = createComponent(datastore);
        const onChanged = jest.fn();
        component.document = featureDocument as any;
        component.fieldDefinitions = [
            { name: 'featureInvestigationChecklist' }
        ] as any;
        component.onChanged.subscribe(onChanged);

        await component.refreshIssues();

        expect(component.getEvidenceCreationActions().map(action => action.categoryName))
            .toEqual(['FeatureSegment', 'Photo', 'SoilProfilePhoto', 'Drawing', 'Find', 'Sample']);

        const segmentAction = component.getEvidenceCreationActions()
            .find(action => action.categoryName === 'FeatureSegment');
        expect(segmentAction).toBeDefined();
        await component.createEvidenceRecord(segmentAction!);

        expect(datastore.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
            resource: expect.objectContaining({
                identifier: 'feature-segment-1700000000000',
                category: 'FeatureSegment',
                relations: { liesWithin: ['feature-1'] }
            })
        }));

        const photoAction = component.getEvidenceCreationActions()
            .find(action => action.categoryName === 'Photo');
        expect(photoAction).toBeDefined();
        await component.createEvidenceRecord(photoAction!);

        expect(datastore.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
            resource: expect.objectContaining({
                identifier: 'photo-1700000000000',
                category: 'Photo',
                relations: { depicts: ['feature-1'] }
            })
        }));

        const soilPhotoAction = component.getEvidenceCreationActions()
            .find(action => action.categoryName === 'SoilProfilePhoto');
        expect(soilPhotoAction).toBeDefined();
        await component.createEvidenceRecord(soilPhotoAction!);

        expect(datastore.create).toHaveBeenNthCalledWith(3, expect.objectContaining({
            resource: expect.objectContaining({
                identifier: 'soil-profile-photo-1700000000000',
                category: 'SoilProfilePhoto',
                relations: { depicts: ['feature-1'] },
                soilColorAssistStatus: 'notRun'
            })
        }));

        const sampleAction = component.getEvidenceCreationActions()
            .find(action => action.categoryName === 'Sample');
        expect(sampleAction).toBeDefined();
        await component.createEvidenceRecord(sampleAction!);

        expect(datastore.create).toHaveBeenNthCalledWith(4, expect.objectContaining({
            resource: expect.objectContaining({
                identifier: 'sample-1700000000000',
                category: 'Sample',
                relations: { liesWithin: ['feature-1'] }
            })
        }));
        expect(onChanged).toHaveBeenCalled();
        expect(component.getEvidenceMetrics()).toEqual(expect.arrayContaining([
            { id: 'featureSegments', label: '피트', count: 1 },
            { id: 'photos', label: '사진', count: 1 },
            { id: 'soilProfilePhotos', label: '토층사진', count: 1 },
            { id: 'soilColorCandidates', label: '토색 후보', count: 0 },
            { id: 'samples', label: '시료', count: 1 }
        ]));

        jest.restoreAllMocks();
    });


    it('creates a linked soil profile photo draft for missing soil profile photo issues', async () => {

        jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

        const featureDocument = createFeatureDocument({
            featureSoilProfilePhotoCount: 1,
            featureInvestigationChecklist: []
        });
        const datastore = {
            find: jest.fn().mockResolvedValue({ documents: [featureDocument] }),
            create: jest.fn(async (document: any) => ({
                ...document,
                resource: {
                    id: 'soil-photo-1',
                    ...document.resource
                }
            }))
        };
        const component = createComponent(datastore);
        const onChanged = jest.fn();
        component.document = featureDocument as any;
        component.fieldDefinitions = [
            { name: 'featureInvestigationChecklist' }
        ] as any;
        component.onChanged.subscribe(onChanged);

        await component.refreshIssues();
        const issue = component.issues.find(entry => entry.ruleId === 'soil-profile-photo-count');

        expect(issue).toBeDefined();
        expect(component.canResolveIssue(issue)).toBe(true);

        await component.resolveIssue(issue);

        expect(datastore.create).toHaveBeenCalledWith(expect.objectContaining({
            resource: expect.objectContaining({
                identifier: 'soil-profile-photo-1700000000000',
                category: 'SoilProfilePhoto',
                relations: { depicts: ['feature-1'] },
                soilColorAssistStatus: 'notRun',
                soilProfilePhotoQuality: 0.35
            })
        }));
        expect(onChanged).toHaveBeenCalled();
        expect(component.issues.some(entry => entry.ruleId === 'soil-profile-photo-count')).toBe(false);

        jest.restoreAllMocks();
    });
});


const createComponent = (datastore: any, modalService: any = createModalService()) => new KoreanFieldworkReadinessPanelComponent(
    datastore as any,
    createProjectConfiguration() as any,
    modalService as any
);


const createModalService = () => ({
    open: jest.fn()
});


const createFeatureDocument = (resource: any) => ({
    resource: {
        id: 'feature-1',
        identifier: 'Feature 1',
        category: 'Feature',
        relations: {},
        ...resource
    }
});


const createRelatedDocument = (
    id: string,
    category: string,
    relations: { [relationName: string]: string[] } = { depicts: ['feature-1'] },
    fields: any = {}
) => ({
    resource: {
        id,
        identifier: id,
        category,
        relations,
        ...fields
    }
});


const createProjectConfiguration = () => ({
    getCategory: (categoryName: string) => {
        if (categoryName === 'SoilProfilePhoto') return createSoilProfilePhotoCategory();
        if (['FeatureSegment', 'Photo', 'Drawing', 'Find', 'Sample'].includes(categoryName)) {
            return createGenericCategory(categoryName);
        }

        return undefined;
    },
    isAllowedRelationDomainCategory: (
        categoryName: string,
        parentCategoryName: string,
        relationName: string
    ) => parentCategoryName === 'Feature'
        && (
            ['Photo', 'Drawing', 'SoilProfilePhoto'].includes(categoryName) && relationName === 'depicts'
            || ['FeatureSegment', 'Find', 'Sample'].includes(categoryName) && relationName === 'liesWithin'
        )
});


const createSoilProfilePhotoCategory = () => ({
    name: 'SoilProfilePhoto',
    groups: [{
        name: 'koreanFieldwork',
        fields: [
            field('layerSequenceMeaning', 'KoreanFieldwork-layerSequenceMeaning'),
            field('soilColorAssistCandidates'),
            field('soilColorAssistStatus'),
            field('soilProfileAnnotationStrokes'),
            field('soilProfileColorSwatches'),
            field('soilProfileLayerIds'),
            field('soilProfileLayerMarkers'),
            field('soilProfilePhotoQuality'),
            field('soilProfilePhotoSizeHintKb')
        ]
    }]
});


const createGenericCategory = (name: string) => ({
    name,
    groups: []
});


const field = (name: string, valuelistId?: string) => ({
    name,
    ...(valuelistId ? { valuelist: { id: valuelistId } } : {})
});
