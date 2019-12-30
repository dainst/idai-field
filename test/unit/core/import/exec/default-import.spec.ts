import {ImportErrors as E, ImportErrors} from '../../../../../app/core/import/exec/import-errors';
import {buildImportFunction} from '../../../../../app/core/import/exec/default-import';

/**
 * @author Daniel de Oliveira
 */
describe('DefaultImport', () => {

    let mockDatastore;
    let mockValidator;
    let importFunction;
    let operationTypeNames = ['Trench'];


    beforeEach(() => {
        mockDatastore = jasmine.createSpyObj('datastore',
            ['bulkCreate', 'bulkUpdate', 'get', 'find']);
        mockValidator = jasmine.createSpyObj('validator', [
            'assertIsRecordedInTargetsExist',
            'assertRelationsWellformedness',
            'assertIsAllowedRelationDomainType',
            'assertIsWellformed',
            'assertLiesWithinCorrectness',
            'assertIsKnownType',
            'assertFieldsDefined',
            'assertHasLiesWithin',
            'assertIsAllowedType',
            'assertDropdownRangeComplete',
            'assertSettingIsRecordedInIsPermissibleForType',
            'assertNoForbiddenRelations']);

        mockValidator.assertHasLiesWithin.and.returnValue();

        mockValidator.assertIsRecordedInTargetsExist.and.returnValue(Promise.resolve());
        mockDatastore.bulkCreate.and.callFake((a) => Promise.resolve(a));
        mockDatastore.bulkUpdate.and.callFake((a) => Promise.resolve(a));
        mockDatastore.find.and.returnValue(Promise.resolve({ totalCount: 0 }));

        mockDatastore.get.and.callFake(async resourceId => {

            if (resourceId === '0') return {
                resource: {
                    id: '0',
                    identifier: '0',
                    type: 'Trench',
                    relations: {}
                }
            };
            else throw 'missing';
        });

        importFunction = buildImportFunction(
            mockValidator,
            operationTypeNames,
            {},
            () => '101',
            undefined,
            { mergeMode: false, permitDeletions: false });
    });


    it('should resolve on success', async done => {

        await importFunction([
            { resource: { type: 'Find', identifier: 'one', relations: { isChildOf: '0'} } } as any],
            mockDatastore, 'user1');

        expect(mockDatastore.bulkCreate).toHaveBeenCalled();
        done();
    });


    it('merge if exists', async done => {

        mockValidator.assertIsRecordedInTargetsExist.and.returnValue(Promise.resolve(undefined));
        mockDatastore.find.and.returnValue(Promise.resolve({
            totalCount: 1,
            documents: [{ resource: { identifier: '123', id: '1', relations: {} } }]
        }));
        mockDatastore.get.and.returnValue(Promise.resolve(
            { resource: { identifier: '123', id: '1', relations: {} } }
        ));

        await (buildImportFunction(
            mockValidator,
            operationTypeNames,
            {},
            () => '101', undefined,
            { mergeMode: true }))(
            [{ resource: { id: '1', relations: {} } } as any],
            mockDatastore,
            'user1');

        expect(mockDatastore.bulkCreate).not.toHaveBeenCalled();
        expect(mockDatastore.bulkUpdate).toHaveBeenCalled();
        done();
    });


    it('does not overwrite if exists', async done => {

        await (buildImportFunction(
            mockValidator, operationTypeNames,
            {},
            () => '101', undefined, { mergeMode: false }))([
                { resource: { type: 'Find', identifier: 'one', relations: { isChildOf: '0' } } } as any],
                mockDatastore, 'user1');

        expect(mockDatastore.bulkCreate).toHaveBeenCalled();
        expect(mockDatastore.bulkUpdate).not.toHaveBeenCalled();
        done();
    });


    it('should reject on err in datastore', async done => {

        mockDatastore.bulkCreate.and.returnValue(Promise.reject(['abc']));

        const {errors} = await importFunction(
            [{ resource: { type: 'Find', identifier: 'one', relations: { isChildOf: '0' } } } as any],
            mockDatastore, 'user1');

        expect(errors[0][0]).toBe('abc');
        done();
    });


    it('not well formed', async done => { // shows that err from default-import-calc gets propagated

        mockValidator.assertIsWellformed.and.callFake(() => { throw [ImportErrors.INVALID_TYPE]});

        const {errors} = await importFunction([
            { resource: { type: 'Nonexisting', identifier: '1a', relations: { isChildOf: '0' } } } as any
        ], mockDatastore, 'user1');

        expect(errors.length).toBe(1);
        expect(errors[0][0]).toEqual(ImportErrors.INVALID_TYPE);
        done();
    });


    it('parent not found', async done => {

        importFunction = buildImportFunction(
            mockValidator,
            operationTypeNames,
            {},
            () => '101', undefined,
            { mergeMode: false, useIdentifiersInRelations: true }); // !

        mockDatastore.find.and.returnValue(Promise.resolve({ totalCount: 0 }));

        const {errors} = await importFunction([
            { resource: { type: 'Feature', identifier: '1a', relations: { isChildOf: 'notfound' } } } as any
        ], mockDatastore, 'user1');

        expect(errors[0][0]).toEqual(E.MISSING_RELATION_TARGET);
        expect(errors[0][1]).toEqual('notfound');
        done();
    });


    it('parent not found, when using plain ids', async done => {

        importFunction = buildImportFunction(
            mockValidator,
            operationTypeNames,
            {},
            () => '101',
            undefined,
            { mergeMode: false, useIdentifiersInRelations: false}); // !

        mockDatastore.find.and.returnValue(Promise.resolve({ totalCount: 0 }));

        const {errors} = await importFunction([
            { resource: { type: 'Feature', identifier: '1a', relations: { isChildOf: 'notfound' } } } as any
        ], mockDatastore, 'user1');

        expect(errors[0][0]).toEqual(E.MISSING_RELATION_TARGET);
        expect(errors[0][1]).toEqual('notfound');
        done();
    });


    it('isChildOf is an array', async done => {

        const {errors} = await importFunction([
            { resource: { type: 'Feature', identifier: '1a', relations: { isChildOf: ['a'] } } } as any
        ], mockDatastore, 'user1');

        expect(errors[0][0]).toEqual(E.PARENT_MUST_NOT_BE_ARRAY);
        expect(errors[0][1]).toEqual('1a');
        done();
    });


    it('other relation is not an array', async done => {

        const {errors} = await importFunction([
            { resource: { type: 'Feature', identifier: '1a', relations: { isAbove: 'b' } } } as any
        ], mockDatastore, 'user1');

        expect(errors[0][0]).toEqual(E.MUST_BE_ARRAY);
        expect(errors[0][1]).toEqual('1a');
        done();
    });


    it('forbidden relation', async done => {

        const {errors} = await importFunction([
            { resource: { type: 'Feature', identifier: '1a', relations: { includes: ['a'] } } } as any
        ], mockDatastore, 'user1');

        expect(errors[0][0]).toEqual(E.INVALID_RELATIONS);
        expect(errors[0][2]).toEqual('includes');
        done();
    });
});