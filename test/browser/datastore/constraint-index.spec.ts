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

            const ci = new ConstraintIndex();
            ci.setDocs(docs);

            expect(ci.get('1')).toEqual(['2', '3']);
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

            const ci = new ConstraintIndex();
            ci.setDocs(docs);

            expect(ci.get('2')).toEqual(['1']);
            expect(ci.get('3')).toEqual(['1']);
        });
    });
}