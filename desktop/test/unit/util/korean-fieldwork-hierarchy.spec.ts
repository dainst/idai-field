import {
    makeKoreanFieldworkHierarchyLanes
} from '../../../src/app/util/korean-fieldwork-hierarchy';


describe('korean-fieldwork-hierarchy', () => {

    it('groups fieldwork records into hierarchy lanes with parent, child, and issue counts', () => {

        const operation = createDocument('operation-1', 'Operation');
        const trench = createDocument('trench-1', 'Trench', {
            relations: { liesWithin: ['operation-1'] }
        });
        const feature = createDocument('feature-1', 'Feature', {
            relations: { liesWithin: ['trench-1'] }
        });
        const layer = createDocument('layer-1', 'Layer', {
            relations: { liesWithin: ['feature-1'] }
        });

        const lanes = makeKoreanFieldworkHierarchyLanes(
            [operation, trench, feature, layer],
            { 'feature-1': 2 },
            undefined,
            2
        );

        expect(lanes.map(lane => [lane.label, lane.totalCount])).toEqual([
            ['조사 구역 기록', 1],
            ['트렌치', 1],
            ['유구', 1],
            ['세부 단위', 0],
            ['토층', 1]
        ]);
        expect(lanes.find(lane => lane.categoryName === 'Feature')?.items[0])
            .toMatchObject({
                documentId: 'feature-1',
                parentIdentifier: 'trench-1',
                childCount: 1,
                issueCount: 2
            });
    });


    it('keeps ancestors and descendants when a selected record defines the current scope', () => {

        const operation = createDocument('operation-1', 'Operation');
        const trench = createDocument('trench-1', 'Trench', {
            relations: { liesWithin: ['operation-1'] }
        });
        const scopedFeature = createDocument('feature-1', 'Feature', {
            relations: { liesWithin: ['trench-1'] }
        });
        const scopedLayer = createDocument('layer-1', 'Layer', {
            relations: { liesWithin: ['feature-1'] }
        });
        const otherFeature = createDocument('feature-2', 'Feature', {
            relations: { liesWithin: ['trench-1'] }
        });

        const lanes = makeKoreanFieldworkHierarchyLanes([
            operation,
            trench,
            scopedFeature,
            scopedLayer,
            otherFeature
        ], {}, scopedFeature);

        expect(lanes.find(lane => lane.categoryName === 'Operation')?.items)
            .toEqual([expect.objectContaining({ documentId: 'operation-1' })]);
        expect(lanes.find(lane => lane.categoryName === 'Feature')?.items)
            .toEqual([expect.objectContaining({
                documentId: 'feature-1',
                isCurrentScope: true
            })]);
        expect(lanes.find(lane => lane.categoryName === 'Layer')?.items)
            .toEqual([expect.objectContaining({ documentId: 'layer-1' })]);
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
