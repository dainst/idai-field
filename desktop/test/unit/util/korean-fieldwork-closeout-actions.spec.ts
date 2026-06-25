import {
    getKoreanFieldworkCloseoutBatchUpdates,
    getKoreanFieldworkCloseoutIssueActions
} from '../../../src/app/util/korean-fieldwork-closeout-actions';


describe('korean-fieldwork-closeout-actions', () => {

    it('maps closeout issues to runnable resolution actions', () => {

        const feature = createDoc('feature-1', 'Feature', {
            featureInvestigationChecklist: ['measuredDrawingCompleted']
        });
        const issue = createIssue('feature-complete-photo', 'feature-1');

        const [action] = getKoreanFieldworkCloseoutIssueActions(
            [issue],
            new Map([[feature.resource.id, feature]]),
            () => []
        );

        expect(action.document).toBe(feature);
        expect(action.resolutionAction).toMatchObject({
            type: 'updateFields',
            updates: {
                featureInvestigationChecklist: [
                    'measuredDrawingCompleted',
                    'completionPhotoTaken'
                ]
            }
        });
    });


    it('keeps create-document resolutions out of the batch update plan', () => {

        const feature = createDoc('feature-1', 'Feature');
        const issueActions = getKoreanFieldworkCloseoutIssueActions(
            [createIssue('soil-profile-photo-count', 'feature-1')],
            new Map([[feature.resource.id, feature]]),
            () => ['SoilProfilePhoto']
        );

        expect(issueActions[0].resolutionAction).toMatchObject({
            type: 'createDocument',
            categoryName: 'SoilProfilePhoto'
        });
        expect(getKoreanFieldworkCloseoutBatchUpdates(issueActions)).toEqual([]);
    });


    it('merges multiple checklist fixes for the same record', () => {

        const feature = createDoc('feature-1', 'Feature', {
            featureInvestigationChecklist: ['findsRecovered']
        });
        const issueActions = getKoreanFieldworkCloseoutIssueActions(
            [
                createIssue('feature-complete-photo', 'feature-1'),
                createIssue('finds-recovered-pre-photo', 'feature-1')
            ],
            new Map([[feature.resource.id, feature]]),
            () => []
        );

        expect(getKoreanFieldworkCloseoutBatchUpdates(issueActions)).toMatchObject([
            {
                document: feature,
                issueCount: 2,
                updates: {
                    featureInvestigationChecklist: [
                        'findsRecovered',
                        'completionPhotoTaken',
                        'preRecoveryFindPhotoTaken'
                    ]
                }
            }
        ]);
    });
});


const createDoc = (
    id: string,
    category: string,
    extraResource: Record<string, unknown> = {}
) => ({
    resource: {
        id,
        identifier: id,
        category,
        relations: {},
        ...extraResource
    }
} as any);


const createIssue = (ruleId: string, documentId: string) => ({
    ruleId,
    documentId,
    identifier: documentId,
    category: 'Feature',
    severity: 'warning',
    message: '확인 필요',
    relatedFields: ['featureInvestigationChecklist'],
    recommendedAction: '현장에서 확인하세요.',
    blocksSave: false
} as any);
