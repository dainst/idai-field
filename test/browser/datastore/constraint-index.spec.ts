import {ConstraintIndex} from "../../../app/datastore/constraint-index";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ConstraintIndex', () => {

        it('multiple docs are recorded in another', () => {

            const docs = [
                {
                    resource: {
                        id: '2',
                        relations: {
                            isRecordedIn: ['1']
                        }
                    }
                },
                {
                    resource: {
                        id: '3',
                        relations: {
                            isRecordedIn: ['1']
                        }
                    }
                }
            ];

            const ci = new ConstraintIndex(['resource.relations.isRecordedIn']);
            ci.setDocs(docs);

            expect(ci.get('resource.relations.isRecordedIn','1'))
                .toEqual(['2', '3']);
        });

        it('one doc is recorded in multiple others', () => {

            const docs = [
                {
                    resource: {
                        id: '1',
                        relations: {
                            isRecordedIn: ['2', '3']
                        }
                    }
                }
            ];

            const ci = new ConstraintIndex(['resource.relations.isRecordedIn']);
            ci.setDocs(docs);

            expect(ci.get('resource.relations.isRecordedIn','2'))
                .toEqual(['1']);
            expect(ci.get('resource.relations.isRecordedIn','3'))
                .toEqual(['1']);
        });

        it('works for multiple constrains', () => {

            const docs = [
                {
                    resource: {
                        id: '1',
                        relations: {
                            isRecordedIn: ['2'],
                            liesWithin: ['3']
                        }
                    }
                }
            ];

            const ci = new ConstraintIndex(
                [
                    'resource.relations.liesWithin',
                    'resource.relations.isRecordedIn',
                ]
            );
            ci.setDocs(docs);

            expect(ci.get('resource.relations.liesWithin','3'))
                .toEqual(['1']);
            expect(ci.get('resource.relations.isRecordedIn','2'))
                .toEqual(['1']);
        });
    });
}