import {Query} from 'idai-components-2';
import {IndexFacade} from '../../../../../app/core/datastore/index/index-facade';
import {Static} from '../../../static';
import {IndexerConfiguration} from '../../../../../app/indexer-configuration';
import {createMockProjectConfiguration} from './helpers';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
describe('IndexFacade', () => {

    let indexFacade: IndexFacade;


    beforeEach(() => {

        const { createdIndexFacade } =
            IndexerConfiguration.configureIndexers(createMockProjectConfiguration(), false);
        indexFacade = createdIndexFacade;
    });


    it('should put a type and then a find', () => {

        const typeDocB = Static.doc('sd1', 'identifier1', 'Type', 'id1');
        const typeDocA = Static.doc('sd0', 'identifier0', 'Type', 'id0');
        const findDocB = Static.doc('sd3', 'identifier3', 'FindB', 'id3');
        const findDocA = Static.doc('sd2', 'identifier2', 'FindA', 'id2');
        findDocB.resource.relations = { isInstanceOf: ['id1'] };
        findDocA.resource.relations = { isInstanceOf: ['id0'] };

        indexFacade.put(typeDocB);
        indexFacade.put(typeDocA);

        const items1 = indexFacade.find({ types: ['Type'], sort: { matchType: 'Find'} });
        expect(items1).toEqual(['id1', 'id0']);

        // ->
        indexFacade.put(findDocB);
        indexFacade.put(findDocA);

        const items = indexFacade.find({ types: ['Type'], sort: { matchType: 'FindA'} });
        expect(items).toEqual(['id0', 'id1']);
    });


    it('put a type, add finds, delete finds afterward', () => {

        const typeDocB = Static.doc('sd1', 'identifier1', 'Type', 'id1');
        const typeDocA = Static.doc('sd0', 'identifier0', 'Type', 'id0');
        const findDocC = Static.doc('sd4', 'identifier4', 'Find', 'id4');
        const findDocB = Static.doc('sd3', 'identifier3', 'Find', 'id3');
        const findDocA = Static.doc('sd2', 'identifier2', 'Find', 'id2');
        findDocA.resource.relations = { isInstanceOf: ['id0'] };
        findDocB.resource.relations = { isInstanceOf: ['id1'] };
        findDocC.resource.relations = { isInstanceOf: ['id1'] };

        indexFacade.put(typeDocA);
        indexFacade.put(typeDocB);

        const items1 = indexFacade.find({ types: ['Type'], sort: { matchType: 'Find'} });
        expect(items1).toEqual(['id0', 'id1']);

        indexFacade.put(findDocB);
        indexFacade.put(findDocA);
        indexFacade.put(findDocC);

        const items2 = indexFacade.find({ types: ['Type'], sort: { matchType: 'Find'} });
        expect(items2).toEqual(['id1', 'id0']);

        // ->
        indexFacade.remove(findDocB);
        indexFacade.remove(findDocC);

        const result = indexFacade.find({ types: ['Type'], sort: { matchType: 'Find'} });
        expect(result).toEqual(['id0', 'id1']);
    });


    it('put a type, add finds, put finds afterward again', () => {

        const typeDocB = Static.doc('sd1', 'identifier1', 'Type', 'id1');
        const typeDocA = Static.doc('sd0', 'identifier0', 'Type', 'id0');
        const findDocC = Static.doc('sd4', 'identifier4', 'Find', 'id4');
        const findDocB = Static.doc('sd3', 'identifier3', 'Find', 'id3');
        const findDocA = Static.doc('sd2', 'identifier2', 'Find', 'id2');
        findDocA.resource.relations = { isInstanceOf: ['id0'] };
        findDocB.resource.relations = { isInstanceOf: ['id1'] };
        findDocC.resource.relations = { isInstanceOf: ['id1'] };

        indexFacade.put(typeDocA);
        indexFacade.put(typeDocB);

        const items1 = indexFacade.find({ types: ['Type'], sort: { matchType: 'Find'} });
        expect(items1).toEqual(['id0', 'id1']);

        indexFacade.put(findDocB);
        indexFacade.put(findDocA);
        indexFacade.put(findDocC);

        const items2 = indexFacade.find({ types: ['Type'], sort: { matchType: 'Find'} });
        expect(items2).toEqual(['id1', 'id0']);

        // ->
        findDocB.resource.relations = { isInstanceOf: ['id0'] };
        findDocC.resource.relations = { isInstanceOf: ['id0'] };
        indexFacade.put(findDocB);
        indexFacade.put(findDocC);

        const result = indexFacade.find({ types: ['Type'], sort: { matchType: 'Find'} });
        expect(result).toEqual(['id0', 'id1']);
    });


    it('keep instances after re-putting type', () => {

        const typeDocB = Static.doc('sd1', 'identifier1', 'Type', 'id1');
        const typeDocA = Static.doc('sd0', 'identifier0', 'Type', 'id0');
        const findDocC = Static.doc('sd4', 'identifier4', 'Find', 'id4');
        const findDocB = Static.doc('sd3', 'identifier3', 'Find', 'id3');
        const findDocA = Static.doc('sd2', 'identifier2', 'Find', 'id2');
        findDocA.resource.relations = { isInstanceOf: ['id0'] };
        findDocB.resource.relations = { isInstanceOf: ['id1'] };
        findDocC.resource.relations = { isInstanceOf: ['id1'] };

        indexFacade.put(typeDocA);
        indexFacade.put(typeDocB);

        const items1 = indexFacade.find({ types: ['Type'], sort: { matchType: 'Find'} });
        expect(items1).toEqual(['id0', 'id1']);

        indexFacade.put(findDocB);
        indexFacade.put(findDocA);
        indexFacade.put(findDocC);

        const items2 = indexFacade.find({ types: ['Type'], sort: { matchType: 'Find'} });
        expect(items2).toEqual(['id1', 'id0']);

        // ->
        indexFacade.put(typeDocA);

        const result = indexFacade.find({ types: ['Type'], sort: { matchType: 'Find'} });
        expect(result).toEqual(['id1', 'id0']);
    });


    it('should sort by identifier ascending', () => {

        const doc1 = Static.doc('bla1', 'blub1', 'type1','id1');
        const doc3 = Static.doc('bla3', 'blub3', 'type3','id3');
        doc3.resource.relations['isRecordedIn'] = ['id1'];

        const doc2 = Static.doc('bla2', 'blub2', 'type2','id2');
        doc2.resource.relations['isRecordedIn'] = ['id1'];

        const q: Query = {
            q: 'blub',
            constraints: {
                'isRecordedIn:contain': 'id1'
            }
        };

        indexFacade.put(doc1);
        indexFacade.put(doc2);
        indexFacade.put(doc3);

        const result = indexFacade.find(q);
        expect(result).toEqual(['id2', 'id3']);
    });


    it('do not index if no identifier', () => {

        const doc1 = Static.doc('sd0', 'identifier0', 'Type', 'id0');
        delete doc1.resource.identifier;
        const doc2 = Static.doc('sd1', 'identifier1', 'Type', 'id1');

        indexFacade.put(doc1);
        indexFacade.put(doc2);

        const result = indexFacade.find({});
        expect(result).toEqual(['id1']);
    });
});