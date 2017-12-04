import {MergeGeometriesImportStrategy} from '../../../../app/core/importer/merge-geometries-import-strategy';
import {ImportStrategy} from '../../../../app/core/importer/import-strategy';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('MergeGeometriesImportStrategy Tests ---', () => {

        let strategy: ImportStrategy;
        let mockValidator;
        let mockDatastore;
        let mockSettingsService;
        let originalDoc;
        let docToMerge;

        beforeEach(() => {
            originalDoc = {
                resource: {
                    id: '1',
                    identifier: 'i1',
                    shortDescription: 'sd1'
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

            mockSettingsService = jasmine.createSpyObj('settingsService', ['getUsername']);
            mockSettingsService.getUsername.and.callFake(function() { return 'testuser'; });

            strategy = new MergeGeometriesImportStrategy(mockValidator, mockDatastore, mockSettingsService);
        });

        it('should merge geometry',
            function(done) {
                strategy.importDoc(docToMerge)
                    .then(() => {
                        let importedDoc = mockDatastore.update.calls.mostRecent().args[0];
                        expect(importedDoc.resource).toEqual({
                            id: '1',
                            identifier: 'i1',
                            shortDescription: 'sd1',
                            geometry: { a: 'b' }
                        });
                        expect(importedDoc.modified).toBeDefined();
                        expect(importedDoc.modified.length).toBe(1);
                        expect(importedDoc.modified[0].user).toEqual('testuser');
                        expect(importedDoc.modified[0].date).toBeDefined();
                        done();
                    }, err => {
                        fail('should not fail ' + err);
                        done();
                    })
            }
        )
    })
}