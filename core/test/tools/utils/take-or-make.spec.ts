import { InPlace } from '../../../src/tools/in-place';


describe('takeOrMake', () => {

    it('takeOrMake makes', () => {

        const obj: any = { };
        InPlace.takeOrMake(obj, ['a','b','c'], []);
        expect(obj['a']['b']['c']).toEqual([]);
    });


    it('takeOrMake takes', () => {

        const obj: any = {a:{ b: { c: 'a'}}};
        InPlace.takeOrMake(obj, ['a','b','c'], []);
        expect(obj['a']['b']['c']).toEqual('a')
    });
});
