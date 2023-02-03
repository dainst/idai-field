import { Document, Relation } from 'idai-field-core';
import { ImportErrors as E } from '../../../../../../src/app/components/import/import/import-errors';
import { createMockValidator, d } from '../helper';
import { processDocuments } from '../../../../../../src/app/components/import/import/process/process-documents';
import RECORDED_IN = Relation.Hierarchy.RECORDEDIN;


describe('processDocuments', () => {

    let validator;

    const existingFeature = {
        resource: {
            category: 'Feature',
            identifier: 'existingFeature',
            id: 'ef1',
            relations: { isRecordedIn: ['et1'] }
        }
    };


    beforeEach(() => {

        validator = createMockValidator();
    });


    it('merge, add field', () => {

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

        const result = processDocuments(
            [document],
            { '1': existingFeature } as any,
            validator,
            false
        );

        const resource = result[0].resource;
        expect(resource.id).toBe('ef1');
        expect(resource.relations[RECORDED_IN][0]).toEqual('et1');
        expect(resource['field']).toEqual('new');
        expect(resource['geometry']).toEqual({ type: 'Point', coordinates: [ 27.189335972070694, 39.14122423529625] });
    });


    it('merge, multiple times', () => {

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

        const result = processDocuments(
            [document1, document2],
            { 'ef1': existingFeature } as any,
            validator,
            false
        );

        const resource = result[0].resource;
        expect(resource.id).toBe('ef1');
        expect(resource['field1']).toEqual('new1');
        expect(resource['field2']).toEqual('new2');
        expect(resource['shortDescription']).toEqual('sd2');
    });


    // err cases /////////////////////////////////////////////////////////////////////////////////////////////

    it('validation error - report invalid fields', () => {

        validator.assertFieldsDefined.and.callFake(() => { throw [E.INVALID_FIELDS, 'invalidField'] });

        try {
            processDocuments([
                d('nf1', 'Feature', 'one')
            ], {}, validator, false);
            fail();
        } catch (err) {
            expect(err[0]).toEqual(E.INVALID_FIELDS);
            expect(err[1]).toEqual('invalidField');
        }
    });


    it('validation error - invalid identifier prefix', () => {

        validator.assertIdentifierPrefixIsValid.and.callFake(() => { throw [E.INVALID_IDENTIFIER_PREFIX, 'one', 'Feature', 'F'] });

        try {
            processDocuments([
                d('nf1', 'Feature', 'one')
            ], {}, validator, false);
            fail();
        } catch (err) {
            expect(err[0]).toEqual(E.INVALID_IDENTIFIER_PREFIX);
            expect(err[1]).toEqual('one');
            expect(err[2]).toEqual('Feature');
            expect(err[3]).toEqual('F');
        }
    });


    it('duplicate identifiers in import file', () => {

        try {
            processDocuments(<any>[
                d('nf1', 'Feature', 'dup', {liesWithin: ['etc1']}),
                d('nf2', 'Feature', 'dup', {liesWithin: ['etc1']}),
            ], {}, validator, false);
            fail();
        } catch (err) {
            expect(err[0]).toEqual(E.DUPLICATE_IDENTIFIER);
            expect(err[1]).toEqual('dup');
        }
    });


    it('field is not defined', () => {

        validator.assertFieldsDefined.and.callFake(() => { throw [E.INVALID_FIELDS]});

        try {
            processDocuments([
                    d('nfi1', 'Find', 'one', { isChildOf: 'et1'})
                ], {},
                validator, false);
            fail();
        } catch (err) {
            expect(err[0]).toEqual(E.INVALID_FIELDS);
        }
    });
});
