import {MergeGeometriesImportStrategy} from '../../../app/import/merge-geometries-import-strategy';
import {ImportStrategy} from '../../../app/import/import-strategy';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('MergeGeometriesImportStrategy Tests ---', () => {

        let strategy: ImportStrategy;
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

            mockDatastore = jasmine.createSpyObj('datastore', ['findByIdentifier','update']);
            mockDatastore.findByIdentifier.and.callFake(() => Promise.resolve(originalDoc));
            mockDatastore.update.and.callFake(() => Promise.resolve(undefined));

            mockSettingsService = jasmine.createSpyObj('settingsService', ['getUsername']);
            mockSettingsService.getUsername.and.callFake(function() { return 'testuser'; });

            strategy = new MergeGeometriesImportStrategy(mockDatastore, mockSettingsService);
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