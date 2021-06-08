import { Inplace } from '../../../src/tools/inplace';


describe('takeOrMake', () => {

    it('takeOrMake makes', () => {

        const obj: any = { };
        Inplace.takeOrMake(obj, ['a','b','c'], []);
        expect(obj['a']['b']['c']).toEqual([]);
    });


    it('takeOrMake takes', () => {

        const obj: any = {a:{ b: { c: 'a'}}};
        Inplace.takeOrMake(obj, ['a','b','c'], []);
        expect(obj['a']['b']['c']).toEqual('a')
    });
});
