import {ImportErrors as E, ImportErrors} from '../../../../../src/app/core/import/import/import-errors';
import {buildImportFunction} from '../../../../../src/app/core/import/import/import-documents';
import {Settings} from '../../../../../src/app/core/settings/settings';

/**
 * @author Daniel de Oliveira
 */
describe('importDocuments', () => {

    let datastore;
    let validator;
    let importFunction;
    let operationCategoryNames = ['Trench'];


    beforeEach(() => {

        spyOn(console, 'debug');

        datastore = jasmine.createSpyObj('datastore',
            ['bulkCreate', 'bulkUpdate', 'get', 'find']);
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
        datastore.bulkCreate.and.callFake((a) => Promise.resolve(a));
        datastore.bulkUpdate.and.callFake((a) => Promise.resolve(a));
        datastore.find.and.returnValue(Promise.resolve({ totalCount: 0 }));

        datastore.get.and.callFake(async resourceId => {

            if (resourceId === '0') return {
                resource: {
                    id: '0',
                    identifier: '0',
                    category: 'Trench',
                    relations: {}
                }
            };
            else throw 'missing';
        });

        importFunction = buildImportFunction(
            { datastore, validator },
            { operationCategoryNames: operationCategoryNames, inverseRelationsMap: {}, settings: { username: 'user1'} as Settings },
            {
                generateId: () => '101',
                preprocessDocument: undefined,
                postprocessDocument: undefined
            },
            { mergeMode: false, permitDeletions: false });
    });


    it('should resolve on success', async done => {

        await importFunction([
            { resource: { category: 'Find', identifier: 'one', relations: { isChildOf: '0'} } } as any],
            'user1');

        expect(datastore.bulkCreate).toHaveBeenCalled();
        done();
    });


    it('merge if exists', async done => {

        validator.assertIsRecordedInTargetsExist.and.returnValue(Promise.resolve(undefined));
        datastore.find.and.returnValue(Promise.resolve({
            totalCount: 1,
            documents: [{ resource: { identifier: '123', id: '1', relations: {} } }]
        }));
        datastore.get.and.returnValue(Promise.resolve(
            { resource: { identifier: '123', id: '1', relations: {} } }
        ));

        await (buildImportFunction(
            { datastore, validator },
            { operationCategoryNames: operationCategoryNames, inverseRelationsMap: {}, settings: { username: 'user1'} as Settings },
            {
                generateId: () => '101',
                preprocessDocument: undefined,
                postprocessDocument: undefined
            },
            { mergeMode: true }))(
            [{ resource: { id: '1', relations: {} } } as any]);

        expect(datastore.bulkCreate).not.toHaveBeenCalled();
        expect(datastore.bulkUpdate).toHaveBeenCalled();
        done();
    });


    it('does not overwrite if exists', async done => {

        await (buildImportFunction(
            { datastore, validator },
            {
                operationCategoryNames: operationCategoryNames,
                inverseRelationsMap: {},
                settings: { username: 'user1'} as Settings
            },
            {
                generateId: () => '101',
                preprocessDocument: undefined,
                postprocessDocument: undefined
            },
            { mergeMode: false }))

        ([{ resource: { category: 'Find', identifier: 'one', relations: { isChildOf: '0' } } } as any]);

        expect(datastore.bulkCreate).toHaveBeenCalled();
        expect(datastore.bulkUpdate).not.toHaveBeenCalled();
        done();
    });


    it('should reject on err in datastore', async done => {

        datastore.bulkCreate.and.returnValue(Promise.reject(['abc']));

        const {errors} = await importFunction(
            [{ resource: { category: 'Find', identifier: 'one', relations: { isChildOf: '0' } } } as any],
            datastore, 'user1');

        expect(errors[0][0]).toBe('abc');
        done();
    });


    it('not well formed', async done => { // shows that err from default-import-calc gets propagated

        validator.assertIsWellformed.and.callFake(() => { throw [ImportErrors.INVALID_CATEGORY]});

        const {errors} = await importFunction([
            { resource: { category: 'Nonexisting', identifier: '1a', relations: { isChildOf: '0' } } } as any
        ], datastore, 'user1');

        expect(errors.length).toBe(1);
        expect(errors[0][0]).toEqual(ImportErrors.INVALID_CATEGORY);
        done();
    });


    it('parent not found', async done => {

        importFunction = buildImportFunction(
            { datastore, validator },
            {
                operationCategoryNames: operationCategoryNames,
                inverseRelationsMap: {},
                settings: { username: 'user1'} as Settings
            },
            {
                generateId: () => '101',
                preprocessDocument: undefined,
                postprocessDocument: undefined
            },
            { mergeMode: false, useIdentifiersInRelations: true }); // !

        datastore.find.and.returnValue(Promise.resolve({ totalCount: 0 }));

        const {errors} = await importFunction([
            { resource: { category: 'Feature', identifier: '1a', relations: { isChildOf: 'notfound' } } } as any
        ]);

        expect(errors[0][0]).toEqual(E.PREVALIDATION_MISSING_RELATION_TARGET);
        expect(errors[0][1]).toEqual('notfound');
        done();
    });


    it('parent not found, when using plain ids', async done => {

        importFunction = buildImportFunction(
            { datastore, validator },
            {
                operationCategoryNames: operationCategoryNames,
                inverseRelationsMap: {},
                settings: { username: 'user1'} as Settings
            },
            {
                generateId: () => '101',
                preprocessDocument: undefined,
                postprocessDocument: undefined
            },
            { mergeMode: false, useIdentifiersInRelations: false}); // !

        datastore.find.and.returnValue(Promise.resolve({ totalCount: 0 }));

        const {errors} = await importFunction([
            { resource: { category: 'Feature', identifier: '1a', relations: { isChildOf: 'notfound' } } } as any
        ]);

        expect(errors[0][0]).toEqual(E.PREVALIDATION_MISSING_RELATION_TARGET);
        expect(errors[0][1]).toEqual('notfound');
        done();
    });


    it('isChildOf is an array', async done => {

        const {errors} = await importFunction([
            { resource: { category: 'Feature', identifier: '1a', relations: { isChildOf: ['a'] } } } as any
        ]);

        expect(errors[0][0]).toEqual(E.PARENT_MUST_NOT_BE_ARRAY);
        expect(errors[0][1]).toEqual('1a');
        done();
    });


    it('other relation is not an array', async done => {

        const {errors} = await importFunction([
            { resource: { category: 'Feature', identifier: '1a', relations: { isAbove: 'b' } } } as any
        ]);

        expect(errors[0][0]).toEqual(E.MUST_BE_ARRAY);
        expect(errors[0][1]).toEqual('1a');
        done();
    });


    it('forbidden hierarchical relation', async done => {

        const {errors} = await importFunction([
            { resource: { category: 'Feature', identifier: '1a', relations: { isRecordedIn: ['a'] } } } as any
        ]);

        expect(errors[0][0]).toEqual(E.INVALID_RELATIONS);
        expect(errors[0][2]).toEqual('isRecordedIn');
        done();
    });
});
