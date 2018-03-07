"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var static_1 = require("../../../../subsystem/static");
var index_facade_1 = require("../../../../../app/core/datastore/index/index-facade");
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
describe('IndexFacade', function () {
    var indexFacade;
    beforeEach(function () {
        var _a = static_1.Static.createIndexers(), constraintIndexer = _a[0], fulltextIndexer = _a[1];
        indexFacade = new index_facade_1.IndexFacade(constraintIndexer, fulltextIndexer);
    });
    it('should find with filterSet undefined', function () {
        var doc1 = static_1.Static.doc('sd1', 'identifier1', 'Find', 'id1');
        indexFacade.put(doc1);
        var result = indexFacade.perform({ q: 'identifier' });
        expect(result[0]).toBe('id1');
    });
    it('should find with prefix query undefined', function () {
        var doc1 = static_1.Static.doc('sd1', 'identifier1', 'Find', 'id1');
        indexFacade.put(doc1);
        var result = indexFacade.perform({ q: undefined });
        expect(result[0]).toBe('id1');
    });
    it('should find with omitted q', function () {
        var doc1 = static_1.Static.doc('sd1', 'identifier1', 'Find', 'id1');
        indexFacade.put(doc1);
        var result = indexFacade.perform({});
        expect(result[0]).toBe('id1');
    });
    it('should find with omitted q and ommitted prefix', function () {
        var doc1 = static_1.Static.doc('sd1', 'identifier1', 'Find', 'id1');
        indexFacade.put(doc1);
        var result = indexFacade.perform({});
        expect(result[0]).toBe('id1');
    });
    it('should match all fields', function () {
        var doc1 = static_1.Static.doc('bla', 'identifier1', 'Find', 'id1');
        var doc2 = static_1.Static.doc('sd2', 'bla', 'Find', 'id2');
        indexFacade.put(doc1);
        indexFacade.put(doc2);
        var result = indexFacade.perform({ q: 'bla' });
        expect(result.length).toBe(2);
    });
    it('should filter by one type in find', function () {
        var doc1 = static_1.Static.doc('bla1', 'blub', 'type1', 'id1');
        var doc2 = static_1.Static.doc('bla2', 'blub', 'type2', 'id2');
        var doc3 = static_1.Static.doc('bla3', 'blub', 'type3', 'id3');
        indexFacade.put(doc1);
        indexFacade.put(doc2);
        indexFacade.put(doc3);
        var result = indexFacade.perform({ q: 'blub', types: ['type3'] });
        expect(result.length).toBe(1);
        expect(result[0]).toBe('id3');
    });
    it('should find by prefix query and filter', function () {
        var doc1 = static_1.Static.doc('bla1', 'blub1', 'type1', 'id1');
        var doc2 = static_1.Static.doc('bla2', 'blub2', 'type2', 'id2');
        var doc3 = static_1.Static.doc('bla3', 'blub3', 'type2', 'id3');
        indexFacade.put(doc1);
        indexFacade.put(doc2);
        indexFacade.put(doc3);
        var result = indexFacade.perform({
            q: 'blub',
            types: ['type2']
        });
        expect(result.length).toBe(2);
        expect(result[0]).not.toBe('id1');
        expect(result[1]).not.toBe('id1');
    });
    it('should filter with constraint', function () {
        var doc1 = static_1.Static.doc('bla1', 'blub1', 'type1', 'id1');
        var doc2 = static_1.Static.doc('bla2', 'blub2', 'type2', 'id2');
        var doc3 = static_1.Static.doc('bla3', 'blub3', 'type2', 'id3');
        var doc4 = static_1.Static.doc('bla4', 'blub4', 'type2', 'id4');
        doc2.resource.relations['isRecordedIn'] = ['id1'];
        doc3.resource.relations['isRecordedIn'] = ['id1'];
        doc4.resource.relations['isRecordedIn'] = ['id2'];
        var q = {
            q: 'blub',
            constraints: {
                'isRecordedIn:contain': 'id1'
            }
        };
        indexFacade.put(doc1);
        indexFacade.put(doc2);
        indexFacade.put(doc3);
        indexFacade.put(doc4);
        var result = indexFacade.perform(q);
        expect(result).toContain('id2');
        expect(result).toContain('id3');
        expect(result.length).toBe(2);
    });
    it('should filter with multiple constraints', function () {
        var doc1 = static_1.Static.doc('bla1', 'blub1', 'type1', 'id1');
        var doc2 = static_1.Static.doc('bla2', 'blub2', 'type2', 'id2');
        doc2.resource.relations['isRecordedIn'] = ['id1'];
        var doc3 = static_1.Static.doc('bla3', 'blub3', 'type2', 'id3');
        doc3.resource.relations['isRecordedIn'] = ['id1'];
        doc3.resource.relations['liesWithin'] = ['id2'];
        var q = {
            q: 'blub',
            constraints: {
                'isRecordedIn:contain': 'id1',
                'liesWithin:contain': 'id2'
            }
        };
        indexFacade.put(doc1);
        indexFacade.put(doc2);
        indexFacade.put(doc3);
        var result = indexFacade.perform(q);
        expect(result[0]).toBe('id3');
        expect(result.length).toBe(1);
    });
    it('should filter with a subtract constraint', function () {
        var doc1 = static_1.Static.doc('Document 1', 'doc1', 'type1', 'id1');
        var doc2 = static_1.Static.doc('Document 2', 'doc2', 'type1', 'id2');
        var doc3 = static_1.Static.doc('Document 3', 'doc3', 'type2', 'id3');
        doc3.resource.relations['isRecordedIn'] = ['id1'];
        var doc4 = static_1.Static.doc('Document 4', 'doc4', 'type2', 'id4');
        doc4.resource.relations['isRecordedIn'] = ['id2'];
        var q = {
            q: 'doc',
            constraints: {
                'isRecordedIn:contain': { value: 'id2', type: 'subtract' }
            }
        };
        indexFacade.put(doc1);
        indexFacade.put(doc2);
        indexFacade.put(doc3);
        indexFacade.put(doc4);
        var result = indexFacade.perform(q);
        expect(result.length).toBe(3);
        expect(result).toEqual(['id1', 'id2', 'id3']);
    });
    it('should sort by last modified descending', function () {
        var doc1 = static_1.Static.doc('bla1', 'blub1', 'type1', 'id1');
        var doc3 = static_1.Static.doc('bla3', 'blub3', 'type3', 'id3');
        doc3.resource.relations['isRecordedIn'] = ['id1'];
        setTimeout(function () {
            var doc2 = static_1.Static.doc('bla2', 'blub2', 'type2', 'id2');
            doc2.resource.relations['isRecordedIn'] = ['id1'];
            var q = {
                q: 'blub',
                constraints: {
                    'isRecordedIn:contain': 'id1'
                }
            };
            indexFacade.put(doc1);
            indexFacade.put(doc2);
            indexFacade.put(doc3);
            var result = indexFacade.perform(q);
            expect(result.length).toBe(2);
            expect(result[0]).toBe('id2');
            expect(result[1]).toBe('id3');
        }, 100);
    });
});
//# sourceMappingURL=index-facade.spec.js.map