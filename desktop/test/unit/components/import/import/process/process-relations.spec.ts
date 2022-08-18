import { Relation } from 'idai-field-core';
import { processRelations } from '../../../../../../src/app/components/import/import/process/process-relations';
import { createMockValidator, d } from '../helper';
import { ImportErrors, ImportErrors as E } from '../../../../../../src/app/components/import/import/import-errors';
import LIES_WITHIN = Relation.Hierarchy.LIESWITHIN;
import RECORDED_IN = Relation.Hierarchy.RECORDEDIN;


describe('processRelations', () => {

    let operationCategoryNames = ['Trench'];

    let validator;

    const existingFeature = {resource: { category: 'Feature', identifier: 'existingFeature', id: 'ef1', relations: { isRecordedIn: ['et1'] } } };
    const existingFeature2 = {resource: { category: 'Feature', identifier: 'existingFeature2', id: 'ef2', relations :{ isRecordedIn: ['et2'] } } };


    const relationInverses = { isAfter: 'isBefore' };
    const sameOperationRelations = ['isAfter', 'isBefore'];


    let get = async (resourceId): Promise<any> => {

        if (resourceId === 'et1') return d('et1', 'Trench', 'ExistingTrench1');
        if (resourceId === 'et2') return d('et2', 'Trench', 'ExistingTrench2');
        if (resourceId === 'ef1') return existingFeature;
        if (resourceId === 'ef2') return existingFeature2;
        throw 'missing';
    };

    let resourceIdCounter;

    beforeEach(() => {

        resourceIdCounter = 0;
        validator = createMockValidator();
    });


    it('convert LIES_WITHIN targeting existing operation to RECORDED_IN', async done => {

        const documents = [
            d('nf1', 'Feature', 'NewFeature1', { liesWithin: ['et1'] }),
        ];

        await processRelations(
            documents,
            validator,
            ['Trench'], get, relationInverses, sameOperationRelations, {});

        expect(documents[0].resource.relations[LIES_WITHIN]).toBeUndefined();
        expect(documents[0].resource.relations[RECORDED_IN]).toEqual(['et1']);
        done();
    });


    it('convert LIES_WITHIN targeting new operation to RECORDED_IN', async done => {

        const documents = [
            d('nt1', 'Trench', 'NewTrench1', {}),
            d('nf1', 'Feature', 'NewFeature1', { liesWithin: ['nt1'] }),
        ];

        await processRelations(
            documents,
            validator,
            ['Trench'], get, relationInverses, sameOperationRelations, {});

        expect(documents[1].resource.identifier).toBe('NewFeature1');
        expect(documents[1].resource.relations[LIES_WITHIN]).toBeUndefined();
        expect(documents[1].resource.relations[RECORDED_IN]).toEqual(['nt1']);
        done();
    });


    it('do not convert LIES_WITHIN targeting new place to RECORDED_IN', async done => {

        const documents = [
            d('np1', 'Place', 'NewPlace1', {}),
            d('nt1', 'Trench', 'NewTrench1', { liesWithin: ['np1'] }),
        ];

        await processRelations(
            documents,
            validator,
            ['Trench'], get, relationInverses, sameOperationRelations, {});

        expect(documents[1].resource.identifier).toBe('NewTrench1');
        expect(documents[1].resource.relations[RECORDED_IN]).toBeUndefined();
        expect(documents[1].resource.relations[LIES_WITHIN]).toEqual(['np1']);
        done();
    });




    // tests from former process()

    it('set inverse relation', async done => {

        const result = await processRelations([
                d('nf1', 'Feature', 'newFeature', { liesWithin: ['et1'], isAfter: ['ef1']})
            ],
            validator, operationCategoryNames, get, relationInverses, sameOperationRelations, { mergeMode: false });

        expect(result[0].resource.relations['isBefore'][0]).toEqual('nf1');
        done();
    });


    it('child of existing operation', async done => {

        const documents = [
            d('nf1', 'Feature', 'newFeature', { liesWithin: ['et1'] })
        ];

        await processRelations(documents,
            validator, operationCategoryNames, get, relationInverses, sameOperationRelations, { mergeMode: false });

        const resource = documents[0].resource;
        expect(resource.id).toBe('nf1');
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('child of existing operation, assign via resource id', async done => {

        const documents = [
            d('nf1', 'Feature', 'newFeature', { liesWithin: ['et1'] })
        ];

        await processRelations(
            documents,
            validator, operationCategoryNames, get, relationInverses, sameOperationRelations, { mergeMode: false });

        const resource = documents[0].resource;
        expect(resource.id).toBe('nf1');
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('child of existing feature', async done => {

        const documents = [
            d('nf1', 'Feature', 'newFeature', { liesWithin: ['ef1']})
        ]

        await processRelations(documents,
            validator, operationCategoryNames, get, relationInverses, sameOperationRelations,
            {});

        const resource = documents[0].resource;
        expect(resource.id).toBe('nf1');
        expect(resource.relations[RECORDED_IN][0]).toEqual('et1');
        expect(resource.relations[LIES_WITHIN][0]).toEqual('ef1');
        done();
    });


    it('import operation', async done => {

        const documents = [
            d('t', 'Trench', 'zero')
        ];
        await processRelations(documents,
            validator,
            operationCategoryNames,
            get, relationInverses, sameOperationRelations, {});

        const resource = documents[0].resource;
        expect(resource.identifier).toBe('zero');
        expect(resource.relations[RECORDED_IN]).toBeUndefined();
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('import operation including feature', async done => {

        const documents = [
            d('tOne', 'Trench', 'one'),
            d('fTwo', 'Feature', 'two', { liesWithin: ['tOne'] })
        ]

        await processRelations(documents,
            validator, operationCategoryNames, get, relationInverses, sameOperationRelations, {});

        const resource = documents[1].resource;
        expect(resource.identifier).toBe('two');
        expect(resource.relations[RECORDED_IN][0]).toBe('tOne');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('import operation including feature, order reversed', async done => {

        const documents = [
            d('nf1', 'Feature', 'two', { liesWithin: ['nt1'] }),
            d('nt1', 'Trench', 'one')
        ];

        await processRelations(documents, validator, operationCategoryNames, get, relationInverses, sameOperationRelations, {});

        const resource = documents[0].resource;
        expect(resource.identifier).toBe('two');
        expect(resource.relations[RECORDED_IN][0]).toBe('nt1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('import operation including feature, nest deeper', async done => {

        const documents = [
            d('nt1', 'Trench', 'one'),
            d('nf1', 'Feature', 'two', { liesWithin: ['nt1'] }),
            d('nfi1', 'Find', 'three', { liesWithin: ['nf1'] })
        ];

        await processRelations(documents, validator, operationCategoryNames, get, relationInverses, sameOperationRelations, {});

        const resource = documents[2].resource;
        expect(resource.identifier).toBe('three');
        expect(resource.relations[RECORDED_IN][0]).toBe('nt1');
        expect(resource.relations[LIES_WITHIN][0]).toEqual('nf1');
        done();
    });


    it('import operation including feature, nest deeper, order reversed', async done => {

        const documents = [
            d('nfi1', 'Find', 'three', { liesWithin: ['nf1'] }),
            d('nf1', 'Feature', 'two', { liesWithin: ['nt1'] }),
            d('nt1', 'Trench', 'one')
        ];

        await processRelations(documents, validator, operationCategoryNames, get, relationInverses, sameOperationRelations, {});

        const resource = documents[0].resource;
        expect(resource.identifier).toBe('three');
        expect(resource.relations[RECORDED_IN][0]).toBe('nt1');
        expect(resource.relations[LIES_WITHIN][0]).toEqual('nf1');
        done();
    });


    it('import feature as child of existing operation', async done => {

        const documents = [
            d('nf1', 'Feature', 'one', { liesWithin: ['et1'] })
        ];
        await processRelations(documents , validator, operationCategoryNames, get, relationInverses, sameOperationRelations, {});

        const resource = documents[0].resource;
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('import feature as child of existing operation, via operation assignment parameter', async done => {

        const documents = [
            d('nf1', 'Feature', 'one')
        ];
        await processRelations(documents, validator, operationCategoryNames, get, relationInverses, sameOperationRelations, { operationId: 'et1' });

        const resource = documents[0].resource;
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('nested resources, topmost child of existing operation', async done => {

        const documents = [
            d('nf1', 'Feature', 'one', { liesWithin: ['et1'] }),
            d('nfi1', 'Find', 'two', { liesWithin: ['nf1'] })
        ];

        await processRelations(documents, validator, operationCategoryNames, get, relationInverses, sameOperationRelations, {});

        expect(documents[0].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(documents[0].resource.relations[LIES_WITHIN]).toBeUndefined();
        expect(documents[1].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(documents[1].resource.relations[LIES_WITHIN][0]).toBe('nf1');
        done();
    });


    it('nested resources, topmost child of existing operation, order reversed', async done => {

        const documents = [
            d('nfi1', 'Find', 'two', { liesWithin: ['nf1'] }),
            d('nf1', 'Feature', 'one', { liesWithin: ['et1']})
        ];
        await processRelations(documents, validator, operationCategoryNames, get, relationInverses, sameOperationRelations, {});

        expect(documents[0].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(documents[0].resource.relations[LIES_WITHIN][0]).toBe('nf1');
        expect(documents[1].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(documents[1].resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('nested resources, assignment to operation via operation assignment parameter', async done => {

        const documents = [
            d('nf1', 'Feature', 'one'),
            d('nfi1', 'Find', 'two', { liesWithin: ['nf1'] })
        ];

        await processRelations(documents, validator, operationCategoryNames, get, relationInverses, sameOperationRelations, { operationId: 'et1' });

        expect(documents[0].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(documents[0].resource.relations[LIES_WITHIN]).toBeUndefined();
        expect(documents[1].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(documents[1].resource.relations[LIES_WITHIN][0]).toBe('nf1');
        done();
    });


    it('nested resources, assignment to operation via operation assignment parameter, order reversed', async done => {

        const documents = [
            d('nfi1', 'Find', 'two', { liesWithin: ['nf1'] }),
            d('nf1', 'Feature', 'one')
        ];
        await processRelations(documents, validator, operationCategoryNames, get, relationInverses, sameOperationRelations, { operationId: 'et1' });

        expect(documents[0].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(documents[0].resource.relations[LIES_WITHIN][0]).toBe('nf1');
        expect(documents[1].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(documents[1].resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('assignment to existing operation via parameter, also nested in existing', async done => {

        const documents = [
            d('nf1', 'Feature', 'one', { liesWithin: ['ef1']})
        ];
        await processRelations(documents, validator, operationCategoryNames, get, relationInverses, sameOperationRelations, { operationId: 'et1' });

        const resource = documents[0].resource;
        expect(resource.id).toBe('nf1');
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN][0]).toBe('ef1');
        done();
    });


    // merge mode //////////////////////////////////////////////////////////////////////////////////////////////////////

    it('merge, overwrite relations, reassign parent', async done => {

        const document = d('ef2', 'Feature', 'existingFeature2', { liesWithin: ['ef1'] });

        await processRelations(
            [document],
            validator, operationCategoryNames, get, relationInverses, sameOperationRelations, { mergeMode: true });

        const resource = document.resource;
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN][0]).toBe('ef1');
        done();
    });


    it('merge, overwrite relations', async done => {

        const document = d('ef1', 'Feature', 'existingFeature', { liesWithin: ['et2'], isAfter: ['ef2']});

        const result = await processRelations([document],
            validator, operationCategoryNames, get, relationInverses, sameOperationRelations, { mergeMode: true });

        expect(document.resource.relations['isAfter'][0]).toEqual('ef2');
        expect(result[0].resource.id).toEqual('ef2');
        expect(result[0].resource.relations['isBefore'][0]).toEqual('ef1');
        done();
    });


    // err cases /////////////////////////////////////////////////////////////////////////////////////////////

    it('merge, return error in case of an invalid relation', async done => {

        const document = d('ef1', 'Feature', 'existingFeature', { isAfter: 'unknown' });

        try {

            await processRelations(
                [document],
                validator, operationCategoryNames, get, relationInverses, sameOperationRelations, { mergeMode: true });
            fail();

        } catch (err) {
            expect(err[0]).toBe(ImportErrors.MISSING_RELATION_TARGET);
        }
        done();
    });


    it('assert lies within correctness', async done => {

        validator.assertLiesWithinCorrectness.and.callFake(() => { throw [E.MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE]});

        try {

            const documents = [
                d('nfi1', 'Find', 'one', { isChildOf: 'et1'})
            ];
            await processRelations(documents,
                validator, operationCategoryNames, get, relationInverses, sameOperationRelations, {});
            fail();
        } catch (err) {
            expect(err[0]).toEqual(E.MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE);
        }
        done();
    });


    it('assignment to existing feature, via mismatch with operation assignment parameter', async done => {

        try {

            const documents = [
                d('nf1', 'Feature', 'one', { liesWithin: ['ef2']})
            ];

            await processRelations(
                documents, validator, operationCategoryNames, get, relationInverses, sameOperationRelations, { operationId: 'et1' });
            fail();
        } catch (err) {
            expect(err[0]).toEqual(E.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN);
            expect(err[1]).toEqual('one');
        }
        done();
    });


    it('clash of assigned operation id with use of parent', async done => {

        try {
            await processRelations([
                d('nf1', 'Feature', 'one', {liesWithin: ['et1']})
            ], validator, operationCategoryNames, get, relationInverses, sameOperationRelations, {operationId: 'et1'});
            fail();
        } catch (err) {
            expect(err[0]).toEqual(E.PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED);
        }
        done();
    });


    it('missing liesWithin and no operation assigned', async done => {

        validator.assertHasLiesWithin.and.callFake(() => { throw [E.NO_PARENT_ASSIGNED]});

        try {
            await processRelations([
                    d('nf1', 'Feature', 'one')
                ],
                validator, operationCategoryNames, get, relationInverses, sameOperationRelations, {});
            fail();
        } catch (err) {
            expect(err[0]).toEqual(E.NO_PARENT_ASSIGNED);
        }
        done();
    });


    it('inverse relation not found', async done => {

        const doc = d('nf1', 'Feature', 'one');
        doc.resource.relations[Relation.Position.BELOW] = ['17'];

        try {
            await processRelations([doc], validator, operationCategoryNames, get, relationInverses, sameOperationRelations, {});
            fail();
        } catch (errWithParams) {
            expect(errWithParams[0]).toEqual(E.MISSING_RELATION_TARGET)
        }
        done();
    });
});
