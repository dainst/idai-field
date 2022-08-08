import { FulltextIndex } from '../../src/index/fulltext-index';
import { IndexItem } from '../../src/index/index-item';
import { doc as helpersDoc } from '../test-helpers';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('FulltextIndex', () => {

    let fulltextIndex;
    const fieldsToIndex = ['identifier', 'shortDescription'];


    function doc(id, identifier, category, shortDescription = 'short') {

        const newDoc = helpersDoc(shortDescription, identifier, category, id);
        newDoc.created = { date: '2017-12-31' } as any;
        newDoc.modified = [{ date: '2018-01-01' }] as any;
        return newDoc;
    }


    beforeEach(() => {

        fulltextIndex = {};
    });


    it('match one with different search terms', () => {

        const d = doc('1', 'identifier1', 'category');

        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'identifier1', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fulltextIndex,'ide', ['category'])).toEqual(['1']);
    });


    it('match two with the same search term', () => {

        const d1 = doc('1', 'identifier1', 'category');
        const d2 = doc('2', 'identifier2', 'category');

        FulltextIndex.put(fulltextIndex, d1, fieldsToIndex);
        FulltextIndex.put(fulltextIndex, d2, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'identifier', ['category'])).toEqual(['1', '2']);
    });


    it('match in all categories', () => {

        const d = doc('1', 'identifier1', 'category');

        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'identifier', undefined)).toEqual(['1']);
    });


    it('index short description', () => {

        const d = doc('1', 'identifier1', 'category', 'short');

        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'short', undefined)).toEqual(['1']);
    });


    it('match in multiple selected categories', () => {

        const d1 = doc('1', 'identifier1', 'category1');
        const d2 = doc('2', 'identifier2', 'category2');
        const d3 = doc('3', 'identifier3', 'category3');

        FulltextIndex.put(fulltextIndex, d1, fieldsToIndex);
        FulltextIndex.put(fulltextIndex, d2, fieldsToIndex);
        FulltextIndex.put(fulltextIndex, d3, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'identifier', ['category1', 'category2'])).toEqual(['1', '2']);
    });


    it('do not match search term', () => {

        const d = doc('1', 'iden', 'category');

        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'identifier', ['category'])).toEqual([]);
    });


    it('do not match search in category', () => {

        const d = doc('1', 'iden', 'category1');

        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'identifier', ['category2'])).toEqual([]);
    });


    it('match one with two search terms', () => {

        const d = doc('1', 'identifier1', 'category', 'a short description');

        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex,'short description', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fulltextIndex, 'a description', ['category'])).toEqual(['1']);
    });


    it('ignore additional spaces and hyphens', () => {

        const d = doc('1', 'identifier1', 'category', 'a short description');

        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, ' a    short  description  ', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fulltextIndex,'-a----short--description--', ['category'])).toEqual(['1']);
    });


    it('no categories present', () => {

        expect(FulltextIndex.get(fulltextIndex, 'identifier', ['category'])).toEqual([]);
    });


    it('remove', () => {

        const d = doc('1', 'identifier1', 'category');

        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        FulltextIndex.remove(fulltextIndex, d);
        expect(FulltextIndex.get(fulltextIndex, 'identifier', ['category'])).toEqual([]);
    });


    it('search *', () => {

        const d = doc('1', 'identifier1', 'category');

        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, '*', ['category'])).toEqual(['1']);
    });


    it('index other field', () => {

        const d = doc('1', 'identifier1', 'category');

        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'short', ['category'])).toEqual(['1']);
    });


    it('tokenize fields', () => {

        const d1 = doc('1', 'hello token', 'category');
        const d2 = doc('2', 'another-one', 'category');
        const d3 = doc('3', 'last_one', 'category');

        FulltextIndex.put(fulltextIndex, d1, fieldsToIndex);
        FulltextIndex.put(fulltextIndex, d2, fieldsToIndex);
        FulltextIndex.put(fulltextIndex, d3, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'hello', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fulltextIndex, 'token', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fulltextIndex,'another', ['category'])).toEqual(['2']);
        expect(FulltextIndex.get(fulltextIndex,'one', ['category'])).toEqual(['2', '3']);
        expect(FulltextIndex.get(fulltextIndex,'last', ['category'])).toEqual(['3']);
    });


    it('find case insensitive', () => {

        const d1 = doc('1', 'Hello', 'category');
        const d2 = doc('2', 'something', 'category');

        FulltextIndex.put(fulltextIndex, d1, fieldsToIndex);
        FulltextIndex.put(fulltextIndex, d2, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'hello', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fulltextIndex,'Something', ['category'])).toEqual(['2']);
    });


    it('put overwrite', () => {

        const d = doc('1', 'identifier1', 'category');

        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        d['resource']['identifier'] = 'identifier2';

        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'identifier1', ['category'])).toEqual([]);
        expect(FulltextIndex.get(fulltextIndex, 'identifier2', ['category'])).toEqual(['1']);
    });


    it('shortDescription empty', () => {

        const d = doc('1', 'identifier1', 'category');
        d['resource']['shortDescription'] = '';
        expect(FulltextIndex.get(fulltextIndex, 'short', ['category'])).toEqual([]);
        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        d['resource']['shortDescription'] = undefined;
        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'short', ['category'])).toEqual([]);
        delete d['resource']['shortDescription'];
        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'short', ['category'])).toEqual([]);
    });


    it('index all language entries of shortDescription', () => {

        const d = doc('1', 'identifier1', 'category');
        d['resource']['shortDescription'] = { de: 'Deutsch', en: 'English', it: 'Italiano' };
        FulltextIndex.put(fulltextIndex, d, fieldsToIndex);
        expect(FulltextIndex.get(fulltextIndex, 'Deutsch', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fulltextIndex, 'English', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fulltextIndex, 'Italiano', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fulltextIndex, 'other', ['category'])).toEqual([]);
    });


    it('do a placeholder search', () => {

        const d1 = doc('1', 'Hello-A-0033', 'category');
        const d2 = doc('2', 'Hello-A-0021', 'category');
        const d3 = doc('3', 'Hello-A-0059', 'category');

        FulltextIndex.put(fulltextIndex, d1, fieldsToIndex);
        FulltextIndex.put(fulltextIndex, d2, fieldsToIndex);
        FulltextIndex.put(fulltextIndex, d3, fieldsToIndex);

        const results = FulltextIndex.get(fulltextIndex, 'Hello-A-00[23]', ['category']);
        expect(results.length).toBe(2);

        expect(results).toContain('1');
        expect(results).toContain('2');
    });


    it('index field specified in search configuration', () => {

        const document = doc('1', 'identifier1', 'category');
        document.resource.customField = 'testValue';
        const ie = IndexItem.from(document);
        FulltextIndex.put(fulltextIndex, document, fieldsToIndex.concat(['customField']));

        const results = FulltextIndex.get(fulltextIndex, 'testValue', ['category']);
        expect(results.length).toBe(1);
        expect(results[0]).toEqual('1');
    });
});
