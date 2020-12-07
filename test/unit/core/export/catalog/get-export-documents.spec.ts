import {getExportDocuments} from '../../../../../src/app/core/export/catalog/get-export-documents';
import {makeDocumentsLookup} from '../../../../../src/app/core/import/import/utils';


describe('getExportDocuments', () => {

    let datastore;
    let relationsManager;
    let imageRelationsManager;

    beforeEach(() => {

        datastore = jasmine.createSpyObj('datastore', ['get', 'find']);
        relationsManager = jasmine.createSpyObj('relationsManager', ['fetchDescendants']);
        imageRelationsManager = jasmine.createSpyObj('imageRelationsManager', ['getRelatedImageDocuments']);

        const images: Array<any> = [
            {
                resource: {
                    id: 'I1',
                    category: 'Image',
                    relations: {
                        depicts: ['T1']
                    }
                }
            }
        ];
        const documents: Array<any> = [
            {
                resource: {
                    id: 'C1',
                    category: 'TypeCatalog',
                    relations: {}
                }
            },
            {
                resource: {
                    id: 'T1',
                    category: 'Type',
                    relations: {
                        isDepictedIn: ['I1']
                    }
                }
            }
        ];
        const documentsLookup = makeDocumentsLookup(documents.concat(images));

        datastore.get.and.callFake(id => {
            return documentsLookup[id];
        });
        relationsManager.fetchDescendants.and.returnValue([documents[1]]);
        imageRelationsManager.getRelatedImageDocuments.and.returnValue(images);
    });


    it('basic', async done => {

        const [exportDocuments, imageResourceIds] = await getExportDocuments(
            datastore, relationsManager, imageRelationsManager, 'C1', 'test-project');
        const exportDocumentsLookup = makeDocumentsLookup(exportDocuments);
        expect(exportDocuments.length).toBe(3);
        expect(exportDocumentsLookup['C1']['project']).toBe('test-project');
        expect(exportDocumentsLookup['T1']['project']).toBe('test-project');
        expect(exportDocumentsLookup['I1']['project']).toBe('test-project');
        expect(imageResourceIds).toEqual(['I1']);
        done();
    });
});
