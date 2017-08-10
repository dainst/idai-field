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
            fi.add(doc('1', 'identifier1', 'type'));
            expect(fi.get('identifier1', ['type']))
                .toEqual([{id: '1', date: '2018-01-01'}]);
            expect(fi.get('ide', ['type']))
                .toEqual([{id: '1', date: '2018-01-01'}]);
        });

        it('match two with the same search term', () => {
            fi.add(doc('1', 'identifier1', 'type'));
            fi.add(doc('2', 'identifier2', 'type'));
            expect(fi.get('identifier', ['type']))
                .toEqual([{id: '1', date: '2018-01-01'}, {id: '2', date: '2018-01-01'}]);
        });

        it('match in all types', () => {
            fi.add(doc('1', 'identifier1', 'type'));
            expect(fi.get('identifier', undefined))
                .toEqual([{id: '1', date: '2018-01-01'}]);
        });

        it('match in multiple selected types', () => {
            fi.add(doc('1', 'identifier1', 'type1'));
            fi.add(doc('2', 'identifier2', 'type2'));
            fi.add(doc('3', 'identifier3', 'type3'));
            expect(fi.get('identifier', ['type1', 'type2']))
                .toEqual([{id: '1', date: '2018-01-01'}, {id: '2', date: '2018-01-01'}]);
        });

        it('do not match search term', () => {
            fi.add(doc('1', 'iden', 'type'));
            expect(fi.get('identifier', ['type']))
                .toEqual([]);
        });

        it('do not match search in type', () => {
            fi.add(doc('1', 'iden', 'type1'));
            expect(fi.get('identifier', ['type2']))
                .toEqual([]);
        });

        it('no types present', () => {
            expect(fi.get('identifier', ['type']))
                .toEqual([]);
        });

        it('clear', () => {
            fi.add(doc('1', 'identifier1', 'type'));
            fi.clear();
            expect(fi.get('identifier', ['type']))
                .toEqual([]);
        });

        xit('rough size estimate', () => {
            console.log("start")
            let str;
            for (let i=0; i < 100000;i++) {
                str = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 20);
                // console.log("string",str)
                fi.add(doc('1', str, 'type'));
            }

            fi.print();
            console.log(fi.get(str, ['type']))
        }, 20000);

        // TODO index more fields

        // TODO tokenize fields
    });
}