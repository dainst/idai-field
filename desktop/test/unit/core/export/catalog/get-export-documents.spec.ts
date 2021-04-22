import {ERROR_NOT_ALL_IMAGES_EXCLUSIVELY_LINKED,
    getExportDocuments} from '../../../../../src/app/core/export/catalog/get-export-documents';
import {makeDocumentsLookup} from '../../../../../src/app/core/import/import/utils';


describe('getExportDocuments', () => {

    let relationsManager;
    let imageRelationsManager;

    let images;

    beforeEach(() => {

        relationsManager = jasmine.createSpyObj('relationsManager', ['get']);
        imageRelationsManager = jasmine.createSpyObj('imageRelationsManager', ['getLinkedImages']);

        images = [
            {
                resource: {
                    id: 'I1',
                    identifier: 'identifierI1',
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
        relationsManager.get.and.returnValue([documents[0], documents[1]]);
        imageRelationsManager.getLinkedImages.and.returnValue(images);
    });


    it('basic', async done => {

        const [_, [exportDocuments, imageResourceIds]] = await getExportDocuments(
            relationsManager, imageRelationsManager, 'C1', 'test-project');
        const exportDocumentsLookup = makeDocumentsLookup(exportDocuments);
        expect(exportDocuments.length).toBe(3);
        expect(exportDocumentsLookup['C1']['project']).toBe('test-project');
        expect(exportDocumentsLookup['T1']['project']).toBe('test-project');
        expect(exportDocumentsLookup['I1']['project']).toBe('test-project');
        expect(imageResourceIds).toEqual(['I1']);
        done();
    });


    it('not all images exclusively linked', async done => {

        imageRelationsManager.getLinkedImages.and.callFake((_, option) => {
            return option === true
                ? []
                : images;
        });

        const [error, _] = await getExportDocuments(
            relationsManager, imageRelationsManager, 'C1', 'test-project');
        expect(error[0]).toEqual(ERROR_NOT_ALL_IMAGES_EXCLUSIVELY_LINKED);
        expect(error[1]).toEqual(images[0].resource.identifier);
        done();
    });
});
