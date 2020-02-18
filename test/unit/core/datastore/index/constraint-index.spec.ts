import {to} from 'tsfun';
import {ConstraintIndex} from '../../../../../app/core/datastore/index/constraint-index';
import {IndexItem} from '../../../../../app/core/datastore/index/index-item';
import {doc} from '../test-helpers';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ConstraintIndex', () => {

    let ci;
    let typesMap;


    beforeEach(() => {

        typesMap = {
            type: {
                fields: [
                    { name: 'identifier' },
                    { name: 'shortDescription' }
                ]
            }
        };
    });


    // @deprecated, use IndexItem.from directly
    function indexItem(id, identifier?): IndexItem {

        if (!identifier) identifier = 'identifier' + id;
        return { id: id, identifier: identifier };
    }


    it('multiple docs are recorded in another', () => {

        const docs = [
            doc('2'),
            doc('3')
        ];
        docs[0].resource.relations['isRecordedIn'] = ['1'];
        const ie1 = IndexItem.from(docs[0]);
        docs[1].resource.relations['isRecordedIn'] = ['1'];
        const ie2 = IndexItem.from(docs[1]);

        ci = ConstraintIndex.make({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' }
        }, typesMap);

        ConstraintIndex.put(ci, docs[0], ie1);
        ConstraintIndex.put(ci, docs[1], ie2);

        expect(ConstraintIndex.get(ci,
            'isRecordedIn:contain', '1')).toEqual([indexItem('2'), indexItem('3')]);
    });


    function docWithMultipleConstraintTargets() {

        const docs = [
            doc('1')
        ];
        docs[0].resource.relations['isRecordedIn'] = ['2', '3'];
        const ie = IndexItem.from(docs[0]);

        ci = ConstraintIndex.make({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' }
        }, typesMap);

        ConstraintIndex.put(ci, docs[0], ie);
        return docs;
    }


    it('one doc is recorded in multiple others', () => {

        docWithMultipleConstraintTargets();

        expect(ConstraintIndex.get(ci, 'isRecordedIn:contain', '2')).toEqual([indexItem('1')]);
        expect(ConstraintIndex.get(ci,'isRecordedIn:contain', '3')).toEqual([indexItem('1')]);
    });


    function docWithMultipleConstraints() {

        const docs = [
            doc('1')
        ];
        docs[0].resource.relations['isRecordedIn'] = ['2'];
        docs[0].resource.relations['liesWithin'] = ['3'];
        const ie = IndexItem.from(docs[0]);

        ci = ConstraintIndex.make({
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        }, typesMap);

        ConstraintIndex.put(ci, docs[0], ie);
        return docs;
    }


    it('works for multiple constrains', () => {

        docWithMultipleConstraints();

        expect(ConstraintIndex.get(ci, 'liesWithin:contain', '3')).toEqual([indexItem('1')]);
        expect(ConstraintIndex.get(ci, 'isRecordedIn:contain', '2')).toEqual([indexItem('1')]);
    });


    it('index also works if doc does not have the field', () => {

        const docs = [
            doc('1')
        ];
        const ie = IndexItem.from(docs[0]);

        ci = ConstraintIndex.make({
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' }
        }, typesMap);

        ConstraintIndex.put(ci, docs[0], ie);

        expect(ConstraintIndex.get(ci, 'liesWithin:contain', '3')).toEqual([]);
    });


    it('work with non arrays', () => {

        ci = ConstraintIndex.make({
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        }, typesMap);
        const d = doc('1');
        const ie = IndexItem.from(d);
        ConstraintIndex.put(ci, d, ie);
        expect(ConstraintIndex.get(ci, 'identifier:match', 'identifier1')).toEqual([indexItem('1')]);
    });


    it('do not index if no identifier', () => { // tests interaction with IndexItem

        ci = ConstraintIndex.make({
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        }, typesMap);
        const doc0 = doc('1');
        delete doc0.resource.identifier;
        const ie = IndexItem.from(doc0);
        ConstraintIndex.put(ci, doc0, ie);
        expect(ConstraintIndex.get(ci, 'identifier:match', 'identifier1')).toEqual([]);
    });


    it('clear index', () => {

        ci = ConstraintIndex.make({
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        }, typesMap);
        const d = doc('1');
        const ie = IndexItem.from(d);
        ConstraintIndex.put(ci, d, ie);
        ConstraintIndex.clear(ci);
        expect(ConstraintIndex.get(ci, 'identifier:match', 'identifier1')).toEqual([]);
    });


    it('ask for one existing index and one nonexisting index', () => {

        ci = ConstraintIndex.make({
            'identifier:contain': { path: 'resource.identifier', type: 'contain' }
        }, typesMap);

        expect(ConstraintIndex.get(ci, 'identifier:contain', 'identifier1')).toEqual([]);
    });


    it('remove doc', () => {

        const doc = docWithMultipleConstraints()[0];

        ConstraintIndex.remove(ci, doc);

        expect(ConstraintIndex.get(ci, 'identifier:match', 'identifier1')).toEqual([]);
        expect(ConstraintIndex.get(ci, 'isRecordedIn:contain', '2')).toEqual([]);
        expect(ConstraintIndex.get(ci, 'liesWithin:contain', '3')).toEqual([]);
    });


    it('remove where one doc was recorded in multiple docs for the same constraint', () => {

        const doc = docWithMultipleConstraintTargets()[0];

        ConstraintIndex.remove(ci, doc);

        expect(ConstraintIndex.get(ci, 'isRecordedIn:contain', '2')).toEqual([]);
        expect(ConstraintIndex.get(ci, 'isRecordedIn:contain', '3')).toEqual([]);
    });


    it('update docs where the relations change', () => {

        const doc = docWithMultipleConstraints()[0];

        doc.resource.relations['isRecordedIn'] = ['4'];
        doc.resource.relations['liesWithin'] = ['5'];
        doc.resource.identifier = 'identifier2';
        const ie = IndexItem.from(doc);
        ConstraintIndex.put(ci, doc, ie);

        expect(ConstraintIndex.get(ci,'identifier:match', 'identifier1')).toEqual([]);
        expect(ConstraintIndex.get(ci, 'isRecordedIn:contain', '2')).toEqual([]);
        expect(ConstraintIndex.get(ci, 'liesWithin:contain', '3')).toEqual([]);

        expect(ConstraintIndex.get(ci, 'identifier:match', 'identifier2'))
            .toEqual([indexItem('1','identifier2')]);
        expect(ConstraintIndex.get(ci, 'isRecordedIn:contain', '4'))
            .toEqual([indexItem('1','identifier2')]);
        expect(ConstraintIndex.get(ci, 'liesWithin:contain', '5'))
            .toEqual([indexItem('1','identifier2')]);
    });


    it('query for existing or not', () => {

        const docs = [
            doc('1'),
            doc('2')
        ];
        docs[0]['_conflicts'] = ['1-other'];

        ci = ConstraintIndex.make({
            'conflicts:exist': { path: '_conflicts', type: 'exist' }
        }, typesMap);

        const ie1 = IndexItem.from(docs[0]);
        const ie2 = IndexItem.from(docs[1]);
        ConstraintIndex.put(ci, docs[0], ie1);
        ConstraintIndex.put(ci, docs[1], ie2);

        expect(ConstraintIndex.get(ci, 'conflicts:exist', 'KNOWN')).toEqual([indexItem('1')]);
        expect(ConstraintIndex.get(ci, 'conflicts:exist', 'UNKNOWN')).toEqual([indexItem('2')]);
    });


    it('throw error if type is unknown', () => {

        expect(() => {
            ConstraintIndex.make({
                'name': { path: 'testpath', type: 'unknown' }
            }, typesMap)
        }).toThrow();
    });


    it('contain with an empty array', () => {

        const docs = [
            doc('1'),
            doc('2')
        ];
        docs[0].resource.relations['depicts'] = [];
        docs[1].resource.relations['depicts'] = ['1'];

        ci = ConstraintIndex.make({
            'depicts:exist': { path: 'resource.relations.depicts', type: 'exist' }
        }, typesMap);

        const ie1 = IndexItem.from(docs[0]);
        const ie2 = IndexItem.from(docs[1]);

        ConstraintIndex.put(ci, docs[0], ie1);
        ConstraintIndex.put(ci, docs[1], ie2);

        expect(ConstraintIndex.get(ci, 'depicts:exist', 'KNOWN')).toEqual([indexItem('2')]);
        expect(ConstraintIndex.get(ci, 'depicts:exist', 'UNKNOWN')).toEqual([indexItem('1')]);
    });


    it('use two indices of different types for one path', () => {

        const docs = [
            doc('1'),
            doc('2'),
            doc('3'),
            doc('4')
        ];
        docs[0].resource.relations['depicts'] = [];
        docs[1].resource.relations['depicts'] = [];
        docs[2].resource.relations['depicts'] = ['1'];
        docs[3].resource.relations['depicts'] = ['2'];

        ci = ConstraintIndex.make({
            'depicts:exist': { path: 'resource.relations.depicts', type: 'exist' },
            'depicts:contain': { path: 'resource.relations.depicts', type: 'contain' }
        }, typesMap);

        const ie1 = IndexItem.from(docs[0]);
        const ie2 = IndexItem.from(docs[1]);
        const ie3 = IndexItem.from(docs[2]);
        const ie4 = IndexItem.from(docs[3]);

        ConstraintIndex.put(ci, docs[0], ie1);
        ConstraintIndex.put(ci, docs[1], ie2);
        ConstraintIndex.put(ci, docs[2], ie3);
        ConstraintIndex.put(ci, docs[3], ie4);

        expect(ConstraintIndex.get(ci, 'depicts:exist', 'KNOWN')).toEqual([indexItem('3'), indexItem('4')]);
        expect(ConstraintIndex.get(ci, 'depicts:exist', 'UNKNOWN')).toEqual([indexItem('1'), indexItem('2')]);
        expect(ConstraintIndex.get(ci, 'depicts:contain', '1')).toEqual([indexItem('3')]);
        expect(ConstraintIndex.get(ci,  'depicts:contain', '2')).toEqual([indexItem('4')]);
    });


    it('get results for multiple constraint values for the same constraint', () => {

        const docs = [
            doc('1'),
            doc('2'),
            doc('3'),
            doc('4')
        ];
        docs[0].resource.relations['depicts'] = [];
        docs[1].resource.relations['depicts'] = [];
        docs[2].resource.relations['depicts'] = ['1'];
        docs[3].resource.relations['depicts'] = ['2'];

        ci = ConstraintIndex.make({
            'depicts:contain': { path: 'resource.relations.depicts', type: 'contain' }
        }, typesMap);

        const ie1 = IndexItem.from(docs[0]);
        const ie2 = IndexItem.from(docs[1]);
        const ie3 = IndexItem.from(docs[2]);
        const ie4 = IndexItem.from(docs[3]);

        ConstraintIndex.put(ci, docs[0], ie1);
        ConstraintIndex.put(ci, docs[1], ie2);
        ConstraintIndex.put(ci, docs[2], ie3);
        ConstraintIndex.put(ci, docs[3], ie4);

        expect(ConstraintIndex.get(ci, 'depicts:contain', ['1', '2'])).toEqual([indexItem('3'), indexItem('4')]);
    });


    it('index fields specified in search configuration', () => {

        typesMap = {
            type: {
                fields: [
                    { name: 'identifier' },
                    { name: 'shortDescription' },
                    { name: 'customField1', inputType: 'input', constraintIndexed: true },
                    { name: 'customField2', inputType: 'boolean', constraintIndexed: true },
                    { name: 'customField3', inputType: 'checkboxes', constraintIndexed: true }
                ]
            }
        };

        const docs = [doc('1')];
        docs[0].resource.customField1 = 'testValue';
        docs[0].resource.customField2 = false;
        docs[0].resource.customField3 = ['testValue1', 'testValue2'];

        ci = ConstraintIndex.make({}, typesMap);

        const ie = IndexItem.from(docs[0]);

        ConstraintIndex.put(ci, docs[0], ie);

        expect(ConstraintIndex.get(ci, 'customField1:match', 'testValue')).toEqual([indexItem('1')]);
        expect(ConstraintIndex.get(ci, 'customField2:match', 'false')).toEqual([indexItem('1')]);
        expect(ConstraintIndex.get(ci, 'customField3:contain', 'testValue1')).toEqual([indexItem('1')]);
        expect(ConstraintIndex.get(ci, 'customField1:exist', 'KNOWN')).toEqual([indexItem('1')]);
        expect(ConstraintIndex.get(ci, 'customField2:exist', 'KNOWN')).toEqual([indexItem('1')]);
        expect(ConstraintIndex.get(ci, 'customField3:exist', 'KNOWN')).toEqual([indexItem('1')]);
    });


    it('index dropdownRange field specified in search configuration', () => {

        typesMap = {
            type: {
                fields: [
                    { name: 'identifier' },
                    { name: 'shortDescription' },
                    { name: 'dropdownRangeField', inputType: 'dropdownRange', constraintIndexed: true }
                ]
            }
        };

        const docs = [doc('1')];
        docs[0].resource.dropdownRangeField = 'testValue1';
        docs[0].resource.dropdownRangeFieldEnd = 'testValue2';

        ci = ConstraintIndex.make({}, typesMap);

        const ie = IndexItem.from(docs[0]);

        ConstraintIndex.put(ci, docs[0], ie);

        expect(ConstraintIndex.get(ci, 'dropdownRangeField:match', 'testValue1')).toEqual([indexItem('1')]);
        expect(ConstraintIndex.get(ci, 'dropdownRangeFieldEnd:match', 'testValue2')).toEqual([indexItem('1')]);
        expect(ConstraintIndex.get(ci, 'dropdownRangeField:exist', 'KNOWN')).toEqual([indexItem('1')]);
        expect(ConstraintIndex.get(ci, 'dropdownRangeFieldEnd:exist', 'KNOWN')).toEqual([indexItem('1')]);
    });


    it('index a single value field and an array field of the same name', () => {

        typesMap = {
            type1: {
                fields: [
                    { name: 'field', inputType: 'input', constraintIndexed: true }
                ]
            },
            type2: {
                fields: [
                    { name: 'field', inputType: 'checkboxes', constraintIndexed: true }
                ]
            },
        };

        const docs = [doc('1', 'type1'), doc('2', 'type2')];
        docs[0].resource.field = 'value';
        docs[1].resource.field = ['value'];

        ci = ConstraintIndex.make({}, typesMap);

        const ie1 = IndexItem.from(docs[0]);
        const ie2 = IndexItem.from(docs[1]);

        ConstraintIndex.put(ci, docs[0], ie1);
        ConstraintIndex.put(ci, docs[1], ie2);

        expect(ConstraintIndex.get(ci, 'field:match', 'value')).toEqual([indexItem('1')]);
        expect(ConstraintIndex.get(ci, 'field:contain', 'value')).toEqual([indexItem('2')]);
        expect(ConstraintIndex.get(ci, 'field:exist', 'KNOWN'))
            .toEqual([indexItem('1'),indexItem('2')]);
    });


    it('get count', () => {

        const docs = [
            doc('2'),
            doc('3')
        ];
        docs[0].resource.relations['liesWithin'] = ['1'];
        docs[1].resource.relations['liesWithin'] = ['1'];

        ci = ConstraintIndex.make({
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' }
        }, typesMap);

        const ie1 = IndexItem.from(docs[0]);
        const ie2 = IndexItem.from(docs[1]);

        ConstraintIndex.put(ci, docs[0], ie1);
        ConstraintIndex.put(ci, docs[1], ie2);

        expect(ConstraintIndex.getCount(ci, 'liesWithin:contain', '1')).toBe(2);
        expect(ConstraintIndex.getCount(ci, 'liesWithin:contain', '2')).toBe(0);
    });


    it('get with descendants', () => {

        const docs = [
            doc('1'),
            doc('2'),
            doc('3'),
            doc('4'),
            doc('5')
        ];

        docs[1].resource.relations['liesWithin'] = ['1'];
        docs[2].resource.relations['liesWithin'] = ['1'];
        docs[3].resource.relations['liesWithin'] = ['3'];
        docs[4].resource.relations['liesWithin'] = ['3'];

        ci = ConstraintIndex.make({
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' }
        }, typesMap);

        const ie1 = IndexItem.from(docs[0]);
        const ie2 = IndexItem.from(docs[1]);
        const ie3 = IndexItem.from(docs[2]);
        const ie4 = IndexItem.from(docs[3]);
        const ie5 = IndexItem.from(docs[4]);

        ConstraintIndex.put(ci, docs[0], ie1);
        ConstraintIndex.put(ci, docs[1], ie2);
        ConstraintIndex.put(ci, docs[2], ie3);
        ConstraintIndex.put(ci, docs[3], ie4);
        ConstraintIndex.put(ci, docs[4], ie5);

        expect(ConstraintIndex.getWithDescendants(ci, 'liesWithin:contain', '1').map(to('id')))
           .toEqual(['2', '3', '4', '5']);
        expect(ConstraintIndex.getWithDescendants(ci, 'liesWithin:contain', '2').map(to('id')))
           .toEqual([]);
        expect(ConstraintIndex.getWithDescendants(ci, 'liesWithin:contain', '3').map(to('id')))
            .toEqual(['4', '5']);
    });
});