import {FulltextIndexer} from '../../../../app/core/datastore/fulltext-indexer';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('FulltextIndexer', () => {

        let fi;

        function doc(id, identifier, type, shortDescription = 'short') {
            return {
                resource: {
                    id: id,
                    identifier: identifier,
                    shortDescription: shortDescription,
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

        function item(id, identifier?) {
            if (!identifier) identifier = 'identifier' + id;
            return {id: id, date: '2018-01-01', identifier: identifier};
        }

        beforeEach(() => {
            fi = new FulltextIndexer();
        });

        it('match one with with different search terms', () => {
            fi.put(doc('1', 'identifier1', 'type'));
            expect(fi.get('identifier1', ['type']))
                .toEqual([item('1')]);
            expect(fi.get('ide', ['type']))
                .toEqual([item('1')]);
        });

        it('match two with the same search term', () => {
            fi.put(doc('1', 'identifier1', 'type'));
            fi.put(doc('2', 'identifier2', 'type'));
            expect(fi.get('identifier', ['type']))
                .toEqual([item('1'), item('2')]);
        });

        it('match in all types', () => {
            fi.put(doc('1', 'identifier1', 'type'));
            expect(fi.get('identifier', undefined))
                .toEqual([item('1')]);
        });

        it('match in multiple selected types', () => {
            fi.put(doc('1', 'identifier1', 'type1'));
            fi.put(doc('2', 'identifier2', 'type2'));
            fi.put(doc('3', 'identifier3', 'type3'));
            expect(fi.get('identifier', ['type1', 'type2']))
                .toEqual([item('1'), item('2')]);
        });

        it('do not match search term', () => {
            fi.put(doc('1', 'iden', 'type'));
            expect(fi.get('identifier', ['type']))
                .toEqual([]);
        });

        it('do not match search in type', () => {
            fi.put(doc('1', 'iden', 'type1'));
            expect(fi.get('identifier', ['type2']))
                .toEqual([]);
        });

        it('match one with two search terms', () => {
            fi.put(doc('1', 'identifier1', 'type', 'a short description'));
            expect(fi.get('short description', ['type']))
                .toEqual([item('1')]);
            expect(fi.get('a description', ['type']))
                .toEqual([item('1')]);
        });

        it('ignore additional spaces', () => {
            fi.put(doc('1', 'identifier1', 'type', 'a short description'));
            expect(fi.get(' a    short  description  ', ['type']))
                .toEqual([item('1')]);
        });

        it('no types present', () => {
            expect(fi.get('identifier', ['type']))
                .toEqual([]);
        });

        it('clear', () => {
            fi.put(doc('1', 'identifier1', 'type'));
            fi.clear();
            expect(fi.get('identifier', ['type']))
                .toEqual([]);
        });

        it('remove', () => {
            const d = doc('1', 'identifier1', 'type');
            fi.put(d);
            fi.remove(d);
            expect(fi.get('identifier', ['type']))
                .toEqual([]);
        });

        it('search *', () => {
            fi.put(doc('1', 'identifier1', 'type'));
            expect(fi.get('*', ['type']))
                .toEqual([item('1')]);
        });

        it('index other field', () => {
            const d = doc('1', 'identifier1', 'type');
            fi.put(d);
            expect(fi.get('short', ['type']))
                .toEqual([item('1')]);
        });

        it('tokenize fields', () => {
            const d = doc('1', 'hello token', 'type');
            fi.put(d);
            expect(fi.get('hello', ['type']))
                .toEqual([item('1','hello token')]);
            expect(fi.get('token', ['type']))
                .toEqual([item('1','hello token')]);
        });

        it('find case insensitive', () => {
            fi.put(doc('1', 'Hello', 'type'));
            fi.put(doc('2', 'something', 'type'));
            expect(fi.get('hello', ['type']))
                .toEqual([item('1','Hello')]);
            expect(fi.get('Something', ['type']))
                .toEqual([item('2','something')]);
        });

        it('put overwrite', () => {
            const d = doc('1', 'identifier1', 'type');
            fi.put(d);
            d['resource']['identifier'] = 'identifier2';
            fi.put(d);
            expect(fi.get('identifier1', ['type']))
                .toEqual([]);
            expect(fi.get('identifier2', ['type']))
                .toEqual([item('1','identifier2')]);
        });

        it('shortDescription empty', () => {
            const d = doc('1', 'identifier1', 'type');
            d['resource']['shortDescription'] = '';
            fi.put(d);
            expect(fi.get('short', ['type']))
                .toEqual([]);
            d['resource']['shortDescription'] = undefined;
            fi.put(d);
            expect(fi.get('short', ['type']))
                .toEqual([]);
            delete d['resource']['shortDescription'];
            fi.put(d);
            expect(fi.get('short', ['type']))
                .toEqual([]);
        });
    });
}