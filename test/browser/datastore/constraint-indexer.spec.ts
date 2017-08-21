import {ConstraintIndexer} from "../../../app/datastore/constraint-indexer";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ConstraintIndexer', () => {

        let ci;

        function doc(id) {
            return {
                resource: {
                    id: id,
                    identifier: 'identifier1',
                    relations: { } // TODO test for undefined relations,
                },
                created:
                    {
                        date: '2017-12-31'
                    },
                modified: [
                    {
                        date: '2018-01-01'
                    }
                ]
            }
        }

        function item(id) {
            return {id: id, date: '2018-01-01'};
        }

        beforeEach(() => {
            spyOn(console, 'warn');
        });

        it('multiple docs are recorded in another', () => {

            const docs = [
                doc('2'),
                doc('3')
            ];
            docs[0].resource.relations['isRecordedIn'] = ['1'];
            docs[1].resource.relations['isRecordedIn'] = ['1'];

            ci = new ConstraintIndexer([
                { path: 'resource.relations.isRecordedIn' }
            ]);
            ci.put(docs[0]);
            ci.put(docs[1]);

            expect(ci.get('resource.relations.isRecordedIn', '1'))
                .toEqual([item('2'), item('3')]);
        });

        function docWithMultipleConstraintTargets() {
            const docs = [
                doc('1')
            ];
            docs[0].resource.relations['isRecordedIn'] = ['2', '3'];

            ci = new ConstraintIndexer([
                { path: 'resource.relations.isRecordedIn' }
            ]);
            ci.put(docs[0]);
            return docs;
        }

        it('one doc is recorded in multiple others', () => {

            docWithMultipleConstraintTargets();

            expect(ci.get('resource.relations.isRecordedIn', '2'))
                .toEqual([item('1')]);
            expect(ci.get('resource.relations.isRecordedIn', '3'))
                .toEqual([item('1')]);
        });

        function docWithMultipleConstraints() {
            const docs = [
                doc('1')
            ];
            docs[0].resource.relations['isRecordedIn'] = ['2'];
            docs[0].resource.relations['liesWithin'] = ['3'];

            ci = new ConstraintIndexer([
                { path: 'resource.relations.liesWithin' } ,
                { path: 'resource.relations.isRecordedIn' },
                { path: 'resource.identifier', string: true },
            ]);
            ci.put(docs[0]);
            return docs;
        }

        it('works for multiple constrains', () => {

            docWithMultipleConstraints();

            expect(ci.get('resource.relations.liesWithin', '3'))
                .toEqual([item('1')]);
            expect(ci.get('resource.relations.isRecordedIn', '2'))
                .toEqual([item('1')]);
        });

        it('index also works if doc does not have the field', () => {

            const docs = [
                doc('1')
            ];

            ci = new ConstraintIndexer([
                { path: 'resource.relations.liesWithin' }
            ]);
            ci.put(docs[0]);

            expect(ci.get('resource.relations.liesWithin', '3'))
                .toEqual([ ]);
        });

        function docWithIdentifier() {
            const docs = [
                doc('1')
            ];

            ci = new ConstraintIndexer([
                { path: 'resource.identifier', string: true }
            ]);
            ci.put(docs[0]);
            return docs;
        }

        it('work with non arrays', () => {

            docWithIdentifier();

            expect(ci.get('resource.identifier', 'identifier1'))
                .toEqual([item('1')]);
        });

        it('clear index', () => {

            docWithIdentifier();

            ci.clear();

            expect(ci.get('resource.identifier', 'identifier1'))
                .toEqual([ ]);
        });

        it('ask for non existing index', () => {

            ci = new ConstraintIndexer([ ]);

            expect(ci.get('resource.identifier', 'identifier1'))
                .toEqual(undefined);
        });

        it('ask without constraints', () => {

            ci = new ConstraintIndexer([ ]);

            expect(ci.get(undefined))
                .toEqual(undefined);
        });

        it('ask for one existing index and one nonexisting index', () => {

            ci = new ConstraintIndexer([
                { path: 'resource.identifier' }
            ]);

            expect(ci.get('resource.identifier', 'identifier1'))
                .toEqual([ ]);
        });

        it('remove doc', () => {

            const doc = docWithMultipleConstraints()[0];

            ci.remove(doc);

            expect(ci.get('resource.identifier', 'identifier1'))
                .toEqual([ ]);
            expect(ci.get('resource.relations.isRecordedIn', '2'))
                .toEqual([ ]);
            expect(ci.get('resource.relations.liesWithin', '3'))
                .toEqual([ ]);
        });

        it('remove where one doc was recorded in multiple docs for the same constraint', () => {

            const doc = docWithMultipleConstraintTargets()[0];

            ci.remove(doc);

            expect(ci.get('resource.relations.isRecordedIn', '2'))
                .toEqual([ ]);
            expect(ci.get('resource.relations.isRecordedIn', '3'))
                .toEqual([ ]);
        });

        it('update docs where the relations change', () => {

            let doc = docWithMultipleConstraints()[0];

            doc.resource.relations['isRecordedIn'] = ['4'];
            doc.resource.relations['liesWithin'] = ['5'];
            doc.resource.identifier = 'identifier2';
            ci.put(doc);

            expect(ci.get('resource.identifier', 'identifier1'))
                .toEqual([ ]);
            expect(ci.get('resource.relations.isRecordedIn', '2'))
                .toEqual([ ]);
            expect(ci.get('resource.relations.liesWithin', '3'))
                .toEqual([ ]);

            expect(ci.get('resource.identifier', 'identifier2'))
                .toEqual([item('1')]);
            expect(ci.get('resource.relations.isRecordedIn', '4'))
                .toEqual([item('1')]);
            expect(ci.get('resource.relations.liesWithin', '5'))
                .toEqual([item('1')]);
        });

        it('query for unkown', () => {

            const docs = [
                doc('1'),
                doc('2')
            ];
            docs[0].resource.relations['liesWithin'] = ['3'];

            ci = new ConstraintIndexer([
                { path: 'resource.relations.liesWithin' } ,
            ]);
            ci.put(docs[0]);
            ci.put(docs[1]);

            expect(ci.get('resource.relations.liesWithin', 'UNKOWN'))
                .toEqual([item('2')]);
        });

        // TODO update docs where doc is new

        // TODO remove before update

        // TODO remove the target docs, for example delete the trench, then also the findings recorded in in are not to be found
    });
}