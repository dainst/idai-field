import {FulltextIndex} from '../../../../../app/core/datastore/index/fulltext-index';
import {IndexItem} from '../../../../../app/core/datastore/index/index-item';
import {Static} from '../../../static';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('FulltextIndexer', () => {

    let fi;
    let typesMap;


    function doc(id, identifier, type, shortDescription = 'short') {

        const doc = Static.doc(shortDescription, identifier, type, id);
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

        const defaultTypeConfiguration = {
            fields: [
                { name: 'identifier' },
                { name: 'shortDescription' }
            ]
        };

        typesMap = {
            type: defaultTypeConfiguration,
            type1: defaultTypeConfiguration,
            type2: defaultTypeConfiguration,
            type3: defaultTypeConfiguration
        };
    });


    it('match one with different search terms', () => {

        const d = doc('1', 'identifier1', 'type');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, typesMap);
        expect(FulltextIndex.get(fi, 'identifier1', ['type'])).toEqual([indexItem('1')]);
        expect(FulltextIndex.get(fi,'ide', ['type'])).toEqual([indexItem('1')]);
    });


    it('match two with the same search term', () => {

        const d1 = doc('1', 'identifier1', 'type');
        const ie1 = IndexItem.from(d1);
        const d2 = doc('2', 'identifier2', 'type');
        const ie2 = IndexItem.from(d2);

        FulltextIndex.put(fi, d1, ie1, typesMap);
        FulltextIndex.put(fi, d2, ie2, typesMap);
        expect(FulltextIndex.get(fi, 'identifier', ['type'])).toEqual([indexItem('1'), indexItem('2')]);
    });


    it('match in all types', () => {

        const d = doc('1', 'identifier1', 'type');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, typesMap);
        expect(FulltextIndex.get(fi, 'identifier', undefined)).toEqual([indexItem('1')]);
    });


    it('index short description', () => {

        const d = doc('1', 'identifier1', 'type', 'short');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, typesMap);
        expect(FulltextIndex.get(fi, 'short', undefined)).toEqual([indexItem('1')]);
    });


    // TODO review
    xit('do not index if no identifier', () => { // tests interaction with IndexItem

        const d = doc('1', 'identifier1', 'type', 'short');
        delete d.resource.identifier;
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, typesMap);
        expect(FulltextIndex.get(fi, 'short', undefined)).toEqual([]);
    });


    it('match in multiple selected types', () => {

        const d1 = doc('1', 'identifier1', 'type1');
        const ie1 = IndexItem.from(d1);
        const d2 = doc('2', 'identifier2', 'type2');
        const ie2 = IndexItem.from(d2);
        const d3 = doc('3', 'identifier3', 'type3');
        const ie3 = IndexItem.from(d3);

        FulltextIndex.put(fi, d1, ie1, typesMap);
        FulltextIndex.put(fi, d2, ie2, typesMap);
        FulltextIndex.put(fi, d3, ie3, typesMap);
        expect(FulltextIndex.get(fi, 'identifier', ['type1', 'type2'])).toEqual([indexItem('1'), indexItem('2')]);
    });


    it('do not match search term', () => {

        const d = doc('1', 'iden', 'type');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, typesMap);
        expect(FulltextIndex.get(fi, 'identifier', ['type'])).toEqual([]);
    });


    it('do not match search in type', () => {

        const d = doc('1', 'iden', 'type1');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, typesMap);
        expect(FulltextIndex.get(fi, 'identifier', ['type2'])).toEqual([]);
    });


    it('match one with two search terms', () => {

        const d = doc('1', 'identifier1', 'type', 'a short description');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, typesMap);
        expect(FulltextIndex.get(fi,'short description', ['type'])).toEqual([indexItem('1')]);
        expect(FulltextIndex.get(fi, 'a description', ['type'])).toEqual([indexItem('1')]);
    });


    it('ignore additional spaces and hyphens', () => {

        const d = doc('1', 'identifier1', 'type', 'a short description');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, typesMap);
        expect(FulltextIndex.get(fi, ' a    short  description  ', ['type'])).toEqual([indexItem('1')]);
        expect(FulltextIndex.get(fi,'-a----short--description--', ['type'])).toEqual([indexItem('1')]);
    });


    it('no types present', () => {

        expect(FulltextIndex.get(fi, 'identifier', ['type'])).toEqual([]);
    });


    it('remove', () => {

        const d = doc('1', 'identifier1', 'type');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, typesMap);
        FulltextIndex.remove(fi, d);
        expect(FulltextIndex.get(fi, 'identifier', ['type'])).toEqual([]);
    });


    it('search *', () => {

        const d = doc('1', 'identifier1', 'type');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, typesMap);
        expect(FulltextIndex.get(fi, '*', ['type'])).toEqual([indexItem('1')]);
    });


    it('index other field', () => {

        const d = doc('1', 'identifier1', 'type');
        const ie = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie, typesMap);
        expect(FulltextIndex.get(fi, 'short', ['type'])).toEqual([indexItem('1')]);
    });


    it('tokenize fields', () => {

        const d1 = doc('1', 'hello token', 'type');
        const ie1 = IndexItem.from(d1);
        const d2 = doc('2', 'another-one', 'type');
        const ie2 = IndexItem.from(d2);

        FulltextIndex.put(fi, d1, ie1, typesMap);
        FulltextIndex.put(fi, d2, ie2, typesMap);
        expect(FulltextIndex.get(fi, 'hello', ['type'])).toEqual([indexItem('1','hello token')]);
        expect(FulltextIndex.get(fi, 'token', ['type'])).toEqual([indexItem('1','hello token')]);
        expect(FulltextIndex.get(fi,'another', ['type'])).toEqual([indexItem('2','another-one')]);
        expect(FulltextIndex.get(fi,'one', ['type'])).toEqual([indexItem('2','another-one')]);
    });


    it('find case insensitive', () => {

        const d1 = doc('1', 'Hello', 'type');
        const ie1 = IndexItem.from(d1);
        const d2 = doc('2', 'something', 'type');
        const ie2 = IndexItem.from(d2);

        FulltextIndex.put(fi, d1, ie1, typesMap);
        FulltextIndex.put(fi, d2, ie2, typesMap);
        expect(FulltextIndex.get(fi, 'hello', ['type'])).toEqual([indexItem('1','Hello')]);
        expect(FulltextIndex.get(fi,'Something', ['type'])).toEqual([indexItem('2','something')]);
    });


    it('put overwrite', () => {

        const d = doc('1', 'identifier1', 'type');
        const ie1 = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie1, typesMap);
        d['resource']['identifier'] = 'identifier2';
        const ie2 = IndexItem.from(d);

        FulltextIndex.put(fi, d, ie2, typesMap);
        expect(FulltextIndex.get(fi, 'identifier1', ['type'])).toEqual([]);
        expect(FulltextIndex.get(fi, 'identifier2', ['type'])).toEqual([indexItem('1','identifier2')]);
    });


    it('shortDescription empty', () => {

        const d = doc('1', 'identifier1', 'type');
        d['resource']['shortDescription'] = '';
        const ie1 = IndexItem.from(d);
        expect(FulltextIndex.get(fi, 'short', ['type'])).toEqual([]);
        FulltextIndex.put(fi, d, ie1, typesMap);
        d['resource']['shortDescription'] = undefined;
        const ie2 = IndexItem.from(d);
        FulltextIndex.put(fi, d, ie2, typesMap);
        expect(FulltextIndex.get(fi, 'short', ['type'])).toEqual([]);
        delete d['resource']['shortDescription'];
        const ie3 = IndexItem.from(d);
        FulltextIndex.put(fi, d, ie3, typesMap);
        expect(FulltextIndex.get(fi, 'short', ['type'])).toEqual([]);
    });


    it('do a placeholder search', () => {

        const d1 = doc('1', 'Hello-A-0033', 'type');
        const ie1 = IndexItem.from(d1);
        const d2 = doc('2', 'Hello-A-0021', 'type');
        const ie2 = IndexItem.from(d2);
        const d3 = doc('3', 'Hello-A-0059', 'type');
        const ie3 = IndexItem.from(d3);

        FulltextIndex.put(fi, d1, ie1, typesMap);
        FulltextIndex.put(fi, d2, ie2, typesMap);
        FulltextIndex.put(fi, d3, ie3, typesMap);

        const results = FulltextIndex.get(fi, 'Hello-A-00[23]', ['type']).map(result => result.identifier);
        expect(results.length).toBe(2);

        expect(results).toContain('Hello-A-0033');
        expect(results).toContain('Hello-A-0021');
    });


    it('index field specified in search configuration', () => {

       typesMap = {
            type: {
                fields: [
                    { name: 'identifier' },
                    { name: 'shortDescription' },
                    { name: 'customField', fulltextIndexed: true }
                ]
            }
        };

        const document = doc('1', 'identifier1', 'type');
        document.resource.customField = 'testValue';
        const ie = IndexItem.from(document);
        FulltextIndex.put(fi, document, ie, typesMap);

        const results = FulltextIndex.get(fi, 'testValue', ['type']).map(result => result.identifier);
        expect(results.length).toBe(1);
        expect(results[0]).toEqual('identifier1');
    });
});