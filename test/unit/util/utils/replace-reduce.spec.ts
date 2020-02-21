import {replaceReduce} from '../../../../app/core/util/utils';

describe('replaceReduce', () => {

    it('array in, object out', () => {

        expect(
            replaceReduce((a: string) => [a, a + a], {})(['c','d'])
        ).toEqual({ c: 'cc', d: 'dd'});
    });


    it('object in, object out', () => {

        expect(
            replaceReduce((a: string) => [a, a + a], {})({m: 'c', n: 'd'})
        ).toEqual({ c: 'cc', d: 'dd'});
    });


    it('array in, array out', () => {

        expect(
            replaceReduce((a: string, i: number) => [i, a + a], ['l', 'm', 'n'])(['d', 'n'])
        ).toEqual(['dd', 'nn', 'n']);
    });


    it('object in, array out', () => {

        expect(
            replaceReduce((a: number, i: string) => [a, i + i], ['l', 'm', 'n'])({m: 0, n: 1})
        ).toEqual(['mm', 'nn', 'n']);
    });
});