import { Field, I18N } from 'idai-field-core';
import { val } from 'tsfun';
import { CSVExpansion } from '../../../../../src/app/components/export/csv/csv-expansion';


/**
 * @author Daniel de Oliveira
 */
describe('CSVExpansion', () => {

    test('expand object', () => {

        const result = CSVExpansion.objectExpand(
            [
                ['l', 'abc', 'r'],
                [
                    ['l1', { a: 'A', b: 'B' }, null],
                    ['l2', { a: 'A' }, null]
                ]
            ] as any,
            val(['abc.a', 'abc.b']),
            CSVExpansion.expandHomogeneousItems(({ a, b }: any) => [a, b ? b : ''], 2)
            )([{ index: 1, field: { name: 'abc', inputType: 'input' } }]);

        expect(result[0]).toEqual(['l', 'abc.a', 'abc.b', 'r']);
        expect(result[1][0]).toEqual(['l1', 'A', 'B', null]);
        expect(result[1][1]).toEqual(['l2', 'A', '', null]);
    });


    test('expand objectArray', () => {

        const result = CSVExpansion.objectArrayExpand(
            [
                ['l', 'abc', 'r'],
                [
                    ['l1', [{ a: 'A', b: { de: 'B1', en: 'B2' } }], null],
                    ['l2', [{ a: 'A' }], null]
                ]
            ] as any,
            ['de'],
            'b',
            (languages: string[]) => val(val(['abc.0.a'].concat(languages.map(language => 'abc.0.b.' + language)))),
            (languages: string[]) => CSVExpansion.expandHomogeneousItems(({ a, b }: any) => {
                return [a].concat(b ? languages.map(language => b[language]) : []);
            }, 1 + languages.length)
        )([{ index: 1, field: { name: 'abc', inputType: Field.InputType.INPUT } }]);

        expect(result[0]).toEqual(['l', 'abc.0.a', 'abc.0.b.de', 'abc.0.b.en', 'r']);
        expect(result[1][0]).toEqual(['l1', 'A', 'B1', 'B2', null]);
        expect(result[1][1]).toEqual(['l2', 'A', '', '', null]);
    });


    test('expandHomogeneousItems', () => {

        const result = CSVExpansion.expandHomogeneousItems(({ a, b }: any) => [a, b], 2)
            (2, 2)
            (['A', 'B', { a: 1, b: 2 }, { a: 3, b: 4 }, 'E']);

        expect(result).toEqual(['A', 'B', 1, 2, 3, 4, 'E']);
    });


    test('expand i18n string', () => {

        const result = CSVExpansion.i18nStringExpand(
            [
                ['l', 'field1', 'field2'],
                [
                    ['l1', { de: 'A', en: 'B' }, 'a'],
                    ['l2', { de: 'C', it: 'D' }, 'b'],
                    ['l3', { en: 'E', unspecifiedLanguage: 'F' }, 'c'],
                    ['l4', 'G', 'd']
                ]
            ] as any,
            ['de', 'en', 'es'],
            (languages: string[]) => { return (fieldName) => languages.map(language => fieldName + '.' + language) },
            (languages: string[]) => CSVExpansion.expandHomogeneousItems(content =>
                languages.map(language => {
                    return content === 'G' && language === I18N.UNSPECIFIED_LANGUAGE
                        ? 'G'
                        : content[language] ?? ''
                }), languages.length)
            )([{ index: 1, field: { name: 'field1', inputType: 'input' } }]);

        expect(result[0]).toEqual(['l', 'field1.de', 'field1.en', 'field1.es', 'field1.it',
            'field1.unspecifiedLanguage', 'field2']);
        expect(result[1][0]).toEqual(['l1', 'A', 'B', '', '', '', 'a']);
        expect(result[1][1]).toEqual(['l2', 'C', '', '', 'D', '', 'b']);
        expect(result[1][2]).toEqual(['l3', '', 'E', '', '', 'F', 'c']);
        expect(result[1][3]).toEqual(['l4', '', '', '', '', 'G', 'd']);
    });
});
