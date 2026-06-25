import {
    makeKoreanFieldworkProgressItems
} from '../../../src/app/util/korean-fieldwork-progress-board';


describe('korean-fieldwork-progress-board', () => {

    it('sorts open feature records before stable closeout records', () => {

        const items = makeKoreanFieldworkProgressItems([
            createDocument('operation-1', 'Operation'),
            createDocument('trench-1', 'Trench', {
                relations: { isRecordedIn: ['operation-1'] }
            }),
            createDocument('feature-open', 'Feature', {
                relations: { liesWithin: ['trench-1'] },
                featureRecordingStatus: 'candidate',
                featureInvestigationChecklist: ['firstExposurePhoto']
            }),
            createDocument('feature-done', 'Feature', {
                relations: { liesWithin: ['trench-1'] },
                featureRecordingStatus: 'confirmed',
                featureInvestigationChecklist: ['completionPhotoTaken']
            }),
            createDocument('photo-1', 'Photo', {
                relations: { depicts: ['feature-done'] }
            })
        ] as any);

        expect(items[0]).toMatchObject({
            documentId: 'feature-open',
            stage: '조사',
            tone: 'warning',
            actionLabel: '기록 열기'
        });
        expect(items.find(item => item.documentId === 'feature-done')).toMatchObject({
            stage: '마감',
            tone: 'success',
            evidenceCount: 1
        });
    });


    it('marks feature parent ranges without feature children as investigation work', () => {

        const [item] = makeKoreanFieldworkProgressItems([
            createDocument('trench-1', 'Trench')
        ] as any);

        expect(item).toMatchObject({
            documentId: 'trench-1',
            stage: '조사',
            tone: 'info',
            detail: '이 범위에서 확인된 유구를 이어서 기록하세요.'
        });
    });


    it('starts excavation progress from detected features instead of trench setup', () => {

        const [item] = makeKoreanFieldworkProgressItems([
            createDocument('operation-1', 'Operation')
        ] as any, 6, 'excavation');

        expect(item).toMatchObject({
            documentId: 'operation-1',
            stage: '조사',
            tone: 'warning',
            detail: '제토 뒤 확인한 유구를 조사 경계 안에 먼저 기록하세요.',
            actionLabel: '유구 기록'
        });
    });


    it('keeps parent path and metrics for child records', () => {

        const items = makeKoreanFieldworkProgressItems([
            createDocument('operation-1', 'Operation'),
            createDocument('trench-1', 'Trench', {
                relations: { isRecordedIn: ['operation-1'] }
            }),
            createDocument('feature-1', 'Feature', {
                relations: { liesWithin: ['trench-1'] },
                featureRecordingStatus: 'confirmed',
                featureInvestigationChecklist: ['completionPhotoTaken']
            }),
            createDocument('segment-1', 'FeatureSegment', {
                relations: { liesWithin: ['feature-1'] }
            }),
            createDocument('photo-1', 'Photo', {
                relations: { depicts: ['feature-1'] }
            })
        ] as any);
        const feature = items.find(item => item.documentId === 'feature-1');

        expect(feature).toMatchObject({
            parentPath: 'operation-1 > trench-1',
            childCount: 1,
            evidenceCount: 1
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
});
