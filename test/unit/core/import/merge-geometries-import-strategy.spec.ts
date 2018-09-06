import {MergeGeometriesImportStrategy} from '../../../../app/core/import/merge-geometries-import-strategy';
import {ImportStrategy} from '../../../../app/core/import/import-strategy';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('MergeGeometriesImportStrategy Tests ---', () => {


    let strategy: ImportStrategy;
    let mockValidator;
    let mockDatastore;
    let originalDoc;
    let docToMerge;


    beforeEach(() => {

        originalDoc = {
            resource: {
                id: '1',
                identifier: 'i1',
                shortDescription: 'sd1',
                relations: {}
            }
        };

        docToMerge = {
            resource: {
                geometry: { a: 'b' }
            }
        };

        mockValidator = jasmine.createSpyObj('validator', ['validate']);
        mockValidator.validate.and.callFake(function() { return Promise.resolve(); });

        mockDatastore = jasmine.createSpyObj('datastore', ['find','update']);
        mockDatastore.find.and.callFake(
            () => Promise.resolve({ documents: [originalDoc], totalCount: 1 }));
        mockDatastore.update.and.callFake(() => Promise.resolve(undefined));

        strategy = new MergeGeometriesImportStrategy(mockValidator, mockDatastore, 'testuser');
    });


    it('should merge geometry', async done => {

        await strategy.importDoc(docToMerge);

        const importedDoc = mockDatastore.update.calls.mostRecent().args[0];
        expect(importedDoc.resource).toEqual({
            id: '1',
            identifier: 'i1',
            shortDescription: 'sd1',
            geometry: { a: 'b' },
            relations: {}
        });
        expect(importedDoc.modified).toBeDefined();
        expect(importedDoc.modified.length).toBe(1);
        expect(importedDoc.modified[0].user).toEqual('testuser');
        expect(importedDoc.modified[0].date).toBeDefined();
        done();
    })
});