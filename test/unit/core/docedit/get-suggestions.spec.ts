import {Document} from 'idai-components-2';
import {Static} from '../../static';
import {RelationDefinition} from '../../../../app/core/configuration/model/relation-definition';
import {getSuggestions, MAX_SUGGESTIONS} from '../../../../app/core/docedit/get-suggestions';


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
            = Static.doc('shortDescription', 'identifier', 'Type','id');
        document.resource.relations['relation'] = [''];

        const relationDefinition: RelationDefinition = {
            name: 'relation',
            range: ['RangeType1', 'RangeType2']
        };

        await getSuggestions(datastore, document.resource, relationDefinition,
            'input');

        expect(datastore.find).toHaveBeenCalledWith({
            q: 'input',
            types: ['RangeType1', 'RangeType2'],
            constraints: {
               'id:match': {
                   value: ['id'],
                   type: 'subtract'
               }
            }, limit: MAX_SUGGESTIONS,
            sort: 'exactMatchFirst'
        });

        done();
    });


    it('do not suggest resources which are already targets of the relation or inverse relation', async done => {

        const document: Document
            = Static.doc('shortDescription', 'identifier', 'Type','id1');
        document.resource.relations['relation'] = ['id2', 'id3'];
        document.resource.relations['inverse'] = ['id4', 'id5'];

        const relationDefinition: RelationDefinition = {
            name: 'relation',
            inverse: 'inverse',
            range: ['RangeType']
        };

        await getSuggestions(datastore, document.resource, relationDefinition);

        expect(datastore.find).toHaveBeenCalledWith({
            q: '',
            types: ['RangeType'],
            constraints: {
                'id:match': {
                    value: ['id1', 'id2', 'id3', 'id4', 'id5'],
                    type: 'subtract'
                }
            }, limit: MAX_SUGGESTIONS,
            sort: 'exactMatchFirst'
        });

        done();
    });


    it('only suggest resources with an isRecordedIn relation to the same resource if the option' +
            'sameMainTypeResource is set', async done => {

        const document: Document
            = Static.doc('shortDescription', 'identifier', 'Type','id');
        document.resource.relations['relation'] = [''];
        document.resource.relations['isRecordedIn'] = ['operationId'];

        const relationDefinition: RelationDefinition = {
            name: 'relation',
            range: ['RangeType'],
            sameMainTypeResource: true
        };

        await getSuggestions(datastore, document.resource, relationDefinition);

        expect(datastore.find).toHaveBeenCalledWith({
            q: '',
            types: ['RangeType'],
            constraints: {
                'id:match': {
                    value: ['id'],
                    type: 'subtract'
                }, 'isRecordedIn:contain': 'operationId',
            }, limit: MAX_SUGGESTIONS,
            sort: 'exactMatchFirst'
        });

        done();
    });


    it('show suggestions for new document without id', async done => {

        const document: Document
            = Static.doc('shortDescription', 'identifier', 'Type','id');
        document.resource.relations['relation'] = [''];
        delete document.resource.id;

        const relationDefinition: RelationDefinition = {
            name: 'relation',
            range: ['RangeType'],
            sameMainTypeResource: true
        };

        try {
            await getSuggestions(datastore, document.resource, relationDefinition);
        } catch (err) {
            fail();
        }

        expect(datastore.find).toHaveBeenCalledWith({
            q: '',
            types: ['RangeType'],
            constraints: {
                'id:match': {
                    value: [],
                    type: 'subtract'
                },
            }, limit: MAX_SUGGESTIONS,
            sort: 'exactMatchFirst'
        });

        done();
    });
});
