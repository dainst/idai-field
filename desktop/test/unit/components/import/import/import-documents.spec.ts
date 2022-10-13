import { identity } from 'tsfun';
import { ImportErrors as E, ImportErrors } from '../../../../../src/app/components/import/import/import-errors';
import { buildImportDocuments } from '../../../../../src/app/components/import/import/import-documents';
import { Settings } from '../../../../../src/app/services/settings/settings';


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

        spyOn(console, 'debug');

        validator = jasmine.createSpyObj('validator', [
            'assertIsRecordedInTargetsExist',
            'assertRelationsWellformedness',
            'assertIsAllowedRelationDomainCategory',
            'assertIsWellformed',
            'assertLiesWithinCorrectness',
            'assertIsKnownCategory',
            'assertFieldsDefined',
            'assertHasLiesWithin',
            'assertIsAllowedCategory',
            'assertDropdownRangeComplete',
            'assertSettingIsRecordedInIsPermissibleForCategory',
            'assertNoForbiddenRelations']);

        validator.assertHasLiesWithin.and.returnValue();
        validator.assertIsRecordedInTargetsExist.and.returnValue(Promise.resolve());

        services = { validator };

        const find  = (_: string) => Promise.resolve(undefined);

        const get = async resourceId => {

            if (resourceId === '0') return zero;
            else throw 'missing';
        };

        context = {
            operationCategories,
            inverseRelationsMap: {},
            sameOperationRelations: [],
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


    it('should resolve on success', async done => {

        const [_, result] = await importFunction([
            { resource: { category: 'Find', identifier: 'one', relations: { isChildOf: '0'} } } as any]
        );

        expect(result.createDocuments.length).toBe(1);
        done();
    });


    it('merge if exists', async done => {

        validator.assertIsRecordedInTargetsExist.and.returnValue(Promise.resolve(undefined));
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
            [{ resource: { id: '1', relations: {} } } as any]);

        expect(result.createDocuments.length).toBe(0);
        expect(result.updateDocuments.length).toBe(1);
        expect(result.targetDocuments.length).toBe(0);
        done();
    });


    it('does not overwrite if exists', async done => {

        const [_1, result] = await (buildImportDocuments(
            services,
            context,
            helpers,
            { mergeMode: false }))

        ([{ resource: { category: 'Find', identifier: 'one', relations: { isChildOf: '0' } } } as any]);

        expect(result.createDocuments.length).toBe(1);
        expect(result.updateDocuments.length).toBe(0);
        expect(result.targetDocuments.length).toBe(0);
        done();
    });


    it('not well formed', async done => { // shows that err from default-import-calc gets propagated

        validator.assertIsWellformed.and.callFake(() => { throw [ImportErrors.INVALID_CATEGORY]});

        const [error, _] = await importFunction([
            { resource: { category: 'Nonexisting', identifier: '1a', relations: { isChildOf: '0' } } } as any
        ]);

        expect(error[0]).toEqual(ImportErrors.INVALID_CATEGORY);
        done();
    });


    it('parent not found', async done => {

        importFunction = buildImportDocuments(
            services,
            context,
            helpers,
            { mergeMode: false, useIdentifiersInRelations: true }); // !

        helpers.find = (_: string) => Promise.resolve(undefined);

        const [error, _] = await importFunction([
            { resource: { category: 'Feature', identifier: '1a', relations: { isChildOf: 'notfound' } } } as any
        ]);

        expect(error[0]).toEqual(E.PREVALIDATION_MISSING_RELATION_TARGET);
        expect(error[1]).toEqual('notfound');
        done();
    });


    it('parent not found, when using plain ids', async done => {

        importFunction = buildImportDocuments(
            services,
            context,
            helpers,
            { mergeMode: false, useIdentifiersInRelations: false}); // !

        helpers.find = (_: string) => Promise.resolve(undefined);

        const [error, _] = await importFunction([
            { resource: { category: 'Feature', identifier: '1a', relations: { isChildOf: 'notfound' } } } as any
        ]);

        expect(error[0]).toEqual(E.PREVALIDATION_MISSING_RELATION_TARGET);
        expect(error[1]).toEqual('notfound');
        done();
    });


    it('isChildOf is an array', async done => {

        const [error, _] = await importFunction([
            { resource: { category: 'Feature', identifier: '1a', relations: { isChildOf: ['a'] } } } as any
        ]);

        expect(error[0]).toEqual(E.PARENT_MUST_NOT_BE_ARRAY);
        expect(error[1]).toEqual('1a');
        done();
    });


    it('other relation is not an array', async done => {

        const [error, _] = await importFunction([
            { resource: { category: 'Feature', identifier: '1a', relations: { isAbove: 'b' } } } as any
        ]);

        expect(error[0]).toEqual(E.MUST_BE_ARRAY);
        expect(error[1]).toEqual('1a');
        done();
    });


    it('fix - don\'t throw with relations pointing to existing resource, with existing resource' , async done => {

        helpers.get = async resourceId => {

            if (resourceId === '2') return two;
            else throw 'missing';
        };

        helpers.find = async identifier => {

            if (identifier === 'one') return one;
            else throw 'missing';
        };

        context.inverseRelationsMap = { 'isAbove': 'isBelow' };
        options.useIdentifiersInRelations = true;

        const [error, result] = await importFunction([
            { resource: { category: 'Feature', identifier: 'one', relations: { isAbove: ['2'] } } }]);

        expect(result.createDocuments).toEqual([]);
        expect(result.updateDocuments).toEqual([]);
        expect(result.targetDocuments).toEqual([]);
        expect(result.ignoredIdentifiers).toEqual(['one']);
        done();
    });


    it('fix - don\'t throw where identifier lookup only was done in import documents' , async done => {

        helpers.get = async resourceId => {

            if (resourceId === '2') return two;
            else throw 'missing';
        };

        helpers.find = async identifier => {

            if (identifier === 'one') return undefined;
            if (identifier === 'two') return two;
            else throw 'missing';
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
        done();
    });
});
