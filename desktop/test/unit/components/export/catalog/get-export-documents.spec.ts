import { ERROR_NOT_ALL_IMAGES_EXCLUSIVELY_LINKED,
    getExportDocuments } from '../../../../../src/app/components/export/catalog/get-export-documents';
import { makeDocumentsLookup } from '../../../../../src/app/components/import/import/utils';


describe('getExportDocuments', () => {

    let datastore;
    let imageRelationsManager;
    let images;


    beforeEach(() => {

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
                        liesWithin: ['C1'],
                        isDepictedIn: ['I1']
                    }
                }
            }
        ];

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

        datastore = {
            find: jest.fn().mockReturnValue({ documents: [documents[1]] }),
            get: jest.fn().mockReturnValue(documents[0])
        };

        imageRelationsManager = {
            getLinkedImages: jest.fn().mockReturnValue(images)
        };
    });


    test('basic', async () => {

        const [_, [exportDocuments, imageResourceIds]] = await getExportDocuments(
            datastore, imageRelationsManager, 'C1', 'test-project'
        );

        const exportDocumentsLookup = makeDocumentsLookup(exportDocuments);

        expect(exportDocuments.length).toBe(3);
        expect(exportDocumentsLookup['C1']?.['project']).toBe('test-project');
        expect(exportDocumentsLookup['T1']?.['project']).toBe('test-project');
        expect(exportDocumentsLookup['I1']?.['project']).toBe('test-project');
        expect(imageResourceIds).toEqual(['I1']);
    });


    test('not all images exclusively linked', async () => {

        imageRelationsManager.getLinkedImages.mockImplementation((_, option) => {
            return option === true
                ? []
                : images;
        });

        const [error, _] = await getExportDocuments(
            datastore, imageRelationsManager, 'C1', 'test-project'
        );

        expect(error[0]).toEqual(ERROR_NOT_ALL_IMAGES_EXCLUSIVELY_LINKED);
        expect(error[1]).toEqual(images[0].resource.identifier);
    });
});
