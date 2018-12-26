import {FulltextIndexer} from '../../../../../app/core/datastore/index/fulltext-indexer';
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
            date: ('2018-01-01' as any),
            identifier: identifier
        };
    }


    beforeEach(() => {

        fi = FulltextIndexer.setUp({showWarnings: false, index: {}});

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

        FulltextIndexer.put(fi, doc('1', 'identifier1', 'type'), typesMap);
        expect(FulltextIndexer.get(fi, 'identifier1', ['type'])).toEqual([indexItem('1')]);
        expect(FulltextIndexer.get(fi,'ide', ['type'])).toEqual([indexItem('1')]);
    });


    it('match two with the same search term', () => {

        FulltextIndexer.put(fi, doc('1', 'identifier1', 'type'), typesMap);
        FulltextIndexer.put(fi, doc('2', 'identifier2', 'type'), typesMap);
        expect(FulltextIndexer.get(fi, 'identifier', ['type'])).toEqual([indexItem('1'), indexItem('2')]);
    });


    it('match in all types', () => {

        FulltextIndexer.put(fi, doc('1', 'identifier1', 'type'), typesMap);
        expect(FulltextIndexer.get(fi, 'identifier', undefined)).toEqual([indexItem('1')]);
    });


    it('index short description', () => {

        const d = doc('1', 'identifier1', 'type', 'short');

        FulltextIndexer.put(fi, d, typesMap);
        expect(FulltextIndexer.get(fi, 'short', undefined)).toEqual([indexItem('1')]);
    });


    it('do not index if no identifier', () => { // tests interaction with IndexItem

        const d = doc('1', 'identifier1', 'type', 'short');
        delete d.resource.identifier;

        FulltextIndexer.put(fi, d, typesMap);
        expect(FulltextIndexer.get(fi, 'short', undefined)).toEqual([]);
    });


    it('do not index if no created and modified', () => { // tests interaction with IndexItem

        const d = doc('1', 'identifier1', 'type', 'short');
        delete d.modified;
        delete d.created;

        FulltextIndexer.put(fi, d, typesMap);
        expect(FulltextIndexer.get(fi, 'short', undefined)).toEqual([]);
    });


    it('match in multiple selected types', () => {

        FulltextIndexer.put(fi, doc('1', 'identifier1', 'type1'), typesMap);
        FulltextIndexer.put(fi, doc('2', 'identifier2', 'type2'), typesMap);
        FulltextIndexer.put(fi, doc('3', 'identifier3', 'type3'), typesMap);
        expect(FulltextIndexer.get(fi, 'identifier', ['type1', 'type2'])).toEqual([indexItem('1'), indexItem('2')]);
    });


    it('do not match search term', () => {

        FulltextIndexer.put(fi, doc('1', 'iden', 'type'), typesMap);
        expect(FulltextIndexer.get(fi, 'identifier', ['type'])).toEqual([]);
    });


    it('do not match search in type', () => {

        FulltextIndexer.put(fi, doc('1', 'iden', 'type1'), typesMap);
        expect(FulltextIndexer.get(fi, 'identifier', ['type2'])).toEqual([]);
    });


    it('match one with two search terms', () => {

        FulltextIndexer.put(fi, doc('1', 'identifier1', 'type', 'a short description'), typesMap);
        expect(FulltextIndexer.get(fi,'short description', ['type'])).toEqual([indexItem('1')]);
        expect(FulltextIndexer.get(fi, 'a description', ['type'])).toEqual([indexItem('1')]);
    });


    it('ignore additional spaces and hyphens', () => {

        FulltextIndexer.put(fi, doc('1', 'identifier1', 'type', 'a short description'), typesMap);
        expect(FulltextIndexer.get(fi, ' a    short  description  ', ['type'])).toEqual([indexItem('1')]);
        expect(FulltextIndexer.get(fi,'-a----short--description--', ['type'])).toEqual([indexItem('1')]);
    });


    it('no types present', () => {

        expect(FulltextIndexer.get(fi, 'identifier', ['type'])).toEqual([]);
    });


    it('clear', () => {

        FulltextIndexer.put(fi, doc('1', 'identifier1', 'type'), typesMap);
        FulltextIndexer.clear(fi);
        expect(FulltextIndexer.get(fi, 'identifier', ['type'])).toEqual([]);
    });


    it('remove', () => {

        const d = doc('1', 'identifier1', 'type');
        FulltextIndexer.put(fi, d, typesMap);
        FulltextIndexer.remove(fi, d);
        expect(FulltextIndexer.get(fi, 'identifier', ['type'])).toEqual([]);
    });


    it('search *', () => {

        FulltextIndexer.put(fi, doc('1', 'identifier1', 'type'), typesMap);
        expect(FulltextIndexer.get(fi, '*', ['type'])).toEqual([indexItem('1')]);
    });


    it('index other field', () => {

        const d = doc('1', 'identifier1', 'type');
        FulltextIndexer.put(fi, d, typesMap);
        expect(FulltextIndexer.get(fi, 'short', ['type'])).toEqual([indexItem('1')]);
    });


    it('tokenize fields', () => {

        FulltextIndexer.put(fi, doc('1', 'hello token', 'type'), typesMap);
        FulltextIndexer.put(fi, doc('2', 'another-one', 'type'), typesMap);
        expect(FulltextIndexer.get(fi, 'hello', ['type'])).toEqual([indexItem('1','hello token')]);
        expect(FulltextIndexer.get(fi, 'token', ['type'])).toEqual([indexItem('1','hello token')]);
        expect(FulltextIndexer.get(fi,'another', ['type'])).toEqual([indexItem('2','another-one')]);
        expect(FulltextIndexer.get(fi,'one', ['type'])).toEqual([indexItem('2','another-one')]);
    });


    it('find case insensitive', () => {

        FulltextIndexer.put(fi, doc('1', 'Hello', 'type'), typesMap);
        FulltextIndexer.put(fi, doc('2', 'something', 'type'), typesMap);
        expect(FulltextIndexer.get(fi, 'hello', ['type'])).toEqual([indexItem('1','Hello')]);
        expect(FulltextIndexer.get(fi,'Something', ['type'])).toEqual([indexItem('2','something')]);
    });


    it('put overwrite', () => {

        const d = doc('1', 'identifier1', 'type');
        FulltextIndexer.put(fi, d, typesMap);
        d['resource']['identifier'] = 'identifier2';
        FulltextIndexer.put(fi, d, typesMap);
        expect(FulltextIndexer.get(fi, 'identifier1', ['type'])).toEqual([]);
        expect(FulltextIndexer.get(fi, 'identifier2', ['type'])).toEqual([indexItem('1','identifier2')]);
    });


    it('shortDescription empty', () => {

        const d = doc('1', 'identifier1', 'type');
        d['resource']['shortDescription'] = '';
        expect(FulltextIndexer.get(fi, 'short', ['type'])).toEqual([]);
        FulltextIndexer.put(fi, d, typesMap);
        d['resource']['shortDescription'] = undefined;
        FulltextIndexer.put(fi, d, typesMap);
        expect(FulltextIndexer.get(fi, 'short', ['type'])).toEqual([]);
        delete d['resource']['shortDescription'];
        FulltextIndexer.put(fi, d, typesMap);
        expect(FulltextIndexer.get(fi, 'short', ['type'])).toEqual([]);
    });


    it('do a placeholder search', () => {

        FulltextIndexer.put(fi, doc('1', 'Hello-A-0033', 'type'), typesMap);
        FulltextIndexer.put(fi, doc('2', 'Hello-A-0021', 'type'), typesMap);
        FulltextIndexer.put(fi, doc('3', 'Hello-A-0059', 'type'), typesMap);

        const results = FulltextIndexer.get(fi, 'Hello-A-00[23]', ['type']).map(result => result.identifier);
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
        FulltextIndexer.put(fi, document, typesMap);

        const results = FulltextIndexer.get(fi, 'testValue', ['type']).map(result => result.identifier);
        expect(results.length).toBe(1);
        expect(results[0]).toEqual('identifier1');
    });
});