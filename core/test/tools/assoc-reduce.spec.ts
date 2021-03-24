import { assocReduce } from "../../src/tools/assoc-reduce";


describe('assocReduce', () => {

    it('array in, object out', () => {

        expect(
            assocReduce((a: string) => [a, a + a], {})(['c','d'])
        ).toEqual({ c: 'cc', d: 'dd'});
    });


    it('object in, object out', () => {

        expect(
            assocReduce((a: string) => [a, a + a], {})({m: 'c', n: 'd'})
        ).toEqual({ c: 'cc', d: 'dd'});
    });


    it('array in, array out', () => {

        expect(
            assocReduce((a: string, i: number) => [i, a + a], ['l', 'm', 'n'])(['d', 'n'])
        ).toEqual(['dd', 'nn', 'n']);
    });


    it('object in, array out', () => {

        expect(
            assocReduce((a: number, i: string) => [a, i + i], ['l', 'm', 'n'])({m: 0, n: 1})
        ).toEqual(['mm', 'nn', 'n']);
    });
});
