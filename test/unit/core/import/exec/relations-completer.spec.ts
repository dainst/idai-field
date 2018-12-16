import {RelationsCompleter} from '../../../../../app/core/import/exec/relations-completer';
import {ImportErrors} from '../../../../../app/core/import/exec/import-errors';


describe('RelationsCompleter', () => {


    let get;
    let isRelationProperty;
    let getInverseRelation;

    let doc1: any;
    let doc2: any;
    let doc3: any;



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
                relations: {liesWithin: [], isRecordedIn: []}
            }
        };

        doc3 = {
            resource: {
                id: '3',
                identifier: 'three',
                type: 'Object',
                relations: {isRecordedIn: []}
            }
        };

        get = async (resourceId: string) => {

            if (resourceId === '1') return doc1;
            if (resourceId === '2') return doc2;
            if (resourceId === '3') return doc3;
            throw "not found";
        };
        isRelationProperty = (_: any) => true;
        getInverseRelation = (_: string) => _ === 'includes' ? 'liesWithin' : 'includes';
    });


    it('set inverse relation within import itself', async done => {

        doc2.resource.relations['includes'] =  ['1'];
        doc1.resource.relations['liesWithin'] = ['2'];
        const documents = await RelationsCompleter.completeInverseRelations([doc1, doc2], get, isRelationProperty, getInverseRelation);

        expect(documents.length).toBe(0);
        done();
    });


    it('set inverse relation within import itself - complement inverse', async done => {

        doc1.resource.relations['liesWithin'] = ['2'];
        const documents = await RelationsCompleter.completeInverseRelations([doc1, doc2], get, isRelationProperty, getInverseRelation);
        expect(documents.length).toBe(0);
        expect(doc2.resource.relations['includes']).not.toBeUndefined();
        expect(doc2.resource.relations['includes'].length).toBe(1);
        expect(doc2.resource.relations['includes'][0]).toBe('1');
        done();
    });


    it('set inverse relation within import itself - complement inverse, add to array', async done => {

        doc2.resource.relations['includes'] = ['3'];
        doc1.resource.relations['liesWithin'] = ['2'];

        const documents = await RelationsCompleter.completeInverseRelations([doc1, doc2], get, isRelationProperty, getInverseRelation);
        expect(documents.length).toBe(1); // three
        expect(doc2.resource.relations['includes']).not.toBeUndefined();
        expect(doc2.resource.relations['includes'].length).toBe(2);
        expect(doc2.resource.relations['includes'][1]).toBe('1');
        done();
    });


    it('set inverse relation within import itself - both directions set', async done => {

        doc1.resource.relations['liesWithin'] = ['2'];
        doc1.resource.relations['includes'] = ['2'];
        try {
            await RelationsCompleter.completeInverseRelations([doc1, doc2], get, isRelationProperty, getInverseRelation);
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(ImportErrors.BAD_INTERRELATION);
            expect(errWithParams[1]).toEqual('one');
            expect(errWithParams[2]).toEqual('two');
        }
        done();
    });


    it('set inverse relation with database resource', async done => {

        doc1.resource.relations['liesWithin'][0] = '2';
        const documents = await RelationsCompleter
            .completeInverseRelations([doc1 as any], get, isRelationProperty, getInverseRelation);

        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(doc2.resource.relations['includes'][0]).toBe('1');
        done();
    });


    it('set inverse relation with database resource - add to already existing relation array', async done => {

        doc2.resource.relations['includes'] = ['3'];
        doc1.resource.relations['liesWithin'][0] = '2';
        const documents = await RelationsCompleter
            .completeInverseRelations([doc1 as any], get, isRelationProperty, getInverseRelation);

        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(doc2.resource.relations['includes'][0]).toBe('3');
        expect(doc2.resource.relations['includes'][1]).toBe('1');
        done();
    });


    it('inverse relation not found', async done => {

        doc1.resource.relations['liesWithin'][0] = '17';
        try {

            await RelationsCompleter
                .completeInverseRelations([doc1 as any], get, isRelationProperty, getInverseRelation);
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(ImportErrors.EXEC_MISSING_RELATION_TARGET)
        }
        done();
    });


    it('empty relation', async done => {

        doc1.resource.relations['liesWithin'] = [];
        try {
            await RelationsCompleter.completeInverseRelations([doc1 as any], get, isRelationProperty, getInverseRelation);
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(ImportErrors.EMPTY_RELATION);
            expect(errWithParams[1]).toEqual('one');
        }
        done();
    });
});