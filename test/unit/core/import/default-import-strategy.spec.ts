import {DefaultImportStrategy} from '../../../../app/core/import/default-import-strategy';
import {ImportErrors} from '../../../../app/core/import/import-errors';
import {ValidationErrors} from '../../../../app/core/model/validation-errors';

/**
 * @author Daniel de Oliveira
 */
describe('DefaultImportStrategy', () => {

    let mockDatastore;
    let mockValidator;
    let mockProjectConfiguration;
    let mockTypeUtility;
    let importStrategy: DefaultImportStrategy;
    let importReport;


    beforeEach(() => {

        mockDatastore = jasmine.createSpyObj('datastore', ['create', 'update', 'get', 'find']);
        mockValidator = jasmine.createSpyObj('validator', ['assertIsRecordedInTargetsExists', 'assertIsWellformed']);

        mockProjectConfiguration = jasmine.createSpyObj('projectConfiguration', ['getTypesList']);

        mockTypeUtility = { isSubtype: (t: string) => t === 'Trench' };

        mockValidator.assertIsRecordedInTargetsExists.and.returnValue(Promise.resolve());
        mockDatastore.create.and.callFake((a) => Promise.resolve(a));
        mockDatastore.update.and.callFake((a) => Promise.resolve(a));
        mockDatastore.find.and.returnValue(Promise.resolve({ totalCount: 0 }));
        mockProjectConfiguration.getTypesList.and.returnValue(
            [{name: 'Find'}, {name: 'Place'}, {name: 'Trench'}]);

        importStrategy = new DefaultImportStrategy(
            mockTypeUtility,
            mockValidator,
            mockDatastore,
            mockProjectConfiguration,
            'user1',
            '',
            false, false, false);

        importReport = {errors: [], warnings: [], importedResourcesIds: []};
    });


    it('should resolve on success', async done => {

        importReport = await importStrategy.import([
            { resource: {type: 'Find', identifier: 'one', relations: {isRecordedIn: []} } } as any], importReport);

        expect(mockDatastore.create).toHaveBeenCalled();
        done();
    });


    it('merge if exists', async done => {

        mockValidator.assertIsRecordedInTargetsExists.and.returnValue(Promise.resolve(undefined));
        mockDatastore.find.and.returnValue(Promise.resolve({
            totalCount: 1,
            documents: [{resource: {identifier: '123', id: '1'}}]
        }));

        const importReport = {errors: [], warnings: [], importedResourcesIds: []};

        await new DefaultImportStrategy(
            mockTypeUtility,
            mockValidator,
            mockDatastore,
            null,
            'user1',
            '', true, false, false).import(
            [{ resource: {id: '1', relations: undefined } } as any], importReport);

        expect(mockDatastore.create).not.toHaveBeenCalled();
        expect(mockDatastore.update).toHaveBeenCalled();
        done();
    });


    it('does not overwrite if exists', async done => {

        mockDatastore.get.and.returnValue(Promise.resolve({}));

        await new DefaultImportStrategy(
            mockTypeUtility,
            mockValidator,
            mockDatastore,
            mockProjectConfiguration,
            'user1',
            '', false, false, false).import([
            { resource: {type: 'Find', identifier: 'one', relations: {isRecordedIn: []} } } as any], importReport);

        expect(mockDatastore.create).toHaveBeenCalled();
        expect(mockDatastore.update).not.toHaveBeenCalled();
        done();
    });



    it('should reject on err in validator', async done => {

        mockValidator.assertIsWellformed.and.callFake(() => {throw ['abc']});

        importReport = await importStrategy.import([
            {resource: {type: 'Find', identifier: 'one', relations: {isRecordedIn: []}}} as any], importReport);
        expect(importReport.errors[0][0]).toBe('abc');
        done();
    });


    it('should reject on err in datastore', async done => {

        mockDatastore.create.and.returnValue(Promise.reject(['abc']));

        importReport = await importStrategy.import(
            [{resource: {type: 'Find', identifier: 'one', relations: {isRecordedIn: []}}} as any], importReport);

        expect(importReport.errors[0][0]).toBe('abc');
        done();
    });


    it('merge geometry', async done => {

        const originalDoc = { resource: { id: '1', identifier: 'i1', shortDescription: 'sd1', relations: {}}};
        const docToMerge = { resource: { geometry: { a: 'b' }}};

        mockValidator = jasmine.createSpyObj('validator', ['assertIsWellformed']);

        mockDatastore = jasmine.createSpyObj('datastore', ['find','update']);
        mockDatastore.find.and.returnValues(Promise.resolve({ documents: [originalDoc], totalCount: 1 }));
        mockDatastore.update.and.returnValues(Promise.resolve());

        importStrategy = new DefaultImportStrategy(
            mockTypeUtility,
            mockValidator,
            mockDatastore,
            null,
            'user1',
            '', true, false, false);
        await importStrategy.import([docToMerge as any], {errors: [], warnings: [], importedResourcesIds: []});

        const importedDoc = mockDatastore.update.calls.mostRecent().args[0];
        expect(importedDoc.resource).toEqual({
            id: '1',
            identifier: 'i1',
            shortDescription: 'sd1',
            geometry: { a: 'b' }, // merged from docToMerge
            relations: {}
        });
        done();
    });


    it('rewrite identifiers to ids in relations', async done => {

        importStrategy = new DefaultImportStrategy(
            mockTypeUtility,
            mockValidator,
            mockDatastore,
            mockProjectConfiguration,
            'user1',
            '',
            false,
            true, false);

        const docToImport = { resource: { type: 'Find', identifier: '1a',
                relations: { isRecordedIn: ['three'] } } };

        mockDatastore.find.and.returnValue(
            Promise.resolve({ documents: [{ resource: { id: '3' }}], totalCount: 1 }));
        importReport = await importStrategy.import([ docToImport as any ], importReport);

        expect(docToImport.resource.relations.isRecordedIn[0]).toEqual('3');
        done();
    });


    it('rewrite identifiers to ids in relations - relation target not found', async done => { // TODO replace later with preValidation

        importStrategy = new DefaultImportStrategy(
            mockTypeUtility,
            mockValidator,
            mockDatastore,
            mockProjectConfiguration,
            'user1',
            '',
            false,
            true, false);

        const docToImport = { resource: { type: 'Find', identifier: '1a',
                relations: { isRecordedIn: ['three'] } } };

        mockDatastore.find.and.returnValues(
            Promise.resolve({ totalCount: 0 }));
        importReport = await importStrategy.import([ docToImport as any ], importReport);

        expect(importReport.errors[0][0]).toEqual(ImportErrors.MISSING_RELATION_TARGET);
        done();
    });


    it('preValidate - not well formed ', async done => {

        mockValidator.assertIsWellformed.and.callFake(() => { throw [ValidationErrors.INVALID_TYPE]});

        importReport = await importStrategy.import([
            { resource: { type: 'Nonexisting', identifier: '1a', relations: { isRecordedIn: ['0'] } } } as any
        ], importReport);

        expect(importReport.errors.length).toBe(1);
        expect(importReport.errors[0][0]).toEqual(ValidationErrors.INVALID_TYPE);
        done();
    });



    it('preValidate - duplicate identifiers in import file', async done => {

        mockDatastore.find.and.returnValues(Promise.resolve({ documents: [], totalCount: 0 }));

        importReport = await importStrategy.import([
            { resource: { type: 'Place', identifier: '1a' } } as any,
            { resource: { type: 'Trench', identifier: '1a' } } as any
        ], importReport);

        expect(importReport.errors.length).toBe(1);
        expect(importReport.errors[0][0]).toEqual(ImportErrors.DUPLICATE_IDENTIFIER);
        expect(importReport.errors[0][1]).toEqual('1a');
        done();
    });


    it('preValidate - existing identifier', async done => {

        mockDatastore.find.and.returnValues(Promise.resolve(
            { documents: [{ resource: { type: 'Place', identifier: '1a' } }], totalCount: 1 }));

        importReport = await importStrategy.import([
            { resource: { type: 'Place', identifier: '1a' } } as any
        ], importReport);

        expect(importReport.errors.length).toBe(1);
        expect(importReport.errors[0][0]).toEqual(ImportErrors.RESOURCE_EXISTS);
        expect(importReport.errors[0][1]).toEqual('1a');
        done();
    });
});