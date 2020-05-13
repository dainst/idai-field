import {val} from 'tsfun';
import {CSVExpansion} from '../../../../../src/app/core/export/csv/csv-expansion';
import expandHomogeneousItems = CSVExpansion.expandHomogeneousItems;


/**
 * @author Daniel de Oliveira
 */
describe('CSVExpansion', () => {

    it('expand object', () => {

        const result = CSVExpansion.objectExpand(
            [
                ['l', 'abc', 'r'],
                [
                    ['l1', {a: 'A', b: 'B'}, null],
                    ['l2', {a: 'A'}, null]
                ]
            ] as any,
            val(['abc.a', 'abc.b']),
            expandHomogeneousItems(({a, b}: any) => [a, b ? b : ''], 2)
            )([1]);

        expect(result[0]).toEqual(['l', 'abc.a', 'abc.b', 'r']);
        expect(result[1][0]).toEqual(['l1', 'A', 'B', null]);
        expect(result[1][1]).toEqual(['l2', 'A', '', null]);
    });


    it('expand objectArray', () => {

        const result = CSVExpansion.objectArrayExpand(
            [
                ['l', 'abc', 'r'],
                [
                    ['l1', [{a: 'A', b: 'B'}], null],
                    ['l2', [{a: 'A'}], null]
                ]
            ] as any,
            val(val(['abc.0.a', 'abc.0.b'])),
            expandHomogeneousItems(({a, b}: any) => [a, b ? b : ''], 2)
        )([1]);

        expect(result[0]).toEqual(['l', 'abc.0.a', 'abc.0.b', 'r']);
        expect(result[1][0]).toEqual(['l1', 'A', 'B', null]);
        expect(result[1][1]).toEqual(['l2', 'A', '', null]);
    });


    it('expandHomogeneousItems', () => {

        const result =
            expandHomogeneousItems
            (({a, b}: any) => [a, b], 2)
            (2, 2)
            (['A', 'B', {a: 1, b: 2}, {a: 3, b: 4}, 'E']);

        expect(result).toEqual(['A', 'B', 1, 2, 3, 4, 'E']);
    });
});
