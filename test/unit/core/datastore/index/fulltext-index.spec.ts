import {FulltextIndex} from '../../../../../src/app/core/datastore/index/fulltext-index';
import {IndexItem} from '../../../../../src/app/core/datastore/index/index-item';
import {Static} from '../../../static';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('FulltextIndex', () => {

    let fi;
    let categoriesMap;


    function doc(id, identifier, category, shortDescription = 'short') {

        const doc = Static.doc(shortDescription, identifier, category, id);
        doc.created = { date: '2017-12-31' } as any;
        doc.modified = [{ date: '2018-01-01' }] as any;
        return doc;
    }


    function indexItem(id, identifier?): IndexItem {

        if (!identifier) identifier = 'identifier' + id;
        return {
            id: id,
            identifier: identifier
        };
    }


    beforeEach(() => {

        fi = {};

        const defaultCategoryConfiguration = {
            groups: [{ fields: [
                { name: 'identifier' },
                { name: 'shortDescription' }
            ]}]
        };

        categoriesMap = {
            category: defaultCategoryConfiguration,
            category1: defaultCategoryConfiguration,
            category2: defaultCategoryConfiguration,
            category3: defaultCategoryConfiguration
        };
    });


    it('match one with different search terms', () => {

        const d = doc('1', 'identifier1', 'category');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, categoriesMap);
        expect(FulltextIndex.get(fi, 'identifier1', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fi,'ide', ['category'])).toEqual(['1']);
    });


    it('match two with the same search term', () => {

        const d1 = doc('1', 'identifier1', 'category');
        const ie1 = IndexItem.from(d1);
        const d2 = doc('2', 'identifier2', 'category');
        const ie2 = IndexItem.from(d2);

        FulltextIndex.put(fi, d1, ie1, categoriesMap);
        FulltextIndex.put(fi, d2, ie2, categoriesMap);
        expect(FulltextIndex.get(fi, 'identifier', ['category'])).toEqual(['1', '2']);
    });


    it('match in all categories', () => {

        const d = doc('1', 'identifier1', 'category');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, categoriesMap);
        expect(FulltextIndex.get(fi, 'identifier', undefined)).toEqual(['1']);
    });


    it('index short description', () => {

        const d = doc('1', 'identifier1', 'category', 'short');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, categoriesMap);
        expect(FulltextIndex.get(fi, 'short', undefined)).toEqual(['1']);
    });


    it('match in multiple selected categories', () => {

        const d1 = doc('1', 'identifier1', 'category1');
        const ie1 = IndexItem.from(d1);
        const d2 = doc('2', 'identifier2', 'category2');
        const ie2 = IndexItem.from(d2);
        const d3 = doc('3', 'identifier3', 'category3');
        const ie3 = IndexItem.from(d3);

        FulltextIndex.put(fi, d1, ie1, categoriesMap);
        FulltextIndex.put(fi, d2, ie2, categoriesMap);
        FulltextIndex.put(fi, d3, ie3, categoriesMap);
        expect(FulltextIndex.get(fi, 'identifier', ['category1', 'category2'])).toEqual(['1', '2']);
    });


    it('do not match search term', () => {

        const d = doc('1', 'iden', 'category');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, categoriesMap);
        expect(FulltextIndex.get(fi, 'identifier', ['category'])).toEqual([]);
    });


    it('do not match search in category', () => {

        const d = doc('1', 'iden', 'category1');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, categoriesMap);
        expect(FulltextIndex.get(fi, 'identifier', ['category2'])).toEqual([]);
    });


    it('match one with two search terms', () => {

        const d = doc('1', 'identifier1', 'category', 'a short description');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, categoriesMap);
        expect(FulltextIndex.get(fi,'short description', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fi, 'a description', ['category'])).toEqual(['1']);
    });


    it('ignore additional spaces and hyphens', () => {

        const d = doc('1', 'identifier1', 'category', 'a short description');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, categoriesMap);
        expect(FulltextIndex.get(fi, ' a    short  description  ', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fi,'-a----short--description--', ['category'])).toEqual(['1']);
    });


    it('no categories present', () => {

        expect(FulltextIndex.get(fi, 'identifier', ['category'])).toEqual([]);
    });


    it('remove', () => {

        const d = doc('1', 'identifier1', 'category');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, categoriesMap);
        FulltextIndex.remove(fi, d);
        expect(FulltextIndex.get(fi, 'identifier', ['category'])).toEqual([]);
    });


    it('search *', () => {

        const d = doc('1', 'identifier1', 'category');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, categoriesMap);
        expect(FulltextIndex.get(fi, '*', ['category'])).toEqual(['1']);
    });


    it('index other field', () => {

        const d = doc('1', 'identifier1', 'category');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, categoriesMap);
        expect(FulltextIndex.get(fi, 'short', ['category'])).toEqual(['1']);
    });


    it('tokenize fields', () => {

        const d1 = doc('1', 'hello token', 'category');
        const ie1 = IndexItem.from(d1);
        const d2 = doc('2', 'another-one', 'category');
        const ie2 = IndexItem.from(d2);

        FulltextIndex.put(fi, d1, ie1, categoriesMap);
        FulltextIndex.put(fi, d2, ie2, categoriesMap);
        expect(FulltextIndex.get(fi, 'hello', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fi, 'token', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fi,'another', ['category'])).toEqual(['2']);
        expect(FulltextIndex.get(fi,'one', ['category'])).toEqual(['2']);
    });


    it('find case insensitive', () => {

        const d1 = doc('1', 'Hello', 'category');
        const ie1 = IndexItem.from(d1);
        const d2 = doc('2', 'something', 'category');
        const ie2 = IndexItem.from(d2);

        FulltextIndex.put(fi, d1, ie1, categoriesMap);
        FulltextIndex.put(fi, d2, ie2, categoriesMap);
        expect(FulltextIndex.get(fi, 'hello', ['category'])).toEqual(['1']);
        expect(FulltextIndex.get(fi,'Something', ['category'])).toEqual(['2']);
    });


    it('put overwrite', () => {

        const d = doc('1', 'identifier1', 'category');
        const ie1 = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie1, categoriesMap);
        d['resource']['identifier'] = 'identifier2';
        const ie2 = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie2, categoriesMap);
        expect(FulltextIndex.get(fi, 'identifier1', ['category'])).toEqual([]);
        expect(FulltextIndex.get(fi, 'identifier2', ['category'])).toEqual(['1']);
    });


    it('shortDescription empty', () => {

        const d = doc('1', 'identifier1', 'category');
        d['resource']['shortDescription'] = '';
        const ie1 = IndexItem.from(d);
        expect(FulltextIndex.get(fi, 'short', ['category'])).toEqual([]);
        FulltextIndex.put(fi, d, ie1, categoriesMap);
        d['resource']['shortDescription'] = undefined;
        const ie2 = IndexItem.from(d);
        FulltextIndex.put(fi, d, ie2, categoriesMap);
        expect(FulltextIndex.get(fi, 'short', ['category'])).toEqual([]);
        delete d['resource']['shortDescription'];
        const ie3 = IndexItem.from(d);
        FulltextIndex.put(fi, d, ie3, categoriesMap);
        expect(FulltextIndex.get(fi, 'short', ['category'])).toEqual([]);
    });


    it('do a placeholder search', () => {

        const d1 = doc('1', 'Hello-A-0033', 'category');
        const ie1 = IndexItem.from(d1);
        const d2 = doc('2', 'Hello-A-0021', 'category');
        const ie2 = IndexItem.from(d2);
        const d3 = doc('3', 'Hello-A-0059', 'category');
        const ie3 = IndexItem.from(d3);

        FulltextIndex.put(fi, d1, ie1, categoriesMap);
        FulltextIndex.put(fi, d2, ie2, categoriesMap);
        FulltextIndex.put(fi, d3, ie3, categoriesMap);

        const results = FulltextIndex.get(fi, 'Hello-A-00[23]', ['category'])
        expect(results.length).toBe(2);

        expect(results).toContain('1');
        expect(results).toContain('2');
    });


    it('index field specified in search configuration', () => {

       categoriesMap = {
           category: {
                groups: [{ fields: [
                    { name: 'identifier' },
                    { name: 'shortDescription' },
                    { name: 'customField', fulltextIndexed: true }
                ]}]
            }
        };

        const document = doc('1', 'identifier1', 'category');
        document.resource.customField = 'testValue';
        const ie = IndexItem.from(document);
        FulltextIndex.put(fi, document, ie, categoriesMap);

        const results = FulltextIndex.get(fi, 'testValue', ['category']);
        expect(results.length).toBe(1);
        expect(results[0]).toEqual('1');
    });
});
