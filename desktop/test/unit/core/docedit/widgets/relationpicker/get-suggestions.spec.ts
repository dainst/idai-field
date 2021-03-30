import { doc, RelationDefinition } from 'idai-field-core';
import { Document } from 'idai-field-core';
import { getSuggestions, MAX_SUGGESTIONS } from '../../../../../../src/app/core/docedit/widgets/relationpicker/get-suggestions';


/**
 * @author Thomas Kleinke
 */
describe('getSuggestions', () => {

    let datastore;


    beforeEach(() => {

        datastore = jasmine.createSpyObj('ReadDatastore', ['find']);
        datastore.find.and.returnValue(Promise.resolve({ documents: [] }));
    });


    it('create suggestions query', async done => {

        const document: Document
            = doc('shortDescription', 'identifier', 'Category','id');
        document.resource.relations['relation'] = [''];

        const relationDefinition: RelationDefinition = {
            name: 'relation',
            label: '',
            domain: [],
            range: ['RangeCategory1', 'RangeCategory2']
        };

        await getSuggestions(datastore, document.resource, relationDefinition, 'input');

        expect(datastore.find).toHaveBeenCalledWith({
            q: 'input',
            categories: ['RangeCategory1', 'RangeCategory2'],
            constraints: {
               'id:match': {
                   value: ['id'],
                   subtract: true
               }
            },
            limit: MAX_SUGGESTIONS,
            sort: { mode: 'exactMatchFirst' }
        });

        done();
    });


    it('do not suggest resources which are already targets of the relation or inverse relation', async done => {

        const document: Document
            = doc('shortDescription', 'identifier', 'Category','id1');
        document.resource.relations['relation'] = ['id2', 'id3'];
        document.resource.relations['inverse'] = ['id4', 'id5'];

        const relationDefinition: RelationDefinition = {
            name: 'relation',
            label: '',
            inverse: 'inverse',
            domain: [],
            range: ['RangeCategory']
        };

        await getSuggestions(datastore, document.resource, relationDefinition);

        expect(datastore.find).toHaveBeenCalledWith({
            q: '',
            categories: ['RangeCategory'],
            constraints: {
                'id:match': {
                    value: ['id1', 'id2', 'id3', 'id4', 'id5'],
                    subtract: true
                }
            },
            limit: MAX_SUGGESTIONS,
            sort: { mode: 'exactMatchFirst' }
        });

        done();
    });


    it('only suggest resources with an isRecordedIn relation to the same resource if the option' +
            'sameMainCategoryResource is set', async done => {

        const document: Document
            = doc('shortDescription', 'identifier', 'Category','id');
        document.resource.relations['relation'] = [''];
        document.resource.relations['isRecordedIn'] = ['operationId'];

        const relationDefinition: RelationDefinition = {
            name: 'relation',
            label: '',
            domain: [],
            range: ['RangeCategory'],
            sameMainCategoryResource: true
        };

        await getSuggestions(datastore, document.resource, relationDefinition);

        expect(datastore.find).toHaveBeenCalledWith({
            q: '',
            categories: ['RangeCategory'],
            constraints: {
                'id:match': {
                    value: ['id'],
                    subtract: true
                }, 'isRecordedIn:contain': 'operationId',
            },
            limit: MAX_SUGGESTIONS,
            sort: { mode: 'exactMatchFirst' }
        });

        done();
    });


    it('show suggestions for new document without id', async done => {

        const document: Document
            = doc('shortDescription', 'identifier', 'Category','id');
        document.resource.relations['relation'] = [''];
        delete document.resource.id;

        const relationDefinition: RelationDefinition = {
            name: 'relation',
            label: '',
            domain: [],
            range: ['RangeCategory'],
            sameMainCategoryResource: true
        };

        try {
            await getSuggestions(datastore, document.resource, relationDefinition);
        } catch (err) {
            fail();
        }

        expect(datastore.find).toHaveBeenCalledWith({
            q: '',
            categories: ['RangeCategory'],
            constraints: {
                'id:match': {
                    value: [],
                    subtract: true
                },
            },
            limit: MAX_SUGGESTIONS,
            sort: { mode: 'exactMatchFirst' }
        });

        done();
    });
});
