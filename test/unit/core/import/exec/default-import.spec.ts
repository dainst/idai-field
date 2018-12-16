import {ImportErrors} from '../../../../../app/core/import/exec/import-errors';
import {DefaultImport} from '../../../../../app/core/import/exec/default-import';

/**
 * @author Daniel de Oliveira
 */
describe('DefaultImport', () => {

    let mockDatastore;
    let mockValidator;
    let mockProjectConfiguration;
    let importFunction;


    beforeEach(() => {

        mockDatastore = jasmine.createSpyObj('datastore', ['create', 'update', 'get', 'find']);
        mockValidator = jasmine.createSpyObj('validator', [
            'assertIsRecordedInTargetsExist', 'assertIsWellformed',
            'assertIsKnownType', 'assertHasIsRecordedIn', 'assertIsAllowedType',
            'assertSettingIsRecordedInIsPermissibleForType']);

        mockProjectConfiguration = jasmine.createSpyObj('projectConfiguration',
            ['getTypesList', 'getFieldDefinitions', 'getInverseRelations',
                'getRelationDefinitions', 'isMandatory', 'isRelationProperty']);
        mockProjectConfiguration.getFieldDefinitions.and.returnValue([{name: 'id'}, {name: 'type'}, {name: 'identifier'}, {name: 'geometry'}, {name: 'shortDescription'}]);
        mockProjectConfiguration.getRelationDefinitions.and.returnValue([{name: 'isRecordedIn'}]);

        mockValidator.assertHasIsRecordedIn.and.returnValue();

        mockValidator.assertIsRecordedInTargetsExist.and.returnValue(Promise.resolve());
        mockDatastore.create.and.callFake((a) => Promise.resolve(a));
        mockDatastore.update.and.callFake((a) => Promise.resolve(a));
        mockDatastore.find.and.returnValue(Promise.resolve({ totalCount: 0 }));
        mockProjectConfiguration.getTypesList.and.returnValue(
            [{name: 'Find'}, {name: 'Place'}, {name: 'Trench'}, {name: 'Feature'}]);

        importFunction = DefaultImport.build(
            mockValidator,
            mockProjectConfiguration,
            () => '101');
    });


    it('should resolve on success', async done => {

        await importFunction([
            { resource: {type: 'Find', identifier: 'one', relations: { isRecordedIn: ['0']} } } as any],
            mockDatastore, 'user1');

        expect(mockDatastore.create).toHaveBeenCalled();
        done();
    });


    it('merge if exists', async done => {

        mockValidator.assertIsRecordedInTargetsExist.and.returnValue(Promise.resolve(undefined));
        mockDatastore.find.and.returnValue(Promise.resolve({
            totalCount: 1,
            documents: [{resource: {identifier: '123', id: '1'}}]
        }));

        await (DefaultImport.build(
            mockValidator,
            mockProjectConfiguration,
             () => '101', true) as any)(
            [{ resource: {id: '1', relations: undefined } } as any], mockDatastore,'user1');

        expect(mockDatastore.create).not.toHaveBeenCalled();
        expect(mockDatastore.update).toHaveBeenCalled();
        done();
    });


    it('does not overwrite if exists', async done => {

        mockDatastore.get.and.returnValue(Promise.resolve({}));

        await (DefaultImport.build(
            mockValidator,
            mockProjectConfiguration,
            () => '101', false) as any)([
                { resource: {type: 'Find', identifier: 'one', relations: {isRecordedIn: ['0']} } } as any],
                mockDatastore,'user1');

        expect(mockDatastore.create).toHaveBeenCalled();
        expect(mockDatastore.update).not.toHaveBeenCalled();
        done();
    });


    it('should reject on err in datastore', async done => {

        mockDatastore.create.and.returnValue(Promise.reject(['abc']));

        const {errors} = await importFunction(
            [{resource: {type: 'Find', identifier: 'one', relations: {isRecordedIn: ['0']}}} as any],
            mockDatastore,'user1');

        expect(errors[0][0]).toBe('abc');
        done();
    });


    it('merge geometry', async done => {

        const originalDoc = { resource: { id: '1', identifier: 'i1', shortDescription: 'sd1', relations: {}}};
        const docToMerge = { resource: { geometry: { type: 'Point',  coordinates: [ 27.189335972070694, 39.14122423529625]}}};


        mockValidator = jasmine.createSpyObj('validator', ['assertIsWellformed']);

        mockDatastore = jasmine.createSpyObj('datastore', ['find','update']);
        mockDatastore.find.and.returnValues(Promise.resolve({ documents: [originalDoc], totalCount: 1 }));
        mockDatastore.update.and.returnValues(Promise.resolve());

        importFunction = DefaultImport.build(
            mockValidator,
            mockProjectConfiguration,
            () => '101', true);

        await importFunction([docToMerge as any], mockDatastore, 'user1');

        const importedDoc = mockDatastore.update.calls.mostRecent().args[0];
        expect(importedDoc.resource).toEqual({
            id: '1',
            identifier: 'i1',
            shortDescription: 'sd1',
            geometry: { type: 'Point', coordinates: [ 27.189335972070694, 39.14122423529625] }, // merged from docToMerge
            relations: {}
        });
        done();
    });


    it('rewrite identifiers to ids in relations', async done => {

        importFunction = DefaultImport.build(
            mockValidator,
            mockProjectConfiguration,

             () => '101', false,  false, '', true);

        const docToImport = { resource: { type: 'Find', identifier: '1a',
                relations: { isRecordedIn: ['three'] } } };

        mockDatastore.find.and.returnValue(
            Promise.resolve({ documents: [{ resource: { id: '3' }}], totalCount: 1 }));
        await importFunction([ docToImport as any ],
            mockDatastore,'user1');

        expect(docToImport.resource.relations.isRecordedIn[0]).toEqual('3');
        done();
    });


    it('rewrite identifiers to ids in relations - relation target not found', async done => {

        importFunction = DefaultImport.build(
            mockValidator,
            mockProjectConfiguration,
             () => '101', false, false, '', true);

        const docToImport = { resource: { type: 'Find', identifier: '1a',
                relations: { isRecordedIn: ['three'] } } };

        mockDatastore.find.and.returnValues(
            Promise.resolve({ totalCount: 0 }));
        const {errors} = await importFunction([ docToImport as any ], mockDatastore,'user1');

        expect(errors[0][0]).toEqual(ImportErrors.MISSING_RELATION_TARGET);
        done();
    });


    it('preValidate - not well formed ', async done => {

        mockValidator.assertIsWellformed.and.callFake(() => { throw [ImportErrors.INVALID_TYPE]});

        const {errors} = await importFunction([
            { resource: { type: 'Nonexisting', identifier: '1a', relations: { isRecordedIn: ['0'] } } } as any
        ], mockDatastore, 'user1');

        expect(errors.length).toBe(1);
        expect(errors[0][0]).toEqual(ImportErrors.INVALID_TYPE);
        done();
    });



    it('preValidate - duplicate identifiers in import file', async done => {

        mockDatastore.find.and.returnValues(Promise.resolve({ documents: [], totalCount: 0 }));

        const {errors} = await importFunction([
            { resource: { type: 'Place', identifier: '1a' } } as any,
            { resource: { type: 'Trench', identifier: '1a' } } as any
        ], mockDatastore, 'user1');

        expect(errors.length).toBe(1);
        expect(errors[0][0]).toEqual(ImportErrors.DUPLICATE_IDENTIFIER);
        expect(errors[0][1]).toEqual('1a');
        done();
    });


    it('preValidate - existing identifier', async done => {

        mockDatastore.find.and.returnValues(Promise.resolve(
            { documents: [{ resource: { type: 'Place', identifier: '1a'} }], totalCount: 1 }));

        const {errors} = await importFunction([
            { resource: { type: 'Place', identifier: '1a', relations: { isRecordedIn: {}}} } as any
        ], mockDatastore, 'user1');

        expect(errors.length).toBe(1);
        expect(errors[0][0]).toEqual(ImportErrors.RESOURCE_EXISTS);
        expect(errors[0][1]).toEqual('1a');
        done();
    });


    it('set liesWithin which clashes with isRecordedIn', async done => {

        // TR1 trench1
        // - FE1 feature1
        // TR2 trench2
        // - FE2 feature2

        mockDatastore.get.and.returnValue(Promise.resolve(
            { resource: { type: 'FE1', identifier: 'feature1', relations: { isRecordedIn: ['TR1']}} } as any));

        const {errors} = await importFunction([
            { resource: { type: 'Find', identifier: 'find1', relations: { isRecordedIn: ['TR2'], liesWithin: ['FE1']}} } as any
        ], mockDatastore, 'user1');

        expect(errors.length).toBe(1);
        expect(errors[0][0]).toEqual(ImportErrors.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN);
        expect(errors[0][1]).toEqual('find1');
        done();
    });


    it('set liesWithin which clashes with isRecordedIn in merge mode with overwrite relations', async done => {

        // TR1 trench1
        // - FE1 feature1
        // TR2 trench2
        // - FE2 feature2

        importFunction = DefaultImport.build(
            mockValidator,
            mockProjectConfiguration,
            () => '101', true, true);

        mockDatastore.find.and.returnValues(Promise.resolve( // update target
            { documents: [{ resource: { type: 'Find', identifier: 'find1', relations: {isRecordedIn: ['TR2']} }}], totalCount: 1 }));
        mockDatastore.get.and.returnValue(Promise.resolve(
            { resource: { type: 'FE1', identifier: 'feature1', relations: { isRecordedIn: ['TR1']}} } as any));

        const {errors} = await importFunction([
            { resource: { type: 'Find', identifier: 'find1', relations: { liesWithin: ['FE1']}} } as any
        ], mockDatastore, 'user1');

        expect(errors.length).toBe(1);
        expect(errors[0][0]).toEqual(ImportErrors.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN);
        expect(errors[0][1]).toEqual('find1');
        done();
    });
});