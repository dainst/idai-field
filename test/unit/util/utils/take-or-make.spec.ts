import {takeOrMake} from '../../../../app/core/util/utils';


describe('takeOrMake', () => {

    it('takeOrMake makes', () => {

        const obj: any = { };
        takeOrMake(obj, 'a.b.c', []);
        expect(obj['a']['b']['c']).toEqual([]);
    });


    it('takeOrMake takes', () => {

        const obj: any = {a:{ b: { c: 'a'}}};
        takeOrMake(obj, 'a.b.c', []);
        expect(obj['a']['b']['c']).toEqual('a')
    });


    // xit('reimplement takeOrMake', () => { TODO review, maybe remove
    //
    //     const o1: any = {a: {b: {c: 'd'}}};
    //
    //     const takeOrMake = <T>(o: T, path: string, alternative: any) =>
    //         setOn(o, path)(getOn(path , alternative)(o));
    //
    //     takeOrMake(o1, 'a.b.c', undefined); // take
    //     expect(o1['a']['b']['c']).toBe('d');
    //
    //     const o2: any = {a: {b: {c: undefined}}};
    //
    //     takeOrMake(o2, 'a.b.c', 'd'); // make
    //     expect(o2['a']['b']['c']).toBe('d');
    // });
});