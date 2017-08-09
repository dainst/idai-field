import {FulltextIndexer} from "../../../app/datastore/fulltext-indexer";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('FulltextIndexer', () => {

        let fi;

        function doc(id,identifier) {
            return {
                resource: {
                    id: id,
                    identifier: identifier,
                    relations: { }
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

        it('match one with with different search terms', () => {
            const fi = new FulltextIndexer();

            fi.add(doc('1','identifier1'));
            expect(fi.get('identifier1')).toEqual(['1']);
            expect(fi.get('ide')).toEqual(['1']);
        });

        it('match two with the same search term', () => {
            const fi = new FulltextIndexer();

            fi.add(doc('1','identifier1'));
            fi.add(doc('2','identifier2'));
            expect(fi.get('identifier')).toEqual(['1','2']);
        });
    });
}