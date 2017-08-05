import {ConstraintIndex} from "../../../app/datastore/constraint-index";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ConstraintIndex', () => {

        let ci;

        function doc(id) {
            return {
                resource: {
                    id: id,
                    identifier: 'identifier1',
                    relations: { } // TODO test for undefined relations
                }
            }
        }

        it('multiple docs are recorded in another', () => {

            const docs = [
                doc('2'),
                doc('3')
            ];
            docs[0].resource.relations['isRecordedIn'] = ['1'];
            docs[1].resource.relations['isRecordedIn'] = ['1'];

            ci = new ConstraintIndex([
                { path: 'resource.relations.isRecordedIn' }
            ]);
            ci.setDocs(docs);

            expect(ci.get('resource.relations.isRecordedIn', '1'))
                .toEqual(['2', '3']);
        });

        function oneDocRecordedInMultipleOthers() {
            const docs = [
                doc('1')
            ];
            docs[0].resource.relations['isRecordedIn'] = ['2', '3'];

            ci = new ConstraintIndex([
                { path: 'resource.relations.isRecordedIn' }
            ]);
            ci.setDocs(docs);
            return docs;
        }

        it('one doc is recorded in multiple others', () => {

            oneDocRecordedInMultipleOthers();

            expect(ci.get('resource.relations.isRecordedIn', '2'))
                .toEqual(['1']);
            expect(ci.get('resource.relations.isRecordedIn', '3'))
                .toEqual(['1']);
        });

        it('works for multiple constrains', () => {

            const docs = [
                doc('1')
            ];
            docs[0].resource.relations['isRecordedIn'] = ['2'];
            docs[0].resource.relations['liesWithin'] = ['3'];

            ci = new ConstraintIndex([
                { path: 'resource.relations.liesWithin' } ,
                { path: 'resource.relations.isRecordedIn' },
            ]);
            ci.setDocs(docs);

            expect(ci.get('resource.relations.liesWithin', '3'))
                .toEqual(['1']);
            expect(ci.get('resource.relations.isRecordedIn', '2'))
                .toEqual(['1']);
        });

        it('index also works if doc does not have the field', () => {

            const docs = [
                doc('1')
            ];

            ci = new ConstraintIndex([
                { path: 'resource.relations.liesWithin' }
            ]);
            ci.setDocs(docs);

            expect(ci.get('resource.relations.liesWithin', '3'))
                .toEqual([]);
        });

        function docWithIdentifier() {
            const docs = [
                doc('1')
            ];

            ci = new ConstraintIndex([
                { path: 'resource.identifier', string: true }
            ]);
            ci.setDocs(docs);
            return docs;
        }

        it('work with non arrays', () => {

            docWithIdentifier();

            expect(ci.get('resource.identifier', 'identifier1'))
                .toEqual(['1']);
        });

        it('clear index', () => {

            docWithIdentifier();

            ci.clear();

            expect(ci.get('resource.identifier', 'identifier1'))
                .toEqual([]);
        });

        // TODO later we do not throw but issue a warning and return []. now we try to stick to the existing interface, i.e. checking if the index exists with hasIndex
        it('ask for non existing index', () => {

            const docs = [
                doc('1')
            ];

            ci = new ConstraintIndex([ ]);
            ci.setDocs(docs);

            expect(()=>{ci.get('resource.identifier', 'identifier1')})
                .toThrow("an index for 'resource.identifier' does not exist");
        });

        it('remove one doc', () => {

            const doc = docWithIdentifier()[0];

            expect(ci.get('resource.identifier', 'identifier1')) // TODO remove duplicate code
                .toEqual(['1']);

            ci.remove(doc);

            expect(ci.get('resource.identifier', 'identifier1'))
                .toEqual([]);
        });

        it('remove where one doc was recorded in multiple docs for the same constraint', () => {

            const doc = oneDocRecordedInMultipleOthers()[0];

            ci.remove(doc);

            expect(ci.get('resource.relations.isRecordedIn', '2'))
                .toEqual([]);
            expect(ci.get('resource.relations.isRecordedIn', '3'))
                .toEqual([]);
        });

        it('update docs where the relations change', () => {

            let doc = docWithIdentifier()[0];
            doc.resource.identifier = 'identifier2';

            ci.update(doc);

            expect(ci.get('resource.identifier', 'identifier1'))
                .toEqual([ ]);
            expect(ci.get('resource.identifier', 'identifier2'))
                .toEqual(['1']);
        });

        // TODO do remove it also with an array type path

        // TODO remove from multiple indices

        // TODO update docs where doc is new

        // TODO remove the target docs, for example delete the trench, then also the findings recorded in in are not to be found
    });
}