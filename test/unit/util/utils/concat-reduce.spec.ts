import {concatReduce} from '../../../../app/core/util/utils';


describe('concatReduce', () => {

    it('array in', () => {

        expect(

            concatReduce((a: string) => a + a, [])(['17', '19'])

        ).toEqual(['1717', '1919'])
    });


    it('object in', () => {

        expect(

            concatReduce((a: string, k: string) => a + k, [])({c: 'm', d: 'n'})

        ).toEqual(['mc', 'nd'])
    });
});