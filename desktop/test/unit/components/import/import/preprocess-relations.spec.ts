import { complementInverseRelationsBetweenImportDocs } from '../../../../../src/app/components/import/import/preprocess-relations';


describe('preprocessRelations', () => {

    const inverseRelationsMap: any = {
        isAfter: 'isBefore',
        isBefore: 'isAfter'
    };

    const context: any = {
        inverseRelationsMap: inverseRelationsMap
    };

    const options: any = {
        useIdentifiersInRelations: true
    };


    test('leave things as they are', () => {

        const docs: any[] = [
            { resource: { identifier: 'F1', category: 'Feature', relations: { isAfter: ['F2']}}},
            { resource: { identifier: 'F2', category: 'Feature', relations: { isBefore: ['F1']}}}
        ];

        complementInverseRelationsBetweenImportDocs(context, options, docs);

        expect(Object.keys(docs[0].resource.relations)).toEqual(['isAfter']);
        expect(docs[0].resource.relations['isAfter']).toEqual(['F2']);
        expect(Object.keys(docs[1].resource.relations)).toEqual(['isBefore']);
        expect(docs[1].resource.relations['isBefore']).toEqual(['F1']);
    });


    test('complement a relations', () => {

        const docs: any[] = [
            { resource: { identifier: 'F1', category: 'Feature', relations: { }}},
            { resource: { identifier: 'F2', category: 'Feature', relations: { isBefore: ['F1']}}}
        ];

        complementInverseRelationsBetweenImportDocs(context, options, docs);

        expect(Object.keys(docs[0].resource.relations)).toEqual(['isAfter']);
        expect(docs[0].resource.relations['isAfter']).toEqual(['F2']);
        expect(Object.keys(docs[1].resource.relations)).toEqual(['isBefore']);
        expect(docs[1].resource.relations['isBefore']).toEqual(['F1']);
    });


    test('complement a relation and leave one as it is', () => {

        const docs: any[] = [
            { resource: { identifier: 'F1', category: 'Feature', relations: { isAfter: ['F2']}}},
            { resource: { identifier: 'F2', category: 'Feature', relations: { isBefore: ['F1']}}},
            { resource: { identifier: 'F3', category: 'Feature', relations: { isAfter: ['F2']}}}
        ];

        complementInverseRelationsBetweenImportDocs(context, options, docs);

        expect(Object.keys(docs[0].resource.relations)).toEqual(['isAfter']);
        expect(docs[0].resource.relations['isAfter']).toEqual(['F2']);
        expect(Object.keys(docs[1].resource.relations)).toEqual(['isBefore']);
        expect(docs[1].resource.relations['isBefore']).toEqual(['F1', 'F3']);
        expect(Object.keys(docs[2].resource.relations)).toEqual(['isAfter']);
        expect(docs[2].resource.relations['isAfter']).toEqual(['F2']);
    });
});
