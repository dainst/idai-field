import {RelationsCompleter} from '../../../../../app/core/import/exec/relations-completer';
import {ImportErrors as E} from '../../../../../app/core/import/exec/import-errors';
import {clone} from '../../../../../app/core/util/object-util';
import {HIERARCHICAL_RELATIONS, POSITION_RELATIONS, TIME_RELATIONS} from '../../../../../app/core/model/relation-constants';
import IS_BELOW = POSITION_RELATIONS.IS_BELOW;
import IS_ABOVE = POSITION_RELATIONS.IS_ABOVE;
import IS_AFTER = TIME_RELATIONS.IS_AFTER;
import IS_BEFORE = TIME_RELATIONS.IS_BEFORE;
import IS_CONTEMPORARY_WITH = TIME_RELATIONS.IS_CONTEMPORARY_WITH;
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;
import LIES_WITHIN = HIERARCHICAL_RELATIONS.LIES_WITHIN;


describe('RelationsCompleter', () => {


    let isRelationProperty;
    let completeInverseRelations;

    let doc1: any;
    let doc2: any;
    let doc3: any;
    let doc4: any;


    beforeEach(() => {

        doc2 = {
            resource: {
                id: '2',
                identifier: 'two',
                type: 'Object',
                relations: {}
            }
        };

        doc1 = {
            resource: {
                id: '1',
                identifier: 'one',
                type: 'Object',
                relations: {}
            }
        };

        doc3 = {
            resource: {
                id: '3',
                identifier: 'three',
                type: 'Object',
                relations: { isRecordedIn: [] }
            }
        };

        doc4 = {
            resource: {
                id: '4',
                identifier: 'four',
                type: 'Object',
                relations: { isRecordedIn: [] }
            }
        };

        const get = async (resourceId: string) => {

            if (resourceId === '1') return doc1;
            if (resourceId === '2') return doc2;
            if (resourceId === '3') return doc3;
            if (resourceId === '4') return doc3;
            throw "not found";
        };
        isRelationProperty = () => true;
        const getInverseRelation = (_: string) => {
            // make sure it gets ignored even if inverses are set
            if (_ === RECORDED_IN) throw 'E';
            if (_ === LIES_WITHIN) throw 'E';
            //
            if (_ === IS_CONTEMPORARY_WITH) return IS_CONTEMPORARY_WITH;
            if (_ === IS_AFTER) return IS_BEFORE;
            return _ === IS_ABOVE ? IS_BELOW : IS_ABOVE;
        };

        completeInverseRelations = RelationsCompleter.completeInverseRelations(get, getInverseRelation);
    });
    

    it('set inverse relation within import itself', async done => {

        doc2.resource.relations[IS_ABOVE] =  ['1'];
        doc1.resource.relations[IS_BELOW] = ['2'];

        const documents = await completeInverseRelations([doc1, doc2]);
        expect(documents.length).toBe(0);
        done();
    });


    it('set inverse relation within import itself - complement inverse', async done => {

        doc1.resource.relations[IS_BELOW] = ['2'];
        const documents = await completeInverseRelations([doc1, doc2]);
        expect(documents.length).toBe(0);
        expect(doc2.resource.relations[IS_ABOVE]).not.toBeUndefined();
        expect(doc2.resource.relations[IS_ABOVE].length).toBe(1);
        expect(doc2.resource.relations[IS_ABOVE][0]).toBe('1');
        done();
    });


    it('set inverse relation within import itself - complement inverse, add to array', async done => {

        doc2.resource.relations[IS_ABOVE] = ['3'];
        doc1.resource.relations[IS_BELOW] = ['2'];

        const documents = await completeInverseRelations([doc1, doc2]);
        expect(documents.length).toBe(1); // three
        expect(doc2.resource.relations[IS_ABOVE]).not.toBeUndefined();
        expect(doc2.resource.relations[IS_ABOVE].length).toBe(2);
        expect(doc2.resource.relations[IS_ABOVE][1]).toBe('1');
        done();
    });


    it('set inverse relation with database resource', async done => {

        doc1.resource.relations[IS_BELOW] = ['2'];
        const documents = await completeInverseRelations([doc1 as any]);

        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(documents[0].resource.relations[IS_ABOVE][0]).toBe('1');
        expect(doc2.resource.relations[IS_ABOVE]).toBeUndefined(); // dont touch original (cached instance in production setting
        done();
    });


    it('set inverse relation with database resource - add to already existing relation array', async done => {

        doc2.resource.relations[IS_ABOVE] = ['3'];
        doc1.resource.relations[IS_BELOW] = ['2'];
        const documents = await completeInverseRelations([doc1 as any]);

        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(documents[0].resource.relations[IS_ABOVE][0]).toBe('3');
        expect(documents[0].resource.relations[IS_ABOVE][1]).toBe('1');
        done();
    });


    it('add two to the same', async done => {

        doc1.resource.relations[IS_BELOW] = ['3'];
        doc2.resource.relations[IS_BELOW] = ['3'];
        const documents = await completeInverseRelations([doc1 as any, doc2 as any]);
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
        const documents = await completeInverseRelations([doc1 as any, doc2 as any]);
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

        const documents = await completeInverseRelations([doc1 as any]);
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

        const documents = await completeInverseRelations([doc1New as any], true);
        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(documents[0].resource.relations[IS_ABOVE]).toBeUndefined();
        done();
    });


    it('do not complete liesWithin and isRecordedIn relation', async done => {

        doc2.resource.relations[LIES_WITHIN] = ['1'];
        doc2.resource.relations[RECORDED_IN] = ['1'];
        const documents = await completeInverseRelations([doc2]);

        expect(documents.length).toBe(0);
        expect(doc2.resource.relations[LIES_WITHIN][0]).toBe('1');
        expect(doc2.resource.relations[RECORDED_IN][0]).toBe('1');
        done();
    });


    // err cases ///////////////////////////////////////////////////////////////////////////////////////////////////////

    it('illegal relation between import resources', async done => {

        doc1.resource.relations[RECORDED_IN] = ['t1'];
        doc1.resource.relations[IS_AFTER] = ['2'];
        doc2.resource.relations[RECORDED_IN] = ['t2'];
        doc2.resource.relations[IS_BEFORE] = ['1'];

        try {
            await completeInverseRelations([doc1, doc2]);
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
            await completeInverseRelations([doc1]);
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

        doc1.resource.relations[IS_ABOVE] = ['2'];
        doc2.resource.relations[IS_ABOVE] = ['1'];

        await expectBadInterrelation([doc1, doc2], 'two');
        done();
    });


    it('mutually exclusive directions targeting same resource' +
        ' - import resource to import resource' +
        ' - set both directions in one resource', async done => {

        doc1.resource.relations[IS_CONTEMPORARY_WITH] = ['2'];
        doc1.resource.relations[IS_ABOVE] = ['2'];

        await expectBadInterrelation([doc1, doc2], 'one');
        done();
    });


    it('mutually exclusive directions targeting same resource' +
        ' - import resource to import resource' +
        ' - set one direction in each resource', async done => {

        doc1.resource.relations[IS_CONTEMPORARY_WITH] = ['2'];
        doc2.resource.relations[IS_ABOVE] = ['1'];

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
        doc1.resource.relations[IS_CONTEMPORARY_WITH] = ['7'];

        await expectBadInterrelation([doc1], 'one');
        done();
    });


    it('opposing directions targeting same resource' +
        ' - however, it is ok if both directions pointing to different resources' +
        ' - import resource to import resource', async done => {

        doc1.resource.relations[IS_BELOW] = ['2'];
        doc1.resource.relations[IS_ABOVE] = ['3'];
        try {
            await completeInverseRelations([doc1, doc2]);
        } catch (errWithParams) {
            fail(errWithParams);
        }
        done();
    });


    it('set inverse relation within import itself - also ignore if conflict is coming from a relation which is its own inverser', async done => {

        doc1.resource.relations[IS_CONTEMPORARY_WITH] = ['2'];
        doc1.resource.relations[IS_CONTEMPORARY_WITH] = ['2'];
        try {
            await completeInverseRelations([doc1, doc2]);
        } catch (errWithParams) {
            fail(errWithParams);
        }
        done();
    });
    
    
    it('inverse relation not found', async done => {

        doc1.resource.relations[IS_BELOW] = ['17'];
        try {

            await completeInverseRelations([doc1 as any]);
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(E.EXEC_MISSING_RELATION_TARGET)
        }
        done();
    });


    it('empty relation', async done => {

        doc1.resource.relations[IS_BELOW] = [];
        try {
            await completeInverseRelations([doc1 as any]);
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(E.EMPTY_RELATION);
            expect(errWithParams[1]).toEqual('one');
        }
        done();
    });


    async function expectBadInterrelation(docs, err2) {

        try {
            await completeInverseRelations(docs);
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(E.BAD_INTERRELATION);
            expect(errWithParams[1]).toEqual(err2);
        }
    }
});