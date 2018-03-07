"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fulltext_indexer_1 = require("../../../../../app/core/datastore/index/fulltext-indexer");
var static_1 = require("../../../../subsystem/static");
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('FulltextIndexer', function () {
    var fi;
    function doc(id, identifier, type, shortDescription) {
        if (shortDescription === void 0) { shortDescription = 'short'; }
        var doc = static_1.Static.doc(shortDescription, identifier, type, id);
        doc.created = { date: '2017-12-31' };
        doc.modified = [{ date: '2018-01-01' }];
        return doc;
    }
    function indexItem(id, identifier) {
        if (!identifier)
            identifier = 'identifier' + id;
        return {
            id: id,
            date: '2018-01-01',
            identifier: identifier
        };
    }
    beforeEach(function () {
        fi = new fulltext_indexer_1.FulltextIndexer(false);
    });
    it('match one with with different search terms', function () {
        fi.put(doc('1', 'identifier1', 'type'));
        expect(fi.get('identifier1', ['type'])).toEqual([indexItem('1')]);
        expect(fi.get('ide', ['type'])).toEqual([indexItem('1')]);
    });
    it('match two with the same search term', function () {
        fi.put(doc('1', 'identifier1', 'type'));
        fi.put(doc('2', 'identifier2', 'type'));
        expect(fi.get('identifier', ['type'])).toEqual([indexItem('1'), indexItem('2')]);
    });
    it('match in all types', function () {
        fi.put(doc('1', 'identifier1', 'type'));
        expect(fi.get('identifier', undefined)).toEqual([indexItem('1')]);
    });
    it('index short description', function () {
        var d = doc('1', 'identifier1', 'type', 'short');
        fi.put(d);
        expect(fi.get('short', undefined)).toEqual([indexItem('1')]);
    });
    it('do not index if no identifier', function () {
        var d = doc('1', 'identifier1', 'type', 'short');
        delete d.resource.identifier;
        fi.put(d);
        expect(fi.get('short', undefined)).toEqual([]);
    });
    it('do not index if no created and modified', function () {
        var d = doc('1', 'identifier1', 'type', 'short');
        delete d.modified;
        delete d.created;
        fi.put(d);
        expect(fi.get('short', undefined)).toEqual([]);
    });
    it('match in multiple selected types', function () {
        fi.put(doc('1', 'identifier1', 'type1'));
        fi.put(doc('2', 'identifier2', 'type2'));
        fi.put(doc('3', 'identifier3', 'type3'));
        expect(fi.get('identifier', ['type1', 'type2'])).toEqual([indexItem('1'), indexItem('2')]);
    });
    it('do not match search term', function () {
        fi.put(doc('1', 'iden', 'type'));
        expect(fi.get('identifier', ['type'])).toEqual([]);
    });
    it('do not match search in type', function () {
        fi.put(doc('1', 'iden', 'type1'));
        expect(fi.get('identifier', ['type2'])).toEqual([]);
    });
    it('match one with two search terms', function () {
        fi.put(doc('1', 'identifier1', 'type', 'a short description'));
        expect(fi.get('short description', ['type'])).toEqual([indexItem('1')]);
        expect(fi.get('a description', ['type'])).toEqual([indexItem('1')]);
    });
    it('ignore additional spaces', function () {
        fi.put(doc('1', 'identifier1', 'type', 'a short description'));
        expect(fi.get(' a    short  description  ', ['type'])).toEqual([indexItem('1')]);
    });
    it('no types present', function () {
        expect(fi.get('identifier', ['type'])).toEqual([]);
    });
    it('clear', function () {
        fi.put(doc('1', 'identifier1', 'type'));
        fi.clear();
        expect(fi.get('identifier', ['type'])).toEqual([]);
    });
    it('remove', function () {
        var d = doc('1', 'identifier1', 'type');
        fi.put(d);
        fi.remove(d);
        expect(fi.get('identifier', ['type'])).toEqual([]);
    });
    it('search *', function () {
        fi.put(doc('1', 'identifier1', 'type'));
        expect(fi.get('*', ['type'])).toEqual([indexItem('1')]);
    });
    it('index other field', function () {
        var d = doc('1', 'identifier1', 'type');
        fi.put(d);
        expect(fi.get('short', ['type'])).toEqual([indexItem('1')]);
    });
    it('tokenize fields', function () {
        var d = doc('1', 'hello token', 'type');
        fi.put(d);
        expect(fi.get('hello', ['type'])).toEqual([indexItem('1', 'hello token')]);
        expect(fi.get('token', ['type'])).toEqual([indexItem('1', 'hello token')]);
    });
    it('find case insensitive', function () {
        fi.put(doc('1', 'Hello', 'type'));
        fi.put(doc('2', 'something', 'type'));
        expect(fi.get('hello', ['type'])).toEqual([indexItem('1', 'Hello')]);
        expect(fi.get('Something', ['type'])).toEqual([indexItem('2', 'something')]);
    });
    it('put overwrite', function () {
        var d = doc('1', 'identifier1', 'type');
        fi.put(d);
        d['resource']['identifier'] = 'identifier2';
        fi.put(d);
        expect(fi.get('identifier1', ['type'])).toEqual([]);
        expect(fi.get('identifier2', ['type'])).toEqual([indexItem('1', 'identifier2')]);
    });
    it('shortDescription empty', function () {
        var d = doc('1', 'identifier1', 'type');
        d['resource']['shortDescription'] = '';
        expect(fi.get('short', ['type'])).toEqual([]);
        fi.put(d);
        d['resource']['shortDescription'] = undefined;
        fi.put(d);
        expect(fi.get('short', ['type'])).toEqual([]);
        delete d['resource']['shortDescription'];
        fi.put(d);
        expect(fi.get('short', ['type'])).toEqual([]);
    });
    it('do a placeholder search', function () {
        fi.put(doc('1', 'Hello-A-0033', 'type'));
        fi.put(doc('2', 'Hello-A-0021', 'type'));
        fi.put(doc('3', 'Hello-A-0059', 'type'));
        var results = fi.get('Hello-A-00[23]', ['type']).map(function (result) { return result.identifier; });
        expect(results.length).toBe(2);
        expect(results).toContain('Hello-A-0033');
        expect(results).toContain('Hello-A-0021');
    });
});
//# sourceMappingURL=fulltext-indexer.spec.js.map