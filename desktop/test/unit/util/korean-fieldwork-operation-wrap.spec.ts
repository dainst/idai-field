import {
    createOperationRelationUpdate,
    getLegacyRootDocumentsForOperation,
    getOperationWrapConfirmationMessage,
    OPERATION_WRAP_CONFIRMATION_TITLE
} from '../../../src/app/util/korean-fieldwork-operation-wrap';


describe('korean-fieldwork-operation-wrap', () => {

    it('finds legacy root records that need to move under a new operation', () => {

        const feature = createDocument('feature-1', 'Feature');
        const photo = createDocument('photo-1', 'Photo', {
            depicts: ['feature-1']
        });
        const rootMemo = createDocument('memo-1', 'PenMemo');
        const operation = createDocument('operation-1', 'Operation');
        const sourceIndex = createDocument('source-1', 'SourceEvidenceIndex');

        expect(getLegacyRootDocumentsForOperation([
            feature,
            photo,
            rootMemo,
            operation,
            sourceIndex
        ] as any).map(document => document.resource.id)).toEqual([
            'feature-1',
            'memo-1'
        ]);
    });


    it('prepares relation updates without changing the original record content', () => {

        const feature = createDocument('feature-1', 'Feature', {}, {
            shortDescription: '기존 기록',
            relations: { depicts: ['photo-1'] }
        });
        const operation = createDocument('operation-1', 'Operation');

        expect(createOperationRelationUpdate(feature as any, operation as any)).toMatchObject({
            resource: {
                id: 'feature-1',
                shortDescription: '기존 기록',
                relations: {
                    depicts: ['photo-1'],
                    isRecordedIn: ['operation-1']
                }
            }
        });
        expect(feature.resource.relations).toEqual({ depicts: ['photo-1'] });
    });


    it('uses field-facing confirmation wording for operation wrapping', () => {

        expect(OPERATION_WRAP_CONFIRMATION_TITLE).toBe('조사 경계 생성');
        expect(getOperationWrapConfirmationMessage(2))
            .toBe('2개 기존 기록의 내용은 유지합니다. 조사 경계를 만들고 이후 기록을 그 기준 아래에 이어서 남깁니다.');
    });
});


const createDocument = (
        id: string,
        category: string,
        relations: Record<string, string[]> = {},
        fields: Record<string, unknown> = {}
) => ({
    resource: {
        id,
        identifier: id,
        category,
        relations,
        ...fields
    }
});
