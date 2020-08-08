import {Document} from 'idai-components-2';
import {ImportErrors as E} from '../../../../../src/app/core/import/import/import-errors';
import {process} from '../../../../../src/app/core/import/import/process/process';
import {createMockValidator, d} from './helper';
import {HierarchicalRelations} from '../../../../../src/app/core/model/relation-constants';
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;
import LIES_WITHIN = HierarchicalRelations.LIESWITHIN;

/**
 * @author Daniel de Oliveira
 */
describe('process()', () => {

    let validator;

    let operationCategoryNames = ['Trench'];

    const existingFeature = {resource: { category: 'Feature', identifier: 'existingFeature', id: 'ef1', relations: { isRecordedIn: ['et1'] } } };
    const existingFeature2 = {resource: { category: 'Feature', identifier: 'existingFeature2', id: 'ef2', relations :{ isRecordedIn: ['et2'] } } };

    const relationInverses = { isAfter: 'isBefore' };

    let get = async (resourceId): Promise<any> => {

        if (resourceId === 'ef1') return existingFeature;
        if (resourceId === 'ef2') return existingFeature2;
        if (resourceId === 'et1') return { resource: { category: 'Trench', identifier: 'existingTrench', id: 'et1', relations: {} } };
        if (resourceId === 'et2') return { resource: { category: 'Trench', identifier: 'existingTrench2', id: 'et2', relations: {} } };
        else throw 'missing';
    };


    let resourceIdCounter;


    beforeEach(() => {

        resourceIdCounter = 0;
        validator = createMockValidator();
    });


    // merge mode //////////////////////////////////////////////////////////////////////////////////////////////////////

    // TODO repair
    xit('merge, overwrite relations', async done => {

        const document = d('nf1', 'Feature', 'existingFeature', { liesWithin: ['et2'], isAfter: ['ef2']});

        const result = await process([document],
            // { 'nf1': existingFeature } as any, <- TODO
            validator, operationCategoryNames, get, relationInverses, { mergeMode: true });

        expect(result[0][0].resource.relations['isAfter'][0]).toEqual('ef2');
        expect(result[1][0].resource.id).toEqual('ef2');
        expect(result[1][0].resource.relations['isBefore'][0]).toEqual('ef1');
        done();
    });

    /*

    it('merge, overwrite relations, reassign parent', async done => {

        const document = d('nf1', 'Feature', 'existingFeature2', { liesWithin: ['ef1'] });

        const result = await process(
            [document],
            { 'nf1': existingFeature } as any,
            validator, operationCategoryNames, get, relationInverses, { mergeMode: true });

        const resource = result[0][0].resource;
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN][0]).toBe('ef1');
        done();
    });


    it('merge, return error in case of an invalid relation', async done => {

        const document = d('nf1', 'Feature', 'existingFeature', { isAfter: 'unknown' });

        const result = await process(
            [document],
            { 'nf1': existingFeature} as any,
            validator, operationCategoryNames, get, relationInverses, { mergeMode: true });

        expect(result[0].length).toBe(0);
        expect(result[2]).not.toBeUndefined();
        done();
    });


     */
    // err cases /////////////////////////////////////////////////////////////////////////////////////////////

    it('assert lies within correctness', async done => {

        validator.assertLiesWithinCorrectness.and.callFake(() => { throw [E.MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE]});

        const result = await process([
            d('nfi1', 'Find', 'one', { isChildOf: 'et1'})
        ],
            validator, operationCategoryNames, get, relationInverses);

        expect(result[2][0]).toEqual(E.MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE);
        done();
    });


    it('assignment to existing feature, via mismatch with operation assignment parameter', async done => {

        const result = await process([
            d('nf1', 'Feature', 'one', { liesWithin: ['ef2']})
        ], validator, operationCategoryNames, get, relationInverses, { operationId: 'et1' });

        expect(result[2][0]).toEqual(E.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN);
        expect(result[2][1]).toEqual('one');
        done();
    });


    it('clash of assigned operation id with use of parent', async done => {

        const result = await process([
            d('nf1', 'Feature', 'one', { liesWithin: ['et1']})
        ], validator, operationCategoryNames, get, relationInverses, { operationId: 'et1'});
        expect(result[2][0]).toEqual(E.PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED);
        done();
    });


    it('missing liesWithin and no operation assigned', async done => {

        validator.assertHasLiesWithin.and.callFake(() => { throw [E.NO_PARENT_ASSIGNED]});

        const result = await process([
            d('nf1', 'Feature', 'one')
        ],
            validator, operationCategoryNames, get, relationInverses);
        expect(result[2][0]).toEqual(E.NO_PARENT_ASSIGNED);
        done();
    });
});
