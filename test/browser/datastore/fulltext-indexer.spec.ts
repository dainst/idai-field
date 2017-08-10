import {FulltextIndexer} from "../../../app/datastore/fulltext-indexer";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('FulltextIndexer', () => {

        let fi;

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

        beforeEach(() => {
            fi = new FulltextIndexer();
        });

        it('match one with with different search terms', () => {
            fi.add(doc('1', 'identifier1', 'object'));
            expect(fi.get('identifier1', ['object']))
                .toEqual([{id: '1', date: '2018-01-01'}]);
            expect(fi.get('ide', ['object']))
                .toEqual([{id: '1', date: '2018-01-01'}]);
        });

        it('match two with the same search term', () => {
            fi.add(doc('1', 'identifier1', 'object'));
            fi.add(doc('2', 'identifier2', 'object'));
            expect(fi.get('identifier', ['object']))
                .toEqual([{id: '1', date: '2018-01-01'}, {id: '2', date: '2018-01-01'}]);
        });

        it('match in all types', () => {
            fi.add(doc('1', 'identifier1', 'object'));
            expect(fi.get('identifier', undefined))
                .toEqual([{id: '1', date: '2018-01-01'}]);
        });

        it('match in multiple selected types', () => {
            fi.add(doc('1', 'identifier1', 'object1'));
            fi.add(doc('2', 'identifier2', 'object2'));
            fi.add(doc('3', 'identifier3', 'object3'));
            expect(fi.get('identifier', ['object1', 'object2']))
                .toEqual([{id: '1', date: '2018-01-01'}, {id: '2', date: '2018-01-01'}]);
        });

        it('do not match search term', () => {
            fi.add(doc('1', 'iden', 'object'));
            expect(fi.get('identifier', ['object']))
                .toEqual([]);
        });

        it('do not match search in type', () => {
            fi.add(doc('1', 'iden', 'object1'));
            expect(fi.get('identifier', ['object2']))
                .toEqual([]);
        });

        it('no types present', () => {
            expect(fi.get('identifier', ['object']))
                .toEqual([]);
        });

        it('clear', () => {
            fi.add(doc('1', 'identifier1', 'object'));
            fi.clear();
            expect(fi.get('identifier', ['object']))
                .toEqual([]);
        });

        xit('rough size estimate', () => {
            console.log("start")

            let str;
            for (let i=0; i < 100000;i++) {
                str = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 20);
                // console.log("string",str)
                fi.add(doc('1', str, 'object'));
            }

            fi.print();
            console.log(fi.get(str, ['object']))
        }, 20000);

        // TODO index more fields

        // TODO tokenize fields
    });
}