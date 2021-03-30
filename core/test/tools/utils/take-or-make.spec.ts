import { takeOrMake } from '../../../src/tools/utils';


describe('takeOrMake', () => {

    it('takeOrMake makes', () => {

        const obj: any = { };
        takeOrMake(obj, ['a','b','c'], []);
        expect(obj['a']['b']['c']).toEqual([]);
    });


    it('takeOrMake takes', () => {

        const obj: any = {a:{ b: { c: 'a'}}};
        takeOrMake(obj, ['a','b','c'], []);
        expect(obj['a']['b']['c']).toEqual('a')
    });
});
