import { basicIndexConfiguration, Document, FulltextIndex, Named, Query, Tree } from '../..';
import { ConstraintIndex } from '../..';
import { getFieldsToIndex } from '../../src/index/get-fields-to-index';
import { createMockProjectConfiguration, doc } from '../test-helpers';
import { performQuery as performQuery_ } from '../../src/index/perform-query';

/**
 * @author Daniel de Oliveira
 */
describe('performQuery', () => {

    let constraintIndex;
    let fulltextIndex;
    let categoriesMap;
    let projectConfiguration;


    beforeEach(() => {

        projectConfiguration = createMockProjectConfiguration();


        const createdConstraintIndex = ConstraintIndex.make({
            ... basicIndexConfiguration,
            'someField:exist': { path: 'resource.someField', pathArray: ['resource', 'someField'], type: 'exist' }
        }, Tree.flatten(projectConfiguration.getCategories()));

        const createdFulltextIndex = {};

        constraintIndex = createdConstraintIndex;
        fulltextIndex = createdFulltextIndex;
        categoriesMap = Named.arrayToMap(Tree.flatten(projectConfiguration.getCategories()) as any);
    });


    function put(document: Document) {

        ConstraintIndex.put(constraintIndex, document, projectConfiguration.getCategory(document.resource.category));
        FulltextIndex.put(fulltextIndex, document, getFieldsToIndex(categoriesMap, document.resource.category));
    }


    function performQuery(query: Query) {

        return performQuery_(query, constraintIndex, fulltextIndex);
    }


    it('should find with filterSet undefined', () => {

        const doc1 = doc('sd1', 'identifier1', 'Find', 'id1');
        put(doc1);

        const result = performQuery({ q: 'identifier' });
        expect(result[0]).toBe('id1');
    });


    it('should find with prefix query undefined', () => {

        const doc1 = doc('sd1', 'identifier1', 'Find', 'id1');
        put(doc1);

        const result = performQuery({ q: undefined });
        expect(result[0]).toBe('id1');
    });


    it('should find with omitted q', () => {

        const doc1 = doc('sd1', 'identifier1', 'Find', 'id1');
        put(doc1);

        const result = performQuery({});
        expect(result[0]).toBe('id1');
    });


    it('should find with omitted q and ommitted prefix', () => {

        const doc1 = doc('sd1', 'identifier1', 'Find', 'id1');
        put(doc1);

        const result = performQuery({});
        expect(result[0]).toBe('id1');
    });


    it('should match all fields', () => {

        const doc1 = doc('bla', 'identifier1', 'Find', 'id1');
        const doc2 = doc('sd2', 'bla', 'Find', 'id2');
        put(doc1);
        put(doc2);

        const result = performQuery({ q: 'bla' });
        expect(result.length).toBe(2);
    });


    it('should filter by one category in find', () => {

        const doc1 = doc('bla1', 'blub', 'category1', 'id1');
        const doc2 = doc('bla2', 'blub', 'category2', 'id2');
        const doc3 = doc('bla3', 'blub', 'category3', 'id3');
        put(doc1);
        put(doc2);
        put(doc3);

        const result = performQuery(
            { q: 'blub', categories: ['category3'] });
        expect(result.length).toBe(1);
        expect(result[0]).toBe('id3');
    });


    it('should filter with constraint', () => {

        const doc1 = doc('bla1', 'blub1', 'category1','id1');
        const doc2 = doc('bla2', 'blub2', 'category2','id2');
        const doc3 = doc('bla3', 'blub3', 'category2','id3');
        const doc4 = doc('bla4', 'blub4', 'category2','id4');
        doc2.resource.relations['isChildOf'] = ['id1'];
        doc3.resource.relations['isChildOf'] = ['id2'];
        doc4.resource.relations['isChildOf'] = ['id3'];

        const q: Query = {
            q: 'blub',
            constraints: {
                'isChildOf:contain' : { value: 'id1', searchRecursively: true }
            }
        };

        put(doc1);
        put(doc2);
        put(doc3);
        put(doc4);

        const result = performQuery(q);
        expect(result).toContain('id2');
        expect(result).toContain('id3');
        expect(result).toContain('id4');
        expect(result.length).toBe(3);
    });


    it('should find by prefix query and filter', () => {

        const doc1 = doc('bla1', 'blub1', 'category1', 'id1');
        const doc2 = doc('bla2', 'blub2', 'category2', 'id2');
        const doc3 = doc('bla3', 'blub3', 'category2', 'id3');
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

        const doc1 = doc('bla1', 'blub1', 'category1','id1');
        const doc2 = doc('bla2', 'blub2', 'category2','id2');
        doc2.resource.relations['isChildOf'] = ['id1'];
        const doc3 = doc('bla3', 'blub3', 'category2','id3');
        doc3.resource.relations['isChildOf'] = ['id2'];
        doc3.resource.someField = 'isPresent';

        const q: Query = {
            q: 'blub',
            constraints: {
                'isChildOf:contain' : { value: 'id1', searchRecursively: true },
                'someField:exist' : 'KNOWN'
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

        const doc1 = doc('Document 1', 'doc1', 'category1','id1');
        const doc2 = doc('Document 2', 'doc2', 'category1','id2');
        const doc3 = doc('Document 3', 'doc3', 'category2','id3');
        doc3.resource.relations['isChildOf'] = ['id1'];
        const doc4 = doc('Document 4', 'doc4', 'category2','id4');
        doc4.resource.relations['isChildOf'] = ['id2'];

        const q: Query = {
            q: 'doc',
            constraints: {
                'isChildOf:contain': { value: 'id2', subtract: true }
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

        const doc1 = doc('Document 1', 'doc1', 'category1', 'id1');
        const doc2 = doc('Document 2', 'doc2', 'category1', 'id2');
        const doc3 = doc('Document 3', 'doc3', 'category2', 'id3');
        doc2.resource.relations['isChildOf'] = ['id1'];
        doc3.resource.relations['isChildOf'] = ['id2'];

        const q: Query = {
            q: 'doc',
            constraints: {
                'isChildOf:contain': { value: 'id1', searchRecursively: true }
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
