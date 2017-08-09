import {FulltextIndexer} from "../../../app/datastore/fulltext-indexer";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('FulltextIndexer', () => {

        function doc(id, identifier, type) {
            return {
                resource: {
                    id: id,
                    identifier: identifier,
                    relations: { },
                    type: type
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

            fi.add(doc('1', 'identifier1', 'object'));
            expect(fi.get('identifier1', 'object'))
                .toEqual([[{id: '1', date: '2018-01-01'}]]);
            expect(fi.get('ide', 'object'))
                .toEqual([[{id: '1', date: '2018-01-01'}]]);
        });

        it('match two with the same search term', () => {
            const fi = new FulltextIndexer();

            fi.add(doc('1', 'identifier1', 'object'));
            fi.add(doc('2', 'identifier2', 'object'));
            expect(fi.get('identifier', 'object'))
                .toEqual([[{id: '1', date: '2018-01-01'}, {id: '2', date: '2018-01-01'}]]);
        });

        it('match in all types', () => {
            const fi = new FulltextIndexer();

            fi.add(doc('1', 'identifier1', 'object'));
            expect(fi.get('identifier', undefined))
                .toEqual([[{id: '1', date: '2018-01-01'}]]);
        });
    });
}