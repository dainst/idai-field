import { ConstraintIndex } from "../../src/index/constraint-index";
import { IndexItem } from "../../src/index/index-item";
import { FieldDefinition } from "../../src/model/field-definition";
import { doc as helpersDoc } from "../test-helpers";


const doc = (id: string, category: string = 'category') =>
    helpersDoc('sd', 'identifier' + id, category, id);


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ConstraintIndex', () => {

    let ci;
    let categories;


    beforeEach(() => {

        categories = [
            {
                name: 'category',
                groups: [{ fields: [
                    { name: 'identifier' },
                    { name: 'shortDescription' }
                ]}]
            }
        ];
    });


    it('multiple docs are recorded in another', () => {

        const docs = [
            doc('2'),
            doc('3')
        ];
        docs[0].resource.relations['isRecordedIn'] = ['1'];
        docs[1].resource.relations['isRecordedIn'] = ['1'];

        ci = ConstraintIndex.make({
            'isRecordedIn:contain': {
                path: 'resource.relations.isRecordedIn',
                pathArray: ['resource', 'relations', 'isRecordedIn'],
                type: 'contain'
            }
        }, categories);

        ConstraintIndex.put(ci, docs[0]);
        ConstraintIndex.put(ci, docs[1]);

        expect(ConstraintIndex.get(ci,
            'isRecordedIn:contain', '1')).toEqual(['2', '3']);
    });


    function docWithMultipleConstraintTargets() {

        const docs = [
            doc('1')
        ];
        docs[0].resource.relations['isRecordedIn'] = ['2', '3'];

        ci = ConstraintIndex.make({
            'isRecordedIn:contain': {
                path: 'resource.relations.isRecordedIn',
                pathArray: ['resource', 'relations', 'isRecordedIn'],
                type: 'contain'
            }
        }, categories);

        ConstraintIndex.put(ci, docs[0]);
        return docs;
    }


    it('one doc is recorded in multiple others', () => {

        docWithMultipleConstraintTargets();

        expect(ConstraintIndex.get(ci, 'isRecordedIn:contain', '2')).toEqual(['1']);
        expect(ConstraintIndex.get(ci, 'isRecordedIn:contain', '3')).toEqual(['1']);
    });


    function docWithMultipleConstraints() {

        const docs = [
            doc('1')
        ];
        docs[0].resource.relations['isRecordedIn'] = ['2'];
        docs[0].resource.relations['liesWithin'] = ['3'];

        ci = ConstraintIndex.make({
            'liesWithin:contain': {
                path: 'resource.relations.liesWithin',
                pathArray: ['resource', 'relations', 'liesWithin'],
                type: 'contain'
            },
            'isRecordedIn:contain': {
                path: 'resource.relations.isRecordedIn',
                pathArray: ['resource', 'relations', 'isRecordedIn'],
                type: 'contain'
            },
            'identifier:match': {
                path: 'resource.identifier',
                pathArray: ['resource', 'identifier'],
                type: 'match'
            }
        }, categories);

        ConstraintIndex.put(ci, docs[0]);
        return docs;
    }


    it('works for multiple constraints', () => {

        docWithMultipleConstraints();

        expect(ConstraintIndex.get(ci, 'liesWithin:contain', '3')).toEqual(['1']);
        expect(ConstraintIndex.get(ci, 'isRecordedIn:contain', '2')).toEqual(['1']);
    });


    it('index also works if doc does not have the field', () => {

        const docs = [
            doc('1')
        ];

        ci = ConstraintIndex.make({
            'liesWithin:contain': {
                path: 'resource.relations.liesWithin',
                pathArray: ['resource', 'relations', 'liesWithin'],
                type: 'contain'
            }
        }, categories);

        ConstraintIndex.put(ci, docs[0]);

        expect(ConstraintIndex.get(ci, 'liesWithin:contain', '3')).toEqual([]);
    });


    it('work with non arrays', () => {

        ci = ConstraintIndex.make({
            'identifier:match': { path: 'resource.identifier', pathArray: ['resource', 'identifier'], type: 'match' }
        }, categories);
        const d = doc('1');
        ConstraintIndex.put(ci, d);
        expect(ConstraintIndex.get(ci, 'identifier:match', 'identifier1')).toEqual(['1']);
    });


    it('ignore case', () => {

        ci = ConstraintIndex.make({
            'identifier:match': { path: 'resource.identifier', pathArray: ['resource', 'identifier'], type: 'match' }
        }, categories);
        const d = doc('1');
        ConstraintIndex.put(ci, d);
        expect(ConstraintIndex.get(ci, 'identifier:match', 'Identifier1')).toEqual(['1']);
    });


    it('do not index if no identifier', () => { // tests interaction with IndexItem

        ci = ConstraintIndex.make({
            'identifier:match': { path: 'resource.identifier', pathArray: ['resource', 'identifier'], type: 'match' }
        }, categories);
        const doc0 = doc('1');
        delete doc0.resource.identifier;
        ConstraintIndex.put(ci, doc0);
        expect(ConstraintIndex.get(ci, 'identifier:match', 'identifier1')).toEqual([]);
    });


    it('clear index', () => {

        ci = ConstraintIndex.make({
            'identifier:match': { path: 'resource.identifier', pathArray: ['resource', 'identifier'], type: 'match' }
        }, categories);
        const d = doc('1');
        const ie = IndexItem.from(d);
        ConstraintIndex.put(ci, d);
        ConstraintIndex.clear(ci);
        expect(ConstraintIndex.get(ci, 'identifier:match', 'identifier1')).toEqual([]);
    });


    it('ask for one existing index and one nonexisting index', () => {

        ci = ConstraintIndex.make({
            'identifier:contain': { path: 'resource.identifier', pathArray: ['resource', 'identifier'], type: 'contain' }
        }, categories);

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
        ConstraintIndex.put(ci, doc);

        expect(ConstraintIndex.get(ci, 'identifier:match', 'identifier1')).toEqual([]);
        expect(ConstraintIndex.get(ci, 'isRecordedIn:contain', '2')).toEqual([]);
        expect(ConstraintIndex.get(ci, 'liesWithin:contain', '3')).toEqual([]);

        expect(ConstraintIndex.get(ci, 'identifier:match', 'identifier2'))
            .toEqual(['1']);
        expect(ConstraintIndex.get(ci, 'isRecordedIn:contain', '4'))
            .toEqual(['1']);
        expect(ConstraintIndex.get(ci, 'liesWithin:contain', '5'))
            .toEqual(['1']);
    });


    it('query for existing or not', () => {

        const docs = [
            doc('1'),
            doc('2')
        ];
        docs[0]['_conflicts'] = ['1-other'];

        ci = ConstraintIndex.make({
            'conflicts:exist': { path: '_conflicts', pathArray: ['_conflicts'], type: 'exist' }
        }, categories);

        ConstraintIndex.put(ci, docs[0]);
        ConstraintIndex.put(ci, docs[1]);

        expect(ConstraintIndex.get(ci, 'conflicts:exist', 'KNOWN')).toEqual(['1']);
        expect(ConstraintIndex.get(ci, 'conflicts:exist', 'UNKNOWN')).toEqual(['2']);
    });


    it('throw error if category is unknown', () => {

        expect(() => {
            ConstraintIndex.make({
                'name': { path: 'testpath', pathArray: ['testpath'], type: 'unknown' }
            }, categories)
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
            'depicts:exist': {
                path: 'resource.relations.depicts',
                pathArray: ['resource', 'relations', 'depicts'],
                type: 'exist'
            }
        }, categories);

        ConstraintIndex.put(ci, docs[0]);
        ConstraintIndex.put(ci, docs[1]);

        expect(ConstraintIndex.get(ci, 'depicts:exist', 'KNOWN')).toEqual(['2']);
        expect(ConstraintIndex.get(ci, 'depicts:exist', 'UNKNOWN')).toEqual(['1']);
    });


    it('update links index', () => {

        const docs = [
            doc('1'),
            doc('2'),
            doc('3')
        ];
        docs[0].resource.relations['isDepictedIn'] = ['2'];
        docs[1].resource.relations['depicts'] = ['1'];

        ci = ConstraintIndex.make({
            'isDepictedIn:links': {
                path: 'resource.relations.isDepictedIn',
                pathArray: ['resource', 'relations', 'isDepictedIn'],
                type: 'links'
            }
        }, categories);

        ConstraintIndex.put(ci, docs[0]);
        ConstraintIndex.put(ci, docs[1]);
        ConstraintIndex.put(ci, docs[2]);

        expect(ConstraintIndex.get(ci, 'isDepictedIn:links', '1')).toEqual(['2']);

        docs[0].resource.relations['isDepictedIn'] = ['2', '3'];
        docs[2].resource.relations['depicts'] = ['1'];
        ConstraintIndex.put(ci, docs[0]);
        ConstraintIndex.put(ci, docs[2]);

        expect(ConstraintIndex.get(ci, 'isDepictedIn:links', '1')).toEqual(['2', '3']);
    });


    it('use two indices of different categories for one path', () => {

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
            'depicts:exist': {
                path: 'resource.relations.depicts',
                pathArray: ['resource', 'relations', 'depicts'],
                type: 'exist'
            },
            'depicts:contain': {
                path: 'resource.relations.depicts',
                pathArray: ['resource', 'relations', 'depicts'],
                type: 'contain'
            }
        }, categories);

        const ie1 = IndexItem.from(docs[0]);
        const ie2 = IndexItem.from(docs[1]);
        const ie3 = IndexItem.from(docs[2]);
        const ie4 = IndexItem.from(docs[3]);

        ConstraintIndex.put(ci, docs[0]);
        ConstraintIndex.put(ci, docs[1]);
        ConstraintIndex.put(ci, docs[2]);
        ConstraintIndex.put(ci, docs[3]);

        expect(ConstraintIndex.get(ci, 'depicts:exist', 'KNOWN')).toEqual(['3', '4']);
        expect(ConstraintIndex.get(ci, 'depicts:exist', 'UNKNOWN')).toEqual(['1', '2']);
        expect(ConstraintIndex.get(ci, 'depicts:contain', '1')).toEqual(['3']);
        expect(ConstraintIndex.get(ci,  'depicts:contain', '2')).toEqual(['4']);
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
            'depicts:contain': {
                path: 'resource.relations.depicts',
                pathArray: ['resource', 'relations', 'depicts'],
                type: 'contain'
            }
        }, categories);

        ConstraintIndex.put(ci, docs[0]);
        ConstraintIndex.put(ci, docs[1]);
        ConstraintIndex.put(ci, docs[2]);
        ConstraintIndex.put(ci, docs[3]);

        expect(ConstraintIndex.get(ci, 'depicts:contain', ['1', '2']))
            .toEqual(['3', '4']);
    });


    it('index fields specified in search configuration', () => {

        categories = [
            {
                name: 'category',
                groups: [{ fields: [
                    { name: 'identifier' },
                    { name: 'shortDescription' },
                    { name: 'customField1', inputType: 'input', constraintIndexed: true },
                    { name: 'customField2', inputType: 'boolean', constraintIndexed: true },
                    { name: 'customField3', inputType: 'checkboxes', constraintIndexed: true }
                ]}]
            }
        ];

        const docs = [doc('1')];
        docs[0].resource.customField1 = 'testValue';
        docs[0].resource.customField2 = false;
        docs[0].resource.customField3 = ['testValue1', 'testValue2'];

        ci = ConstraintIndex.make({}, categories);

        ConstraintIndex.put(ci, docs[0]);

        expect(ConstraintIndex.get(ci, 'customField1:match', 'testValue')).toEqual(['1']);
        expect(ConstraintIndex.get(ci, 'customField2:match', 'false')).toEqual(['1']);
        expect(ConstraintIndex.get(ci, 'customField3:contain', 'testValue1')).toEqual(['1']);
        expect(ConstraintIndex.get(ci, 'customField1:exist', 'KNOWN')).toEqual(['1']);
        expect(ConstraintIndex.get(ci, 'customField2:exist', 'KNOWN')).toEqual(['1']);
        expect(ConstraintIndex.get(ci, 'customField3:exist', 'KNOWN')).toEqual(['1']);
    });


    it('index a single value field and an array field of the same name', () => {

        categories = [
            {
                name: 'category1',
                groups: [{ fields: [
                    { name: 'field', inputType: 'input', constraintIndexed: true }
                ]}]
            },
            {
                name: 'category2',
                groups: [{ fields: [
                    { name: 'field', inputType: 'checkboxes', constraintIndexed: true }
                ]}]
            },
        ];

        const docs = [doc('1', 'category1'), doc('2', 'category2')];
        docs[0].resource.field = 'value';
        docs[1].resource.field = ['value'];

        ci = ConstraintIndex.make({}, categories);

        ConstraintIndex.put(ci, docs[0]);
        ConstraintIndex.put(ci, docs[1]);

        expect(ConstraintIndex.get(ci, 'field:match', 'value')).toEqual(['1']);
        expect(ConstraintIndex.get(ci, 'field:contain', 'value')).toEqual(['2']);
        expect(ConstraintIndex.get(ci, 'field:exist', 'KNOWN'))
            .toEqual(['1', '2']);
    });


    it('get count', () => {

        const docs = [
            doc('2'),
            doc('3')
        ];
        docs[0].resource.relations['liesWithin'] = ['1'];
        docs[1].resource.relations['liesWithin'] = ['1'];

        ci = ConstraintIndex.make({
            'liesWithin:contain': {
                path: 'resource.relations.liesWithin',
                pathArray: ['resource', 'relations', 'liesWithin'],
                type: 'contain'
            }
        }, categories);

        ConstraintIndex.put(ci, docs[0]);
        ConstraintIndex.put(ci, docs[1]);

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
            'liesWithin:contain': {
                path: 'resource.relations.liesWithin',
                pathArray: ['resource', 'relations', 'liesWithin'],
                type: 'contain',
                recursivelySearchable: true
            }
        }, categories);

        ConstraintIndex.put(ci, docs[0]);
        ConstraintIndex.put(ci, docs[1]);
        ConstraintIndex.put(ci, docs[2]);
        ConstraintIndex.put(ci, docs[3]);
        ConstraintIndex.put(ci, docs[4]);

        expect(ConstraintIndex.getWithDescendants(ci, 'liesWithin:contain', '1'))
           .toEqual(['2', '3', '4', '5']);
        expect(ConstraintIndex.getWithDescendants(ci, 'liesWithin:contain', '2'))
           .toEqual([]);
        expect(ConstraintIndex.getWithDescendants(ci, 'liesWithin:contain', '3'))
            .toEqual(['4', '5']);
    });


    it('get with descendants for multiple constraint values', () => {

        const docs = [
            doc('1'),
            doc('2'),
            doc('3'),
            doc('4'),
            doc('5'),
            doc('6')
        ];

        docs[1].resource.relations['liesWithin'] = ['1'];
        docs[2].resource.relations['liesWithin'] = ['2'];
        docs[4].resource.relations['liesWithin'] = ['4'];
        docs[5].resource.relations['liesWithin'] = ['5'];

        ci = ConstraintIndex.make({
            'liesWithin:contain': {
                path: 'resource.relations.liesWithin',
                pathArray: ['resource', 'relations', 'liesWithin'],
                type: 'contain',
                recursivelySearchable: true
            }
        }, categories);

        const ie1 = IndexItem.from(docs[0]);
        const ie2 = IndexItem.from(docs[1]);
        const ie3 = IndexItem.from(docs[2]);
        const ie4 = IndexItem.from(docs[3]);
        const ie5 = IndexItem.from(docs[4]);
        const ie6 = IndexItem.from(docs[5]);

        ConstraintIndex.put(ci, docs[0]);
        ConstraintIndex.put(ci, docs[1]);
        ConstraintIndex.put(ci, docs[2]);
        ConstraintIndex.put(ci, docs[3]);
        ConstraintIndex.put(ci, docs[4]);
        ConstraintIndex.put(ci, docs[5]);

        expect(ConstraintIndex.getWithDescendants(ci, 'liesWithin:contain', ['1', '4']))
            .toEqual(['2', '3', '5', '6']);
    });


    it('index valOptionalEndVal field', () => {

        categories = [{
            name: 'category',
            groups: [
                    {
                        fields: [
                            {
                                name: 'period',
                                inputType: FieldDefinition.InputType.DROPDOWNRANGE,
                                constraintIndexed: true
                            }]
                    }
                ]
        }];
        const docs = [doc('1'),doc('2')];
        docs[0].resource.period = { value: 'a1' };
        ci = ConstraintIndex.make({}, categories);
        ConstraintIndex.put(ci, docs[0]);

        const result = ConstraintIndex.get(ci, 'period.value:match', 'a1');
        expect(result[0]).toBe('1');
    });


    // err cases

    it('get with descendants - not a recursively searchable index', () => {

        ci = ConstraintIndex.make({
            'liesWithin:contain': {
                path: 'resource.relations.liesWithin',
                pathArray: ['resource', 'relations', 'liesWithin'],
                type: 'contain'
            }
        }, categories);

        ConstraintIndex.put(ci, doc('1'));

        expect(() => ConstraintIndex.getWithDescendants(ci, 'liesWithin:contain', '1'))
            .toThrow();
    });
});
