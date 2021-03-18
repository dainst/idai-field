import {Document} from 'idai-components-2';
import {IndexerConfiguration} from '../../../../../src/app/indexer-configuration';
import {createMockProjectConfiguration} from './helpers';
import {Static} from '../../../static';
import {performQuery as performQuery_} from '../../../../../src/app/core/datastore/index/perform-query';
import {FulltextIndex} from '../../../../../src/app/core/datastore/index/fulltext-index';
import {ConstraintIndex} from '../../../../../src/app/core/datastore/index/constraint-index';
import {Query} from '../../../../../src/app/core/datastore/model/query';
import {namedArrayToNamedMap} from '../../../../../src/app/core/util/named';

/**
 * @author Daniel de Oliveira
 */
describe('performQuery', () => {

    let constraintIndex;
    let fulltextIndex;
    let categoriesMap;

    beforeEach(() => {

        const projectConfiguration = createMockProjectConfiguration();
        const {createdConstraintIndex, createdFulltextIndex} =
            IndexerConfiguration.configureIndexers(projectConfiguration);
        constraintIndex = createdConstraintIndex;
        fulltextIndex = createdFulltextIndex;
        categoriesMap = namedArrayToNamedMap(projectConfiguration.getCategoriesArray());
    });


    function put(document: Document) {

        ConstraintIndex.put(constraintIndex, document);
        FulltextIndex.put(fulltextIndex, document, categoriesMap);
    }


    function performQuery(query: Query) {

        return performQuery_(query, constraintIndex, fulltextIndex);
    }


    it('should find with filterSet undefined', () => {

        const doc1 = Static.doc('sd1', 'identifier1', 'Find', 'id1');
        put(doc1);

        const result = performQuery({ q: 'identifier' });
        expect(result[0]).toBe('id1');
    });


    it('should find with prefix query undefined', () => {

        const doc1 = Static.doc('sd1', 'identifier1', 'Find', 'id1');
        put(doc1);

        const result = performQuery({ q: undefined });
        expect(result[0]).toBe('id1');
    });


    it('should find with omitted q', () => {

        const doc1 = Static.doc('sd1', 'identifier1', 'Find', 'id1');
        put(doc1);

        const result = performQuery({});
        expect(result[0]).toBe('id1');
    });


    it('should find with omitted q and ommitted prefix', () => {

        const doc1 = Static.doc('sd1', 'identifier1', 'Find', 'id1');
        put(doc1);

        const result = performQuery({});
        expect(result[0]).toBe('id1');
    });


    it('should match all fields', () => {

        const doc1 = Static.doc('bla', 'identifier1', 'Find', 'id1');
        const doc2 = Static.doc('sd2', 'bla', 'Find', 'id2');
        put(doc1);
        put(doc2);

        const result = performQuery({ q: 'bla' });
        expect(result.length).toBe(2);
    });


    it('should filter by one category in find', () => {

        const doc1 = Static.doc('bla1', 'blub', 'category1', 'id1');
        const doc2 = Static.doc('bla2', 'blub', 'category2', 'id2');
        const doc3 = Static.doc('bla3', 'blub', 'category3', 'id3');
        put(doc1);
        put(doc2);
        put(doc3);

        const result = performQuery(
            { q: 'blub', categories: ['category3'] });
        expect(result.length).toBe(1);
        expect(result[0]).toBe('id3');
    });


    it('should filter with constraint', () => {

        const doc1 = Static.doc('bla1', 'blub1', 'category1','id1');
        const doc2 = Static.doc('bla2', 'blub2', 'category2','id2');
        const doc3 = Static.doc('bla3', 'blub3', 'category2','id3');
        const doc4 = Static.doc('bla4', 'blub4', 'category2','id4');
        doc2.resource.relations['isRecordedIn'] = ['id1'];
        doc3.resource.relations['isRecordedIn'] = ['id1'];
        doc4.resource.relations['isRecordedIn'] = ['id2'];

        const q: Query = {
            q: 'blub',
            constraints: {
                'isRecordedIn:contain' : 'id1'
            }
        };

        put(doc1);
        put(doc2);
        put(doc3);
        put(doc4);

        const result = performQuery(q);
        expect(result).toContain('id2');
        expect(result).toContain('id3');
        expect(result.length).toBe(2);
    });


    it('should find by prefix query and filter', () => {

        const doc1 = Static.doc('bla1', 'blub1', 'category1', 'id1');
        const doc2 = Static.doc('bla2', 'blub2', 'category2', 'id2');
        const doc3 = Static.doc('bla3', 'blub3', 'category2', 'id3');
        put(doc1);
        put(doc2);
        put(doc3);

        const result = performQuery({
            q: 'blub',
            categories: ['category2']
        });

        expect(result.length).toBe(2);
        expect(result[0]).not.toBe('id1');
        expect(result[1]).not.toBe('id1');
    });


    it('should filter with multiple constraints', () => {

        const doc1 = Static.doc('bla1', 'blub1', 'category1','id1');
        const doc2 = Static.doc('bla2', 'blub2', 'category2','id2');
        doc2.resource.relations['isRecordedIn'] = ['id1'];
        const doc3 = Static.doc('bla3', 'blub3', 'category2','id3');
        doc3.resource.relations['isRecordedIn'] = ['id1'];
        doc3.resource.relations['liesWithin'] = ['id2'];

        const q: Query = {
            q: 'blub',
            constraints: {
                'isRecordedIn:contain' : 'id1',
                'liesWithin:contain' : 'id2'
            }
        };

        put(doc1);
        put(doc2);
        put(doc3);

        const result = performQuery(q);
        expect(result[0]).toBe('id3');
        expect(result.length).toBe(1);
    });


    it('should filter with a subtract constraint', () => {

        const doc1 = Static.doc('Document 1', 'doc1', 'category1','id1');
        const doc2 = Static.doc('Document 2', 'doc2', 'category1','id2');
        const doc3 = Static.doc('Document 3', 'doc3', 'category2','id3');
        doc3.resource.relations['isRecordedIn'] = ['id1'];
        const doc4 = Static.doc('Document 4', 'doc4', 'category2','id4');
        doc4.resource.relations['isRecordedIn'] = ['id2'];

        const q: Query = {
            q: 'doc',
            constraints: {
                'isRecordedIn:contain': { value: 'id2', subtract: true }
            }
        };

        put(doc1);
        put(doc2);
        put(doc3);
        put(doc4);

        const result = performQuery(q);
        expect(result.length).toBe(3);
        expect(result).toEqual(['id1', 'id2', 'id3']);
    });


    it('should get with descendants', () => {

        const doc1 = Static.doc('Document 1', 'doc1', 'category1','id1');
        const doc2 = Static.doc('Document 2', 'doc2', 'category1','id2');
        const doc3 = Static.doc('Document 3', 'doc3', 'category2','id3');
        doc2.resource.relations['liesWithin'] = ['id1'];
        doc3.resource.relations['liesWithin'] = ['id2'];

        const q: Query = {
            q: 'doc',
            constraints: {
                'liesWithin:contain': { value: 'id1', searchRecursively: true }
            }
        };

        put(doc1);
        put(doc2);
        put(doc3);

        const result = performQuery(q);
        expect(result.length).toBe(2);
        expect(result).toEqual(['id2', 'id3']);
    });
});
