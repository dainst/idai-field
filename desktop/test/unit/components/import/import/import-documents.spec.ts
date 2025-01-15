import { identity } from 'tsfun';
import { Resource } from 'idai-field-core';
import { ImportErrors as E, ImportErrors } from '../../../../../src/app/components/import/import/import-errors';
import { buildImportDocuments } from '../../../../../src/app/components/import/import/import-documents';
import { Settings } from '../../../../../src/app/services/settings/settings';
import { ValidationErrors } from '../../../../../src/app/model/validation-errors';
import { createMockValidator } from './helper';


/**
 * @author Daniel de Oliveira
 */
describe('importDocuments', () => {

    let options: any;
    let services: any;
    let helpers: any;
    let context: any;
    let validator;
    let importFunction;
    let operationCategories = ['Trench'];

    const zero = {
        resource: {
            id: '0',
            identifier: '0',
            category: 'Trench',
            relations: {}
        }
    };

    const one = {
        resource: {
            id: '1',
            identifier: 'one',
            category: 'Feature',
            relations: {}
        }
    };

    const two = {
        resource: {
            id: '2',
            identifier: 'two',
            category: 'Feature',
            relations: {}
        }
    };


    beforeEach(() => {

        validator = createMockValidator();
        validator.assertIsRecordedInTargetsExist.mockReturnValue(Promise.resolve());

        services = { validator };

        const find = (_: string) => Promise.resolve(undefined);

        const get = async resourceId => {

            if (resourceId === '0') return zero;
            else throw 'missing';
        };

        context = {
            operationCategories,
            inverseRelationsMap: {},
            settings: { username: 'user1'} as Settings
        };

        helpers = {
            find,
            get,
            generateId: () => '101',
            preprocessDocument: identity,
            postprocessDocument: identity
        };

        options = { mergeMode: false, permitDeletions: false };

        importFunction = buildImportDocuments(
            services,
            context,
            helpers,
            options
        );
    });


    test('should resolve on success', async () => {

        const [_, result] = await importFunction([
            { resource: { category: 'Find', identifier: 'one', relations: { isChildOf: '0'} } }]
        );

        expect(result.createDocuments.length).toBe(1);
    });


    test('merge if exists', async () => {

        validator.assertIsRecordedInTargetsExist.mockReturnValue(Promise.resolve(undefined));
        helpers.find = (_: string) => Promise.resolve(
            { resource: { identifier: '123', id: '1', relations: {} } }
        );
        helpers.get = (_: string) => Promise.resolve(
            { resource: { identifier: '123', id: '1', relations: {} } }
        );

        const [_, result] = await (buildImportDocuments(
            services,
            context,
            helpers,
            { mergeMode: true, useIdentifiersInRelations: true }))(
            [{ resource: { identifier: '123', id: '1', relations: {} } } as any]
        );

        expect(result.createDocuments.length).toBe(0);
        expect(result.updateDocuments.length).toBe(1);
        expect(result.targetDocuments.length).toBe(0);
    });


    test('does not overwrite if exists', async () => {

        const [_1, result] = await (buildImportDocuments(
            services,
            context,
            helpers,
            { mergeMode: false }
        ))([{ resource: { category: 'Find', identifier: 'one', relations: { isChildOf: '0' } } } as any]);

        expect(result.createDocuments.length).toBe(1);
        expect(result.updateDocuments.length).toBe(0);
        expect(result.targetDocuments.length).toBe(0);
    });


    test('not well formed', async () => { // shows that err from default-import-calc gets propagated

        validator.assertIsWellformed.mockImplementation(() => { throw [ImportErrors.INVALID_CATEGORY]; });

        const [error, _] = await importFunction([
            { resource: { category: 'Nonexisting', identifier: '1a', relations: { isChildOf: '0' } } }
        ]);

        expect(error[0]).toEqual(ImportErrors.INVALID_CATEGORY);
    });


    test('missing identifier', async () => {

        validator.assertIsWellformed.mockImplementation(() => {
            throw [ValidationErrors.MISSING_PROPERTY, Resource.IDENTIFIER];
        });

        helpers.find = (identifier: string) => {
            if (!identifier) throw ['Find should not be called with undefined'];
            Promise.resolve(undefined);
        };

        importFunction = buildImportDocuments(
            services,
            context,
            helpers,
            { mergeMode: false, useIdentifiersInRelations: true }
        ); 

        const [error, _] = await importFunction([
            { resource: { category: 'Trench', relations: {} } }
        ]);

        expect(error[0]).toEqual(ValidationErrors.MISSING_PROPERTY);
    });


    test('parent not found', async () => {

        importFunction = buildImportDocuments(
            services,
            context,
            helpers,
            { mergeMode: false, useIdentifiersInRelations: true }
        );

        helpers.find = (_: string) => Promise.resolve(undefined);

        const [error, _] = await importFunction([
            { resource: { category: 'Feature', identifier: '1a', relations: { isChildOf: 'notfound' } } }
        ]);

        expect(error[0]).toEqual(E.PREVALIDATION_MISSING_RELATION_TARGET);
        expect(error[1]).toEqual('notfound');
    });


    test('parent not found, when using plain ids', async () => {

        importFunction = buildImportDocuments(
            services,
            context,
            helpers,
            { mergeMode: false, useIdentifiersInRelations: false }
        );

        helpers.find = (_: string) => Promise.resolve(undefined);

        const [error, _] = await importFunction([
            { resource: { category: 'Feature', identifier: '1a', relations: { isChildOf: 'notfound' } } }
        ]);

        expect(error[0]).toEqual(E.PREVALIDATION_MISSING_RELATION_TARGET);
        expect(error[1]).toEqual('notfound');
    });


    test('isChildOf is an array', async () => {

        const [error, _] = await importFunction([
            { resource: { category: 'Feature', identifier: '1a', relations: { isChildOf: ['a'] } } }
        ]);

        expect(error[0]).toEqual(E.PARENT_MUST_NOT_BE_ARRAY);
        expect(error[1]).toEqual('1a');
    });


    test('other relation is not an array', async () => {

        const [error, _] = await importFunction([
            { resource: { category: 'Feature', identifier: '1a', relations: { isAbove: 'b' } } }
        ]);

        expect(error[0]).toEqual(E.MUST_BE_ARRAY);
        expect(error[1]).toEqual('1a');
    });


    test('fix - don\'t throw with relations pointing to existing resource, with existing resource' , async () => {

        helpers.get = async (resourceId) => {

            if (resourceId === '2') {
                return two;
            } else {
                throw new Error('missing');
            }
        };

        helpers.find = async (identifier) => {

            if (identifier === 'one') {
                return one;
            } else {
                throw new Error('missing');
            }
        };

        context.inverseRelationsMap = { 'isAbove': 'isBelow' };
        options.useIdentifiersInRelations = true;

        const [_, result] = await importFunction([
            { resource: { category: 'Feature', identifier: 'one', relations: { isAbove: ['2'] } } }]);

        expect(result.createDocuments).toEqual([]);
        expect(result.updateDocuments).toEqual([]);
        expect(result.targetDocuments).toEqual([]);
        expect(result.ignoredIdentifiers).toEqual(['one']);
    });


    test('fix - don\'t throw where identifier lookup only was done in import documents' , async () => {

        helpers.get = async (resourceId) => {

            if (resourceId === '2') {
                return two;
            } else {
                throw new Error('missing');
            }
        };

        helpers.find = async (identifier) => {

            if (identifier === 'one') {
                return undefined;
            } else if (identifier === 'two') {
                return two;
            } else {
                throw new Error('missing');
            }
        };

        context.inverseRelationsMap = { 'isAbove': 'isBelow' };
        options.useIdentifiersInRelations = true;

        const [error, result] = await importFunction([
            { resource: { category: 'Feature', identifier: 'one', relations: { isAbove: ['two'] } } }]);

        expect(error).toBe(undefined);
        expect(result.createDocuments.length).toBe(1);
        expect(result.updateDocuments).toEqual([]);
        expect(result.targetDocuments.length).toBe(1);
        expect(result.ignoredIdentifiers).toEqual([]);
    });
});
