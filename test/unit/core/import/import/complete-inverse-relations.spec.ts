import {ImportErrors as E} from '../../../../../src/app/core/import/import/import-errors';
import {clone} from '../../../../../src/app/core/util/object-util';
import {HierarchicalRelations, PositionRelations, TimeRelations} from '../../../../../src/app/core/model/relation-constants';
import IS_BELOW = PositionRelations.BELOW;
import IS_ABOVE = PositionRelations.ABOVE;
import IS_AFTER = TimeRelations.AFTER;
import IS_BEFORE = TimeRelations.BEFORE;
import IS_CONTEMPORARY_WITH = TimeRelations.CONTEMPORARY;
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;
import LIES_WITHIN = HierarchicalRelations.LIESWITHIN;
import {completeInverseRelations} from '../../../../../src/app/core/import/import/process/complete-inverse-relations';
import IS_EQUIVALENT_TO = PositionRelations.EQUIVALENT;


describe('completeInverseRelations', () => {

    const inverseRelations = {

        isContemporaryWith: 'isContemporaryWith',
        isEquivalentTo: 'isEquivalentTo',
        isAfter: 'isBefore',
        isBefore: 'isAfter',
        isAbove: 'isBelow',
        isBelow: 'isAbove',
        isRecordedIn: undefined,
        liesWithin: undefined
    };

    let isRelationProperty;
    let get;


    let doc1: any;
    let doc2: any;
    let doc3: any;
    let doc4: any;


    beforeEach(() => {

        doc2 = {
            resource: {
                id: '2',
                identifier: 'two',
                category: 'Object',
                relations: {}
            }
        };

        doc1 = {
            resource: {
                id: '1',
                identifier: 'one',
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

        const concreteOp1 = {
            resource: {
                id: 't1',
                identifier: 't1',
                category: 'Concrete',
                relations: { isRecordedIn: [] }
            }
        };

        const concreteOp2 = {
            resource: {
                id: 't2',
                identifier: 't2',
                category: 'ConcreteOperation',
                relations: { isRecordedIn: [] }
            }
        };

        get = async (resourceId: string) => {

            if (resourceId === '1') return doc1;
            if (resourceId === '2') return doc2;
            if (resourceId === '3') return doc3;
            if (resourceId === '4') return doc3;
            if (resourceId === 't1') return concreteOp1;
            if (resourceId === 't2') return concreteOp2;
            throw "not found";
        };
        isRelationProperty = () => true;
    });


    it('set inverse relation between import resources', async done => {

        doc2.resource.relations[IS_ABOVE] =  ['1'];
        doc1.resource.relations[IS_BELOW] = ['2'];

        const documents = await completeInverseRelations([doc1, doc2], get, inverseRelations);
        expect(documents.length).toBe(0);
        done();
    });


    it('set inverse relation between import resources - complement inverse', async done => {

        doc1.resource.relations[IS_BELOW] = ['2'];
        const documents = await completeInverseRelations([doc1, doc2], get, inverseRelations);
        expect(documents.length).toBe(0);
        expect(doc2.resource.relations[IS_ABOVE]).not.toBeUndefined();
        expect(doc2.resource.relations[IS_ABOVE].length).toBe(1);
        expect(doc2.resource.relations[IS_ABOVE][0]).toBe('1');
        done();
    });


    it('set inverse relation between import resources - complement inverse, add to array', async done => {

        doc2.resource.relations[IS_ABOVE] = ['3'];
        doc1.resource.relations[IS_BELOW] = ['2'];

        const documents = await completeInverseRelations([doc1, doc2], get, inverseRelations);
        expect(documents.length).toBe(1); // three
        expect(doc2.resource.relations[IS_ABOVE]).not.toBeUndefined();
        expect(doc2.resource.relations[IS_ABOVE].length).toBe(2);
        expect(doc2.resource.relations[IS_ABOVE][1]).toBe('1');
        done();
    });


    it('set inverse relation with database resource', async done => {

        doc1.resource.relations[IS_BELOW] = ['2'];
        const documents = await completeInverseRelations([doc1 as any], get, inverseRelations);

        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(documents[0].resource.relations[IS_ABOVE][0]).toBe('1');
        expect(doc2.resource.relations[IS_ABOVE]).toBeUndefined(); // dont touch original (cached instance in production setting
        done();
    });


    it('set inverse relation with database resource - add to already existing relation array', async done => {

        doc2.resource.relations[IS_ABOVE] = ['3'];
        doc1.resource.relations[IS_BELOW] = ['2'];
        const documents = await completeInverseRelations([doc1 as any], get, inverseRelations);

        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(documents[0].resource.relations[IS_ABOVE][0]).toBe('3');
        expect(documents[0].resource.relations[IS_ABOVE][1]).toBe('1');
        done();
    });


    it('add two to the same', async done => {

        doc1.resource.relations[IS_BELOW] = ['3'];
        doc2.resource.relations[IS_BELOW] = ['3'];
        const documents = await completeInverseRelations([doc1 as any, doc2 as any], get, inverseRelations);
        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('3');
        expect(documents[0].resource.relations[IS_ABOVE][0]).toBe('1');
        expect(documents[0].resource.relations[IS_ABOVE][1]).toBe('2');
        done();
    });


    it('add two to the same - which already has a relation', async done => {

        doc4.resource.relations[IS_BELOW] = ['3'];
        doc3.resource.relations[IS_ABOVE] = ['4'];

        doc1.resource.relations[IS_BELOW] = ['3'];
        doc2.resource.relations[IS_BELOW] = ['3'];
        const documents = await completeInverseRelations([doc1 as any, doc2 as any], get, inverseRelations);
        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('3');
        expect(documents[0].resource.relations[IS_ABOVE][0]).toBe('4');
        expect(documents[0].resource.relations[IS_ABOVE][1]).toBe('1');
        expect(documents[0].resource.relations[IS_ABOVE][2]).toBe('2');
        done();
    });


    it('remove one - where they are also related by other relation', async done => {

        doc1.resource.relations = { isRecordedIn: [], isAfter: ['2']};

        doc2.resource.relations[IS_BEFORE] = ['1'];
        doc2.resource.relations[IS_ABOVE] = ['1'];

        const documents = await completeInverseRelations([doc1 as any], get, inverseRelations);
        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(documents[0].resource.relations[IS_BEFORE][0]).toBe('1');
        expect(documents[0].resource.relations[IS_ABOVE]).toBeUndefined();
        done();
    });


    it('remove one - where they are not related by other relations', async done => {

        doc2.resource.relations[IS_ABOVE] = ['1'];
        doc1.resource.relations[IS_BELOW] = ['2'];

        const doc1New = clone(doc1);
        doc1New.resource.relations = { isRecordedIn: [] };

        const documents = await completeInverseRelations(
            [doc1New as any],
            get, inverseRelations,
            () => {}, true);
        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(documents[0].resource.relations[IS_ABOVE]).toBeUndefined();
        done();
    });


    it('do not complete liesWithin and isRecordedIn relation', async done => {

        doc2.resource.relations[LIES_WITHIN] = ['1'];
        doc2.resource.relations[RECORDED_IN] = ['1'];
        const documents = await completeInverseRelations([doc2], get, inverseRelations);

        expect(documents.length).toBe(0);
        expect(doc2.resource.relations[LIES_WITHIN][0]).toBe('1');
        expect(doc2.resource.relations[RECORDED_IN][0]).toBe('1');
        done();
    });


    // err cases ///////////////////////////////////////////////////////////////////////////////////////////////////////

    it('bad range - between import and db resource - structural relation (LIES_WITHIN)', async done => {

        function assertIsAllowedRelationDomainCategory(_: string, __: string, relationName: string): void {
            if (relationName === LIES_WITHIN) throw ['abc'];
        }

        doc1.resource.relations[LIES_WITHIN] = ['2'];

        try {
            await completeInverseRelations([doc1], get, inverseRelations, assertIsAllowedRelationDomainCategory);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(['abc']);
        }
        done();
    });


    it('bad range - between import and db resource - structural relation (RECORDED_IN)', async done => {

        function assertIsAllowedRelationDomainCategory(_: string, __: string, relationName: string): void {
            if (relationName === RECORDED_IN) throw ['abc'];
        }

        doc1.resource.relations[RECORDED_IN] = ['2'];

        try {
            await completeInverseRelations([doc1], get, inverseRelations, assertIsAllowedRelationDomainCategory);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(['abc']);
        }
        done();
    });


    it('bad range - between import and db resource - non-structural relation', async done => {

        function assertIsAllowedRelationDomainCategory(_: string, __: string, relationName: string): void {
            if (relationName !== LIES_WITHIN && relationName !== RECORDED_IN) throw ['abc'];
        }

        doc1.resource.relations[IS_AFTER] = ['2'];

        try {
            await completeInverseRelations([doc1], get, inverseRelations, assertIsAllowedRelationDomainCategory);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(['abc']);
        }
        done();
    });


    it('bad range - between import resources - structural relation (LIES_WITHIN)', async done => {

        function assertIsAllowedRelationDomainCategory(_: string, __: string, relationName: string): void {
            if (relationName === LIES_WITHIN) throw ['abc'];
        }

        doc1.resource.relations[LIES_WITHIN] = ['2'];
        doc2.resource.relations['bc'] = ['2'];

        try {
            await completeInverseRelations([doc1, doc2], get, inverseRelations, assertIsAllowedRelationDomainCategory);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(['abc']);
        }
        done();
    });


    it('bad range - between import resources - structural relation (RECORDED_IN)', async done => {

        function assertIsAllowedRelationDomainCategory(_: string, __: string, relationName: string): void {
            if (relationName === RECORDED_IN) throw ['abc'];
        }

        doc1.resource.relations[RECORDED_IN] = ['2'];
        doc2.resource.relations['bc'] = ['2'];

        try {
            await completeInverseRelations([doc1, doc2], get, inverseRelations, assertIsAllowedRelationDomainCategory);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(['abc']);
        }
        done();
    });


    it('bad range - between import resources - non-structural relation', async done => {

        function assertIsAllowedRelationDomainCategory(_: string, __: string, relationName: string): void {
            if (relationName !== LIES_WITHIN && relationName !== RECORDED_IN) throw ['abc'];
        }

        doc1.resource.relations['ab'] = ['2'];
        doc2.resource.relations['bc'] = ['2'];

        try {
            await completeInverseRelations([doc1, doc2], get, inverseRelations, assertIsAllowedRelationDomainCategory);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(['abc']);
        }
        done();
    });


    it('illegal relation between import resources', async done => {

        doc1.resource.relations[RECORDED_IN] = ['t1'];
        doc1.resource.relations[IS_AFTER] = ['2'];
        doc2.resource.relations[RECORDED_IN] = ['t2'];
        doc2.resource.relations[IS_BEFORE] = ['1'];

        try {
            await completeInverseRelations([doc1, doc2], get, inverseRelations);
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(E.MUST_BE_IN_SAME_OPERATION);
            expect(errWithParams[1]).toEqual('one');
            expect(errWithParams[2]).toEqual('two');
        }
        done();
    });


    it('illegal relation between import and db resource', async done => {

        doc2.resource.relations[RECORDED_IN] = ['t1'];
        doc1.resource.relations[IS_BELOW] = ['2'];
        doc1.resource.relations[RECORDED_IN] = ['t2'];

        try {
            await completeInverseRelations([doc1], get, inverseRelations);
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(E.MUST_BE_IN_SAME_OPERATION);
            expect(errWithParams[1]).toEqual('one');
            expect(errWithParams[2]).toEqual('two');
        }
        done();
    });


    it('opposing directions targeting same resource' +
        ' - import resource to import resource' +
        ' - set both directions in one resource', async done => {

        doc1.resource.relations[IS_BELOW] = ['2'];
        doc1.resource.relations[IS_ABOVE] = ['2'];

        await expectBadInterrelation([doc1, doc2], 'one');
        done();
    });


    it('opposing directions targeting same resource' +
        ' - import resource to import resource' +
        ' - set one direction in each resource', async done => {

        doc1.resource.relations[IS_BEFORE] = ['2'];
        doc2.resource.relations[IS_BEFORE] = ['1'];

        await expectBadInterrelation([doc1, doc2], 'two');
        done();
    });


    it('mutually exclusive directions targeting same resource' +
        ' - import resource to import resource' +
        ' - set both directions in one resource', async done => {

        doc1.resource.relations[IS_CONTEMPORARY_WITH] = ['2'];
        doc1.resource.relations[IS_BEFORE] = ['2'];

        await expectBadInterrelation([doc1, doc2], 'one');
        done();
    });


    it('mutually exclusive directions targeting same resource' +
        ' - import resource to import resource' +
        ' - set one direction in each resource', async done => {

        doc1.resource.relations[IS_CONTEMPORARY_WITH] = ['2'];
        doc2.resource.relations[IS_BEFORE] = ['1'];

        await expectBadInterrelation([doc1, doc2], 'two');
        done();
    });


    it('opposing directions targeting same resource' +
        ' - import resource to db resource', async done => {

        doc1.resource.relations[IS_BELOW] = ['7']; // choose '7' as a document not in import
        doc1.resource.relations[IS_ABOVE] = ['7'];

        await expectBadInterrelation([doc1], 'one');
        done();
    });


    it('mutually exclusive directions targeting same resource' +
        ' - import resource to db resource', async done => {

        doc1.resource.relations[IS_BELOW] = ['7']; // choose '7' as a document not in import
        doc1.resource.relations[IS_EQUIVALENT_TO] = ['7'];

        await expectBadInterrelation([doc1], 'one');
        done();
    });


    it('opposing directions targeting same resource' +
        ' - however, it is ok if both directions pointing to different resources' +
        ' - import resource to import resource', async done => {

        doc1.resource.relations[IS_BELOW] = ['2'];
        doc1.resource.relations[IS_ABOVE] = ['3'];
        try {
            await completeInverseRelations([doc1, doc2], get, inverseRelations);
        } catch (errWithParams) {
            fail(errWithParams);
        }
        done();
    });


    it('set inverse relation within between import resources - also ignore if conflict is coming from a relation which is its own inverser', async done => {

        doc1.resource.relations[IS_CONTEMPORARY_WITH] = ['2'];
        doc1.resource.relations[IS_CONTEMPORARY_WITH] = ['2'];
        try {
            await completeInverseRelations([doc1, doc2], get, inverseRelations);
        } catch (errWithParams) {
            fail(errWithParams);
        }
        done();
    });


    it('inverse relation not found', async done => {

        doc1.resource.relations[IS_BELOW] = ['17'];
        try {
            await completeInverseRelations([doc1 as any], get, inverseRelations);
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(E.EXEC_MISSING_RELATION_TARGET)
        }
        done();
    });


    async function expectBadInterrelation(docs, err2) {

        try {
            await completeInverseRelations(docs, get, inverseRelations);
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(E.BAD_INTERRELATION);
            expect(errWithParams[1]).toEqual(err2);
        }
    }
});
