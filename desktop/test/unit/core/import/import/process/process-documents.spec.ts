import {Document} from 'idai-components-2';
import {HierarchicalRelations} from '../../../../../../src/app/core/model/relation-constants';
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;
import LIES_WITHIN = HierarchicalRelations.LIESWITHIN;
import {ImportErrors as E} from '../../../../../../src/app/core/import/import/import-errors';
import {createMockValidator, d} from '../helper';
import {processDocuments} from '../../../../../../src/app/core/import/import/process/process-documents';


describe('processDocuments', () => {

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


    it('merge, add field', async done => {

        const document: Document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                category: 'Feature',
                identifier: 'existingFeature',
                field: 'new',
                id: '1',
                relations: {},
                geometry: { type: 'Point',  coordinates: [ 27.189335972070694, 39.14122423529625]}
            }
        };

        const result = await processDocuments(
            [document],
            { '1': existingFeature } as any,
            validator);

        const resource = result[0].resource;
        expect(resource.id).toBe('ef1');
        expect(resource.relations[RECORDED_IN][0]).toEqual('et1');
        expect(resource['field']).toEqual('new');
        expect(resource['geometry']).toEqual({ type: 'Point', coordinates: [ 27.189335972070694, 39.14122423529625] });
        done();
    });


    it('merge, multiple times', async done => {

        const document1: Document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                category: 'Feature',
                identifier: 'existingFeature',
                field1: 'new1',
                shortDescription: 'sd1',
                id: 'ef1',
                relations: {}
            }
        };
        const document2: Document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                category: 'Feature',
                identifier: 'existingFeature',
                field2: 'new2',
                shortDescription: 'sd2',
                id: 'ef1',
                relations: {}
            }
        };

        const result = await processDocuments(
            [document1, document2],
            { 'ef1': existingFeature } as any,
            validator);

        const resource = result[0].resource;
        expect(resource.id).toBe('ef1');
        expect(resource['field1']).toEqual('new1');
        expect(resource['field2']).toEqual('new2');
        expect(resource['shortDescription']).toEqual('sd2');
        done();
    });


    // err cases /////////////////////////////////////////////////////////////////////////////////////////////

    it('validation error - not wellformed', async done => {

        validator.assertIsWellformed.and.callFake(() => { throw [E.INVALID_FIELDS, 'invalidField'] });

        try {
            await processDocuments([
                d('nf1', 'Feature', 'one')
            ], {}, validator);
            fail();
        } catch (err) {
            expect(err[0]).toEqual(E.INVALID_FIELDS);
            expect(err[1]).toEqual('invalidField');
        }
        done();
    });


    it('duplicate identifiers in import file', async done => {

        try {
            await processDocuments(<any>[
                d('nf1', 'Feature', 'dup', {liesWithin: ['etc1']}),
                d('nf2', 'Feature', 'dup', {liesWithin: ['etc1']}),
            ], {}, validator);
            fail();
        } catch (err) {

            expect(err[0]).toEqual(E.DUPLICATE_IDENTIFIER);
            expect(err[1]).toEqual('dup');
        }
        done();
    });


    it('field is not defined', async done => {

        validator.assertFieldsDefined.and.callFake(() => { throw [E.INVALID_FIELDS]});

        try {
            await processDocuments([
                    d('nfi1', 'Find', 'one', { isChildOf: 'et1'})
                ], {},
                validator);
            fail();
        } catch (err) {

            expect(err[0]).toEqual(E.INVALID_FIELDS);
        }
        done();
    });
});
