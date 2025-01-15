import { doc, Relation, Document } from 'idai-field-core';
import { getSuggestions } from '../../../../../../src/app/components/docedit/widgets/relationpicker/get-suggestions';


/**
 * @author Thomas Kleinke
 */
describe('getSuggestions', () => {

    let datastore;


    beforeEach(() => {

        datastore = {
            find: jest.fn().mockReturnValue(Promise.resolve({ documents: [] }))
        };
    });


    test('create suggestions query', async () => {

        const document: Document = doc('shortDescription', 'identifier', 'Category', 'id');
        document.resource.relations['relation'] = [''];

        const relationDefinition: Relation = {
            name: 'relation',
            domain: [],
            range: ['RangeCategory1', 'RangeCategory2'],
            editable: false,
            visible: false,
            inputType: 'relation'
        };

        await getSuggestions(datastore, document.resource, relationDefinition, '', 0, 10);

        expect(datastore.find).toHaveBeenCalledWith({
            q: '',
            offset: 0,
            limit: 10,
            categories: ['RangeCategory1', 'RangeCategory2'],
            constraints: {
               'id:match': {
                   value: ['id'],
                   subtract: true
               }
            }
        });
    });


    test('do not suggest resources which are already targets of the relation or inverse relation', async () => {

        const document: Document = doc('shortDescription', 'identifier', 'Category', 'id1');
        document.resource.relations['relation'] = ['id2', 'id3'];
        document.resource.relations['inverse'] = ['id4', 'id5'];

        const relationDefinition: Relation = {
            name: 'relation',
            inverse: 'inverse',
            domain: [],
            range: ['RangeCategory'],
            editable: false,
            visible: false,
            inputType: 'relation'
        };

        await getSuggestions(datastore, document.resource, relationDefinition, '', 0, 10);

        expect(datastore.find).toHaveBeenCalledWith({
            q: '',
            offset: 0,
            limit: 10,
            categories: ['RangeCategory'],
            constraints: {
                'id:match': {
                    value: ['id1', 'id2', 'id3', 'id4', 'id5'],
                    subtract: true
                }
            }
        });
    });


    test('show suggestions for new document without id', async () => {

        const document: Document = doc('shortDescription', 'identifier', 'Category','id');
        document.resource.relations['relation'] = [''];
        delete document.resource.id;

        const relationDefinition: Relation = {
            name: 'relation',
            domain: [],
            range: ['RangeCategory'],
            editable: false,
            visible: false,
            inputType: 'relation'
        };

        await getSuggestions(datastore, document.resource, relationDefinition, '', 0, 10);

        expect(datastore.find).toHaveBeenCalledWith({
            q: '',
            offset: 0,
            limit: 10,
            categories: ['RangeCategory'],
            constraints: {
                'id:match': {
                    value: [],
                    subtract: true
                },
            }
        });
    });
});
