import { Relation, Document } from 'idai-field-core';
import { ImportErrors as E } from '../../../../../src/app/components/import/import/import-errors';
import { completeInverseRelations } from '../../../../../src/app/components/import/import/process/complete-inverse-relations';
import { makeDocumentsLookup } from '../../../../../src/app/components/import/import/utils';
import IS_BELOW = Relation.Position.BELOW;
import IS_ABOVE = Relation.Position.ABOVE;
import IS_AFTER = Relation.Time.AFTER;
import IS_BEFORE = Relation.Time.BEFORE;
import IS_CONTEMPORARY_WITH = Relation.Time.CONTEMPORARY;
import RECORDED_IN = Relation.Hierarchy.RECORDEDIN;
import LIES_WITHIN = Relation.Hierarchy.LIESWITHIN;
import SAME_AS = Relation.SAME_AS;


describe('completeInverseRelations', () => {

    const inverseRelations = {

        isContemporaryWith: 'isContemporaryWith',
        isEquivalentTo: 'isEquivalentTo',
        isAfter: 'isBefore',
        isBefore: 'isAfter',
        isAbove: 'isBelow',
        isBelow: 'isAbove',
        isSameAs: 'isSameAs',
        isRecordedIn: undefined,
        liesWithin: undefined
    };

    const sameOperationRelations = ['isContemporaryWith', 'isEquivalentTo', 'isBefore', 'isAfter', 'isBelow',
        'isAbove', 'liesWithin'];

    let isRelationProperty;
    let get;


    let doc1: any;
    let doc2: any;
    let doc3: any;
    let doc4: any;
    let concreteOp1: any;
    let concreteOp2: any;


    beforeEach(() => {

        doc1 = {
            resource: {
                id: '1',
                identifier: 'one',
                category: 'Object',
                relations: {}
            }
        };

        doc2 = {
            resource: {
                id: '2',
                identifier: 'two',
                category: 'Object',
                relations: {}
            }
        };

        doc3 = {
            resource: {
                id: '3',
                identifier: 'three',
                category: 'Object',
                relations: { isRecordedIn: [] }
            }
        };

        doc4 = {
            resource: {
                id: '4',
                identifier: 'four',
                category: 'Object',
                relations: { isRecordedIn: [] }
            }
        };

        concreteOp1 = {
            resource: {
                id: 't1',
                identifier: 't1',
                category: 'Concrete',
                relations: { isRecordedIn: [] }
            }
        };

        concreteOp2 = {
            resource: {
                id: 't2',
                identifier: 't2',
                category: 'ConcreteOperation',
                relations: { isRecordedIn: [] }
            }
        };

        isRelationProperty = () => true;
    });


    it('set inverse relation between import resources', () => {

        const targetsLookup: any = {
            '1': [[], []],
            '2': [[], []],
        };

        doc2.resource.relations[IS_ABOVE] =  ['1'];
        doc1.resource.relations[IS_BELOW] = ['2'];

        const documents = completeInverseRelations(makeDocumentsLookup([doc1, doc2]), targetsLookup, inverseRelations,
            sameOperationRelations);
        expect(documents.length).toBe(0);
    });


    it('set inverse relation between import resources - complement inverse', () => {

        const targetsLookup: any = {
            '1': [[], []],
            '2': [[], []],
        };

        doc1.resource.relations[IS_BELOW] = ['2'];
        const documents = completeInverseRelations(makeDocumentsLookup([doc1, doc2]), targetsLookup, inverseRelations,
            sameOperationRelations);
        expect(documents.length).toBe(0);
        expect(doc2.resource.relations[IS_ABOVE]).not.toBeUndefined();
        expect(doc2.resource.relations[IS_ABOVE].length).toBe(1);
        expect(doc2.resource.relations[IS_ABOVE][0]).toBe('1');
    });


    it('set inverse relation between import resources - complement inverse, add to array', () => {

        const targetsLookup: any = {
            '1': [[], []],
            '2': [['3'], [doc3]],
        };

        doc2.resource.relations[IS_ABOVE] = ['3'];
        doc1.resource.relations[IS_BELOW] = ['2'];

        const documents = completeInverseRelations(makeDocumentsLookup([doc1, doc2]), targetsLookup, inverseRelations,
            sameOperationRelations);
        expect(documents.length).toBe(1); // three
        expect(doc2.resource.relations[IS_ABOVE]).not.toBeUndefined();
        expect(doc2.resource.relations[IS_ABOVE].length).toBe(2);
        expect(doc2.resource.relations[IS_ABOVE][1]).toBe('1');
    });


    it('set inverse relation with database resource', () => {

        const targetsLookup: any = {
            '1': [['2'], [doc2]],
        };

        doc1.resource.relations[IS_BELOW] = ['2'];
        const documents = completeInverseRelations(makeDocumentsLookup([doc1 as any]), targetsLookup, inverseRelations,
            sameOperationRelations);

        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(documents[0].resource.relations[IS_ABOVE][0]).toBe('1');
    });


    it('set inverse relation with database resource - add to already existing relation array', () => {

        const targetsLookup: any = {
            '1': [['2'], [doc2]]
        };

        doc2.resource.relations[IS_ABOVE] = ['3'];
        doc1.resource.relations[IS_BELOW] = ['2'];
        const documents = completeInverseRelations(makeDocumentsLookup([doc1 as any]), targetsLookup, inverseRelations,
            sameOperationRelations);

        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(documents[0].resource.relations[IS_ABOVE][0]).toBe('3');
        expect(documents[0].resource.relations[IS_ABOVE][1]).toBe('1');
    });


    it('add two to the same', () => {

        const targetsLookup: any = {
            '1': [['3'], [doc3]],
            '2': [['3'], [doc3]]
        };

        doc1.resource.relations[IS_BELOW] = ['3'];
        doc2.resource.relations[IS_BELOW] = ['3'];
        const documents = completeInverseRelations(makeDocumentsLookup([doc1 as any, doc2 as any]), targetsLookup,
            inverseRelations, sameOperationRelations);
        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('3');
        expect(documents[0].resource.relations[IS_ABOVE][0]).toBe('1');
        expect(documents[0].resource.relations[IS_ABOVE][1]).toBe('2');
    });


    it('add two to the same - which already has a relation', () => {

        const targetsLookup: any = {
            '1': [['3'], [doc3]],
            '2': [['3'], [doc3]]
        };

        doc4.resource.relations[IS_BELOW] = ['3'];
        doc3.resource.relations[IS_ABOVE] = ['4'];

        doc1.resource.relations[IS_BELOW] = ['3'];
        doc2.resource.relations[IS_BELOW] = ['3'];
        const documents = completeInverseRelations(makeDocumentsLookup([doc1 as any, doc2 as any]), targetsLookup,
            inverseRelations, sameOperationRelations);
        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('3');
        expect(documents[0].resource.relations[IS_ABOVE][0]).toBe('4');
        expect(documents[0].resource.relations[IS_ABOVE][1]).toBe('1');
        expect(documents[0].resource.relations[IS_ABOVE][2]).toBe('2');
    });


    it('remove one - where they are also related by other relation', () => {

        const targetsLookup: any = {
            '1': [['2'], [doc2]]
        };

        doc1.resource.relations = { isRecordedIn: [], isAfter: ['2']};

        doc2.resource.relations[IS_BEFORE] = ['1'];
        doc2.resource.relations[IS_ABOVE] = ['1'];

        const documents = completeInverseRelations(makeDocumentsLookup([doc1 as any]), targetsLookup, inverseRelations,
            sameOperationRelations);
        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(documents[0].resource.relations[IS_BEFORE][0]).toBe('1');
        expect(documents[0].resource.relations[IS_ABOVE]).toBeUndefined();
    });


    it('remove one - where they are not related by other relations', () => {

        const targetsLookup: any = {
            '1': [['2'], [doc2]],
        };

        doc2.resource.relations[IS_ABOVE] = ['1'];
        doc1.resource.relations[IS_BELOW] = ['2'];

        const doc1New = Document.clone(doc1);
        doc1New.resource.relations = { isRecordedIn: [] };

        const documents = completeInverseRelations(
            makeDocumentsLookup([doc1New as any]),
            targetsLookup,
            inverseRelations,
            sameOperationRelations,
            () => {},
            true
        );
        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(documents[0].resource.relations[IS_ABOVE]).toBeUndefined();
    });


    it('do not complete liesWithin and isRecordedIn relation', () => {

        const targetsLookup: any = {
            '2': [['1'], [doc1]]
        };

        doc2.resource.relations[LIES_WITHIN] = ['1'];
        doc2.resource.relations[RECORDED_IN] = ['1'];
        const documents = completeInverseRelations(makeDocumentsLookup([doc2]), targetsLookup, inverseRelations,
            sameOperationRelations);

        expect(documents.length).toBe(0);
        expect(doc2.resource.relations[LIES_WITHIN][0]).toBe('1');
        expect(doc2.resource.relations[RECORDED_IN][0]).toBe('1');
    });


    // err cases ///////////////////////////////////////////////////////////////////////////////////////////////////////

    it('bad range - between import and db resource - structural relation (LIES_WITHIN)', () => {

        const targetsLookup: any = {
            '1': [['2'], [doc2]],
        };

        function assertIsAllowedRelationDomainCategory(_: string, __: string, relationName: string): void {
            if (relationName === LIES_WITHIN) throw ['abc'];
        }

        doc1.resource.relations[LIES_WITHIN] = ['2'];

        try {
            completeInverseRelations(makeDocumentsLookup([doc1]), targetsLookup, inverseRelations,
                sameOperationRelations, assertIsAllowedRelationDomainCategory);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(['abc']);
        }
    });


    it('bad range - between import and db resource - structural relation (RECORDED_IN)', () => {

        const targetsLookup: any = {
            '1': [['2'], [doc2]],
        };

        function assertIsAllowedRelationDomainCategory(_: string, __: string, relationName: string): void {
            if (relationName === RECORDED_IN) throw ['abc'];
        }

        doc1.resource.relations[RECORDED_IN] = ['2'];

        try {
            completeInverseRelations(makeDocumentsLookup([doc1]), targetsLookup, inverseRelations,
                sameOperationRelations, assertIsAllowedRelationDomainCategory);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(['abc']);
        }
    });


    it('bad range - between import and db resource - non-structural relation', () => {

        const targetsLookup: any = {
            '1': [['2'], [doc2]],
        };

        function assertIsAllowedRelationDomainCategory(_: string, __: string, relationName: string): void {
            if (relationName !== LIES_WITHIN && relationName !== RECORDED_IN) throw ['abc'];
        }

        doc1.resource.relations[IS_AFTER] = ['2'];

        try {
            completeInverseRelations(makeDocumentsLookup([doc1]), targetsLookup, inverseRelations,
                sameOperationRelations, assertIsAllowedRelationDomainCategory);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(['abc']);
        }
    });


    it('bad range - between import resources - structural relation (LIES_WITHIN)', () => {

        function assertIsAllowedRelationDomainCategory(_: string, __: string, relationName: string): void {
            if (relationName === LIES_WITHIN) throw ['abc'];
        }

        doc1.resource.relations[LIES_WITHIN] = ['2'];
        doc2.resource.relations['bc'] = ['2'];

        try {
            completeInverseRelations(makeDocumentsLookup([doc1, doc2]), undefined, inverseRelations,
                sameOperationRelations, assertIsAllowedRelationDomainCategory);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(['abc']);
        }
    });


    it('bad range - between import resources - structural relation (RECORDED_IN)', () => {

        function assertIsAllowedRelationDomainCategory(_: string, __: string, relationName: string): void {
            if (relationName === RECORDED_IN) throw ['abc'];
        }

        doc1.resource.relations[RECORDED_IN] = ['2'];
        doc2.resource.relations['bc'] = ['2'];

        try {
            completeInverseRelations(makeDocumentsLookup([doc1, doc2]), undefined, inverseRelations,
                sameOperationRelations, assertIsAllowedRelationDomainCategory);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(['abc']);
        }
    });


    it('bad range - between import resources - non-structural relation', () => {

        function assertIsAllowedRelationDomainCategory(_: string, __: string, relationName: string): void {
            if (relationName !== LIES_WITHIN && relationName !== RECORDED_IN) throw ['abc'];
        }

        doc1.resource.relations['ab'] = ['2'];
        doc2.resource.relations['bc'] = ['2'];

        try {
            completeInverseRelations(makeDocumentsLookup([doc1, doc2]), get, inverseRelations,
                sameOperationRelations, assertIsAllowedRelationDomainCategory);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(['abc']);
        }
    });


    it('illegal relation between import resources', () => {

        doc1.resource.relations[RECORDED_IN] = ['t1'];
        doc1.resource.relations[IS_AFTER] = ['2'];
        doc2.resource.relations[RECORDED_IN] = ['t2'];
        doc2.resource.relations[IS_BEFORE] = ['1'];

        try {
            completeInverseRelations(makeDocumentsLookup([doc1, doc2]), undefined, inverseRelations,
                sameOperationRelations);
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(E.MUST_BE_IN_SAME_OPERATION);
            expect(errWithParams[1]).toEqual('one');
            expect(errWithParams[2]).toEqual('two');
        }
    });


    it('illegal relation between import and db resource', () => {

        const targetsLookup: any = {
            '1': [['2','t1'], [doc2, concreteOp1]]
        };

        doc2.resource.relations[RECORDED_IN] = ['t1'];
        doc1.resource.relations[IS_BELOW] = ['2'];
        doc1.resource.relations[RECORDED_IN] = ['t2'];

        try {
            completeInverseRelations(makeDocumentsLookup([doc1]), targetsLookup, inverseRelations,
                sameOperationRelations);
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(E.MUST_BE_IN_SAME_OPERATION);
            expect(errWithParams[1]).toEqual('one');
            expect(errWithParams[2]).toEqual('two');
        }
    });


    it('legal relation between import and db resource', () => {

        const targetsLookup: any = {
            '1': [['2','t1'], [doc2, concreteOp1]]
        };

        doc2.resource.relations[RECORDED_IN] = ['t1'];
        doc1.resource.relations[SAME_AS] = ['2'];
        doc1.resource.relations[RECORDED_IN] = ['t2'];

        try {
            completeInverseRelations(makeDocumentsLookup([doc1]), targetsLookup, inverseRelations,
                sameOperationRelations);
        } catch (errWithParams) {
            fail();
        }
    });


    it('opposing directions targeting same resource' +
        ' - import resource to import resource' +
        ' - set both directions in one resource', () => {

        const targetsLookup: any = {
            '1': [['t1'], [concreteOp1]],
            '2': [['t2'], [concreteOp2]]
        };

        doc1.resource.relations[IS_BELOW] = ['2'];
        doc1.resource.relations[IS_ABOVE] = ['2'];

        expectBadInterrelation([doc1, doc2], 'one', targetsLookup);
    });


    it('opposing directions targeting same resource' +
        ' - import resource to import resource' +
        ' - set one direction in each resource', () => {

        const targetsLookup: any = {
            '1': [[], []],
            '2': [[], []]
        };

        doc1.resource.relations[IS_BEFORE] = ['2'];
        doc2.resource.relations[IS_BEFORE] = ['1'];

        expectBadInterrelation([doc1, doc2], 'two', targetsLookup);
    });


    it('mutually exclusive directions targeting same resource' +
        ' - import resource to import resource' +
        ' - set both directions in one resource', () => {

        const targetsLookup: any = {
            '1': [[], []],
            '2': [[], []]
        };

        doc1.resource.relations[IS_CONTEMPORARY_WITH] = ['2'];
        doc1.resource.relations[IS_BEFORE] = ['2'];

        expectBadInterrelation([doc1, doc2], 'one', targetsLookup);
    });


    it('mutually exclusive directions targeting same resource' +
        ' - import resource to import resource' +
        ' - set one direction in each resource', () => {

        const targetsLookup: any = {
            '1': [[], []],
            '2': [[], []]
        };

        doc1.resource.relations[IS_CONTEMPORARY_WITH] = ['2'];
        doc2.resource.relations[IS_BEFORE] = ['1'];

        expectBadInterrelation([doc1, doc2], 'two', targetsLookup);
    });


    it('opposing directions targeting same resource' +
        ' - import resource to db resource', () => {

        const targetsLookup: any = {
            '1': [[], []]
        };

        doc1.resource.relations[IS_BELOW] = ['7']; // choose '7' as a document not in import
        doc1.resource.relations[IS_ABOVE] = ['7'];

        expectBadInterrelation([doc1], 'one', targetsLookup);
    });


    // TODO review
    xit('mutually exclusive directions targeting same resource' +
        ' - import resource to db resource', () => {

        const targetsLookup: any = {
            '1': [[], []]
        };

        doc1.resource.relations[IS_BELOW] = ['7']; // choose '7' as a document not in import
        // doc1.resource.relations[IS_EQUIVALENT_TO] = ['7'];

        expectBadInterrelation([doc1], 'one', targetsLookup);
    });


    it('opposing directions targeting same resource' +
        ' - however, it is ok if both directions pointing to different resources' +
        ' - import resource to import resource', () => {

        const targetsLookup: any = {
            '1': [['2','3'], [doc2, doc3]],
            '2': [[], []]
        };

        doc1.resource.relations[IS_BELOW] = ['2'];
        doc1.resource.relations[IS_ABOVE] = ['3'];
        try {
            completeInverseRelations(makeDocumentsLookup([doc1, doc2]), targetsLookup, inverseRelations,
                sameOperationRelations);
        } catch (errWithParams) {
            fail(errWithParams);
        }
    });


    it('set inverse relation within between import resources - also ignore if conflict is coming from a relation which is its own inverser', () => {

        const targetsLookup: any = {
            '1': [['2'], [doc2]],
            '2': [[], []]
        };

        doc1.resource.relations[IS_CONTEMPORARY_WITH] = ['2'];
        doc1.resource.relations[IS_CONTEMPORARY_WITH] = ['2'];
        try {
            completeInverseRelations(makeDocumentsLookup([doc1, doc2]), targetsLookup, inverseRelations,
                sameOperationRelations);
        } catch (errWithParams) {
            fail(errWithParams);
        }
    });


    function expectBadInterrelation(docs, err2, targetsLookup) {

        try {
            completeInverseRelations(makeDocumentsLookup(docs), targetsLookup, inverseRelations,
                sameOperationRelations);
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(E.BAD_INTERRELATION);
            expect(errWithParams[1]).toEqual(err2);
        }
    }
});
