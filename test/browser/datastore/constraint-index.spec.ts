import {ConstraintIndex} from "../../../app/datastore/constraint-index";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ConstraintIndex', () => {

        function doc(id) {
            return {
                resource: {
                    id: id,
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

            const ci = new ConstraintIndex([
                'resource.relations.isRecordedIn'
            ]);
            ci.setDocs(docs);

            expect(ci.get('resource.relations.isRecordedIn','1'))
                .toEqual(['2', '3']);
        });

        it('one doc is recorded in multiple others', () => {

            const docs = [
                doc('1')
            ];
            docs[0].resource.relations['isRecordedIn'] = ['2', '3'];

            const ci = new ConstraintIndex([
                'resource.relations.isRecordedIn'
            ]);
            ci.setDocs(docs);

            expect(ci.get('resource.relations.isRecordedIn','2'))
                .toEqual(['1']);
            expect(ci.get('resource.relations.isRecordedIn','3'))
                .toEqual(['1']);
        });

        it('works for multiple constrains', () => {

            const docs = [
                doc('1')
            ];
            docs[0].resource.relations['isRecordedIn'] = ['2'];
            docs[0].resource.relations['liesWithin'] = ['3'];

            const ci = new ConstraintIndex([
                'resource.relations.liesWithin',
                'resource.relations.isRecordedIn',
            ]);
            ci.setDocs(docs);

            expect(ci.get('resource.relations.liesWithin','3'))
                .toEqual(['1']);
            expect(ci.get('resource.relations.isRecordedIn','2'))
                .toEqual(['1']);
        });

        it('index also works if doc does not have the field', () => {

            const docs = [
                doc('1')
            ];

            const ci = new ConstraintIndex([
                'resource.relations.liesWithin'
            ]);
            ci.setDocs(docs);

            expect(ci.get('resource.relations.liesWithin','3'))
                .toEqual([]);
        });
    });
}