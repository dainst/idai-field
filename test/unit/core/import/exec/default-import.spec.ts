import {ImportErrors} from '../../../../../app/core/import/exec/import-errors';
import {DefaultImport} from '../../../../../app/core/import/exec/default-import';

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
            'assertIsRecordedInTargetsExist', 'assertIsWellformed',
            'assertIsKnownType', 'assertHasLiesWithin', 'assertIsAllowedType',
            'assertSettingIsRecordedInIsPermissibleForType', 'assertNoForbiddenRelations']);

        mockValidator.assertHasLiesWithin.and.returnValue();

        mockValidator.assertIsRecordedInTargetsExist.and.returnValue(Promise.resolve());
        mockDatastore.bulkCreate.and.callFake((a) => Promise.resolve(a));
        mockDatastore.bulkUpdate.and.callFake((a) => Promise.resolve(a));
        mockDatastore.find.and.returnValue(Promise.resolve({ totalCount: 0 }));

        mockDatastore.get.and.callFake(async resourceId => {

            if (resourceId === '0') return { resource: { id: '0', identifier: '0', type: 'Trench' }};
            else throw 'missing';
        });

        importFunction = DefaultImport.build(
            mockValidator, operationTypeNames,
            () => undefined,
            () => '101');
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
            documents: [{ resource: { identifier: '123', id: '1' } }]
        }));

        const res = await (DefaultImport.build(
            mockValidator, operationTypeNames,
            () => undefined,
             () => '101', true) as any)(
            [{ resource: { id: '1', relations: undefined } } as any], mockDatastore, 'user1');

        expect(mockDatastore.bulkCreate).not.toHaveBeenCalled();
        expect(mockDatastore.bulkUpdate).toHaveBeenCalled();
        done();
    });


    it('does not overwrite if exists', async done => {

        // TODO The test runs without this. Check again how the test works.
        mockDatastore.get.and.returnValue(Promise.resolve(
            { resource: { id: '0', identifier: '0', type: 'Trench' }})
        );

        await (DefaultImport.build(
            mockValidator, operationTypeNames,
            () => undefined,
            () => '101', false) as any)([
                { resource: { type: 'Find', identifier: 'one', relations: { isChildOf: '0' } } } as any],
                mockDatastore,'user1');

        expect(mockDatastore.bulkCreate).toHaveBeenCalled();
        expect(mockDatastore.bulkUpdate).not.toHaveBeenCalled();
        done();
    });


    it('should reject on err in datastore', async done => {

        mockDatastore.bulkCreate.and.returnValue(Promise.reject(['abc']));

        const {errors} = await importFunction(
            [{ resource: { type: 'Find', identifier: 'one', relations: { isChildOf: '0' } } } as any],
            mockDatastore,'user1');

        expect(errors[0][0]).toBe('abc');
        done();
    });


    it('not well formed ', async done => {

        mockValidator.assertIsWellformed.and.callFake(() => { throw [ImportErrors.INVALID_TYPE]});

        const {errors} = await importFunction([
            { resource: { type: 'Nonexisting', identifier: '1a', relations: { isChildOf: '0' } } } as any
        ], mockDatastore, 'user1');

        expect(errors.length).toBe(1);
        expect(errors[0][0]).toEqual(ImportErrors.INVALID_TYPE);
        done();
    });


    // TODO test in general that err from default import calc gets propagated
});