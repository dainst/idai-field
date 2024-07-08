import { Document, Relation } from 'idai-field-core';
import { ImportErrors as E } from '../../../../../../src/app/components/import/import/import-errors';
import { createMockValidator, d } from '../helper';
import { processDocuments } from '../../../../../../src/app/components/import/import/process/process-documents';
import { ValidationErrors } from '../../../../../../src/app/model/validation-errors';
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


    test('merge, add field', () => {

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
                geometry: { type: 'Point',  coordinates: [27.189335972070694, 39.14122423529625] }
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


    test('merge, multiple times', () => {

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


    test('validation error - not wellformed', () => {

        validator.assertFieldsDefined.mockImplementation(() => {
            throw [ValidationErrors.MISSING_PROPERTY, 'Feature', 'invalidField'];
        });

        try {
            processDocuments(
                [d('nf1', 'Feature', 'one')], {}, validator, false
            );
            throw new Error('Test failure');
        } catch (err) {
            expect(err[0]).toEqual(ValidationErrors.MISSING_PROPERTY);
            expect(err[1]).toEqual('Feature');
            expect(err[2]).toEqual('invalidField');
        }
    });


    test('validation error - invalid identifier prefix', () => {

        validator.assertIdentifierPrefixIsValid.mockImplementation(() => {
            throw [E.INVALID_IDENTIFIER_PREFIX, 'one', 'Feature', 'F'];
        });

        try {
            processDocuments(
                [d('nf1', 'Feature', 'one')], {}, validator, false
            );
            throw new Error('Test failure');
        } catch (err) {
            expect(err[0]).toEqual(E.INVALID_IDENTIFIER_PREFIX);
            expect(err[1]).toEqual('one');
            expect(err[2]).toEqual('Feature');
            expect(err[3]).toEqual('F');
        }
    });


    test('duplicate identifiers in import file', () => {

        try {
            processDocuments(
                <any>[
                    d('nf1', 'Feature', 'dup', { liesWithin: ['etc1'] }),
                    d('nf2', 'Feature', 'dup', { liesWithin: ['etc1'] }),
                ],
                {}, validator, false
            );
            throw new Error('Test failure');
        } catch (err) {
            expect(err[0]).toEqual(E.DUPLICATE_IDENTIFIER);
            expect(err[1]).toEqual('dup');
        }
    });


    test('report invalid fields', () => {

        validator.assertFieldsDefined.mockImplementation(() => { throw [E.INVALID_FIELDS]; });

        try {
            processDocuments(
                [d('nfi1', 'Find', 'one', { isChildOf: 'et1'})], {}, validator, false
            );
            throw new Error('Test failure');
        } catch (err) {
            expect(err[0]).toEqual(E.INVALID_FIELDS);
        }
    });


    test('ignore invalid fields', () => {

        const document = d('nf1', 'Feature', 'one');
        document.resource.invalidField = 'value';

        validator.getUndefinedFields.mockReturnValue(['invalidField']);

        const result = processDocuments([document], {}, validator, true);

        expect(result[0].resource.invalidField).toBeUndefined();
    });


    test('ignore invalid fields in merge mode', () => {

        const document: Document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                category: 'Feature',
                identifier: 'existingFeature',
                field: 'new',
                id: '1',
                invalidField: 'value',
                relations: {},
                geometry: { type: 'Point',  coordinates: [ 27.189335972070694, 39.14122423529625] }
            }
        };

        validator.getUndefinedFields.mockReturnValue(['invalidField']);

        const result = processDocuments([document], { '1': existingFeature } as any, validator, true);

        expect(result[0].resource.invalidField).toBeUndefined();
    });
});
