import {Document} from 'idai-components-2';
import {ConstraintIndexer} from '../../../../../app/core/datastore/index/constraint-indexer';
import {IndexItem} from '../../../../../app/core/datastore/index/index-item';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ConstraintIndexer', () => {

    let ci;
    let projectConfiguration;


    beforeAll(() => {

        projectConfiguration = jasmine.createSpyObj('projectConfiguration',
            ['getTypesMap']);
    });


    beforeEach(() => {

        projectConfiguration.getTypesMap.and.returnValue({
            type: {
                fields: [
                    { name: 'identifier' },
                    { name: 'shortDescription' }
                ]
            }
        });
    });


    function doc(id): Document {

        return {
            resource: {
                id: id,
                identifier: 'identifier' + id,
                type: 'type',
                relations: {}
            },
            created:
                {
                    date: new Date('2017-12-31'),
                    user: 'testuser'
                },
            modified: [
                {
                    date: new Date('2018-01-01'),
                    user: 'testuser'
                }
            ]
        };
    }


    function indexItem(id, identifier?): IndexItem {

        if (!identifier) identifier = 'identifier' + id;
        return { id: id, date: new Date('2018-01-01'), identifier: identifier };
    }


    it('multiple docs are recorded in another', () => {

        const docs = [
            doc('2'),
            doc('3')
        ];
        docs[0].resource.relations['isRecordedIn'] = ['1'];
        docs[1].resource.relations['isRecordedIn'] = ['1'];

        ci = new ConstraintIndexer({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' }
        }, projectConfiguration, false);

        ci.put(docs[0]);
        ci.put(docs[1]);

        expect(ci.get('isRecordedIn:contain', '1')).toEqual([indexItem('2'), indexItem('3')]);
    });


    function docWithMultipleConstraintTargets() {

        const docs = [
            doc('1')
        ];
        docs[0].resource.relations['isRecordedIn'] = ['2', '3'];

        ci = new ConstraintIndexer({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' }
        }, projectConfiguration);

        ci.put(docs[0]);
        return docs;
    }


    it('one doc is recorded in multiple others', () => {

        docWithMultipleConstraintTargets();

        expect(ci.get('isRecordedIn:contain', '2')).toEqual([indexItem('1')]);
        expect(ci.get('isRecordedIn:contain', '3')).toEqual([indexItem('1')]);
    });


    function docWithMultipleConstraints() {

        const docs = [
            doc('1')
        ];
        docs[0].resource.relations['isRecordedIn'] = ['2'];
        docs[0].resource.relations['liesWithin'] = ['3'];

        ci = new ConstraintIndexer({
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        }, projectConfiguration);

        ci.put(docs[0]);
        return docs;
    }


    it('works for multiple constrains', () => {

        docWithMultipleConstraints();

        expect(ci.get('liesWithin:contain', '3')).toEqual([indexItem('1')]);
        expect(ci.get('isRecordedIn:contain', '2')).toEqual([indexItem('1')]);
    });


    it('index also works if doc does not have the field', () => {

        const docs = [
            doc('1')
        ];

        ci = new ConstraintIndexer({
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' }
        }, projectConfiguration, false);

        ci.put(docs[0]);

        expect(ci.get('liesWithin:contain', '3')).toEqual([]);
    });


    it('work with non arrays', () => {

        ci = new ConstraintIndexer({
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        }, projectConfiguration, false);
        ci.put(doc('1'));
        expect(ci.get('identifier:match', 'identifier1')).toEqual([indexItem('1')]);
    });


    it('do not index if no identifier', () => { // tests interaction with IndexItem

        ci = new ConstraintIndexer({
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        }, projectConfiguration, false);
        const doc0 = doc('1');
        delete doc0.resource.identifier;
        ci.put(doc0);
        expect(ci.get('identifier:match', 'identifier1')).toEqual([]);
    });


    it('do not index if no created and modified', () => { // tests interaction with IndexItem

        ci = new ConstraintIndexer({
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        }, projectConfiguration, false);
        const doc0 = doc('1');
        delete doc0.created;
        delete doc0.modified;
        ci.put(doc0);
        expect(ci.get('identifier:match', 'identifier1')).toEqual([]);
    });


    it('clear index', () => {

        ci = new ConstraintIndexer({
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        }, projectConfiguration, false);
        ci.put(doc('1'));
        ci.clear();
        expect(ci.get('identifier:match', 'identifier1')).toEqual([]);
    });


    it('ask for one existing index and one nonexisting index', () => {

        ci = new ConstraintIndexer({
            'identifier:contain': { path: 'resource.identifier', type: 'contain' }
        }, projectConfiguration, false);

        expect(ci.get('identifier:contain', 'identifier1')).toEqual([]);
    });


    it('remove doc', () => {

        const doc = docWithMultipleConstraints()[0];

        ci.remove(doc);

        expect(ci.get('identifier:match', 'identifier1')).toEqual([]);
        expect(ci.get('isRecordedIn:contain', '2')).toEqual([]);
        expect(ci.get('liesWithin:contain', '3')).toEqual([]);
    });


    it('remove where one doc was recorded in multiple docs for the same constraint', () => {

        const doc = docWithMultipleConstraintTargets()[0];

        ci.remove(doc);

        expect(ci.get('isRecordedIn:contain', '2')).toEqual([]);
        expect(ci.get('isRecordedIn:contain', '3')).toEqual([]);
    });


    it('update docs where the relations change', () => {

        const doc = docWithMultipleConstraints()[0];

        doc.resource.relations['isRecordedIn'] = ['4'];
        doc.resource.relations['liesWithin'] = ['5'];
        doc.resource.identifier = 'identifier2';
        ci.put(doc);

        expect(ci.get('identifier:match', 'identifier1')).toEqual([]);
        expect(ci.get('isRecordedIn:contain', '2')).toEqual([]);
        expect(ci.get('liesWithin:contain', '3')).toEqual([]);

        expect(ci.get('identifier:match', 'identifier2'))
            .toEqual([indexItem('1','identifier2')]);
        expect(ci.get('isRecordedIn:contain', '4'))
            .toEqual([indexItem('1','identifier2')]);
        expect(ci.get('liesWithin:contain', '5'))
            .toEqual([indexItem('1','identifier2')]);
    });


    it('query for existing or not', () => {

        const docs = [
            doc('1'),
            doc('2')
        ];
        docs[0]['_conflicts'] = ['1-other'];

        ci = new ConstraintIndexer({
            'conflicts:exist': { path: '_conflicts', type: 'exist' }
        }, projectConfiguration, false);

        ci.put(docs[0]);
        ci.put(docs[1]);

        expect(ci.get('conflicts:exist', 'KNOWN')).toEqual([indexItem('1')]);
        expect(ci.get('conflicts:exist', 'UNKNOWN')).toEqual([indexItem('2')]);
    });


    it('throw error if type is unknown', () => {

        expect(() => {
            new ConstraintIndexer({
                'name': { path: 'testpath', type: 'unknown' }
            }, projectConfiguration, false)
        }).toThrow();
    });


    it('contain with an empty array', () => {

        const docs = [
            doc('1'),
            doc('2')
        ];
        docs[0].resource.relations['depicts'] = [];
        docs[1].resource.relations['depicts'] = ['1'];

        ci = new ConstraintIndexer({
            'depicts:exist': { path: 'resource.relations.depicts', type: 'exist' }
        }, projectConfiguration, false);

        ci.put(docs[0]);
        ci.put(docs[1]);

        expect(ci.get('depicts:exist', 'KNOWN')).toEqual([indexItem('2')]);
        expect(ci.get('depicts:exist', 'UNKNOWN')).toEqual([indexItem('1')]);
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

        ci = new ConstraintIndexer({
            'depicts:exist': { path: 'resource.relations.depicts', type: 'exist' },
            'depicts:contain': { path: 'resource.relations.depicts', type: 'contain' }
        }, projectConfiguration, false);

        ci.put(docs[0]);
        ci.put(docs[1]);
        ci.put(docs[2]);
        ci.put(docs[3]);

        expect(ci.get('depicts:exist', 'KNOWN')).toEqual([indexItem('3'), indexItem('4')]);
        expect(ci.get('depicts:exist', 'UNKNOWN')).toEqual([indexItem('1'), indexItem('2')]);
        expect(ci.get('depicts:contain', '1')).toEqual([indexItem('3')]);
        expect(ci.get('depicts:contain', '2')).toEqual([indexItem('4')]);
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

        ci = new ConstraintIndexer({
            'depicts:contain': { path: 'resource.relations.depicts', type: 'contain' }
        }, projectConfiguration, false);

        ci.put(docs[0]);
        ci.put(docs[1]);
        ci.put(docs[2]);
        ci.put(docs[3]);

        expect(ci.get('depicts:contain', ['1', '2'])).toEqual([indexItem('3'), indexItem('4')]);
    });


    it('index fields specified in search configuration', () => {

        projectConfiguration.getTypesMap.and.returnValue({
            type: {
                fields: [
                    { name: 'identifier' },
                    { name: 'shortDescription' },
                    { name: 'customField1', inputType: 'input', constraintIndexed: true },
                    { name: 'customField2', inputType: 'boolean', constraintIndexed: true },
                    { name: 'customField3', inputType: 'checkboxes', constraintIndexed: true }
                ]
            }
        });

        const docs = [doc('1')];
        docs[0].resource.customField1 = 'testValue';
        docs[0].resource.customField2 = false;
        docs[0].resource.customField3 = ['testValue1', 'testValue2'];

        ci = new ConstraintIndexer({}, projectConfiguration, false);

        ci.put(docs[0]);

        expect(ci.get('customField1:match', 'testValue')).toEqual([indexItem('1')]);
        expect(ci.get('customField2:match', 'false')).toEqual([indexItem('1')]);
        expect(ci.get('customField3:contain', 'testValue1')).toEqual([indexItem('1')]);
    });
});