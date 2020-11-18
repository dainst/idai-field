import {getExportDocuments} from '../../../../../src/app/core/export/catalog/get-export-documents';
import {makeDocumentsLookup} from '../../../../../src/app/core/import/import/utils';

describe('getExportDocuments', () => {

    let datastore;

    beforeEach(() => {

        datastore = jasmine.createSpyObj('datastore', ['get', 'find']);

        const documents = [
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
                    relations: {}
                }
            }
        ];
        const documentsLookup = makeDocumentsLookup(documents as any);

        datastore.get.and.callFake(id => {
            return documentsLookup[id];
        });
        datastore.find.and.callFake(_query => {
           return { documents: documents };
        });
    });


    it('basic', async done => {

        const exportDocumentsLookup = makeDocumentsLookup(await getExportDocuments(datastore, 'C1'));
        expect(exportDocumentsLookup['C1'].resource.id).toBe('C1');
        expect(exportDocumentsLookup['T1'].resource.id).toBe('T1');
        done();
    });
});
