import { Document, Relation } from 'idai-field-core';
import { ImportErrors as E } from '../../../../../../src/app/components/import/import/import-errors';
import { createMockValidator, d } from '../helper';
import { processDocuments } from '../../../../../../src/app/components/import/import/process/process-documents';
import RECORDED_IN = Relation.Hierarchy.RECORDEDIN;


describe('processDocuments', () => {

    let validator;

    const existingFeature = {resource: { category: 'Feature', identifier: 'existingFeature', id: 'ef1', relations: { isRecordedIn: ['et1'] } } };

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


    it('validation error - invalid identifier prefix', async done => {

        validator.assertIdentifierPrefixIsValid.and.callFake(() => { throw [E.INVALID_IDENTIFIER_PREFIX, 'one', 'Feature', 'F'] });

        try {
            await processDocuments([
                d('nf1', 'Feature', 'one')
            ], {}, validator);
            fail();
        } catch (err) {
            expect(err[0]).toEqual(E.INVALID_IDENTIFIER_PREFIX);
            expect(err[1]).toEqual('one');
            expect(err[2]).toEqual('Feature');
            expect(err[3]).toEqual('F');
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
