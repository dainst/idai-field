import {intoObj, setOn, takeOrMake} from '../../../app/core/util/utils';


describe('utils', () => {

    it('intoObj - number key', () =>
        expect(

            intoObj('key', 'val')
            ({}, {key: 2, val: 7}))

            .toEqual({2: 7}));


    it('intoObj - string key', () =>
        expect(

            intoObj('key', 'val')
            ({}, {key: '2', val: 7}))

            .toEqual({2: 7}));


    it('intoObj - with reduce', () =>
        expect(

            [{key: 2, val: 7}, {key: 3, val: 8}]
                .reduce(intoObj('key', 'val'), {}))

            .toEqual({2: 7, 3: 8}));


    it('intoObj - missing key', () =>
        expect(

            [{key: 2, val: 7}, {val: 8}]
                .reduce(intoObj('key', 'val'), {}))

            .toEqual({2: 7}));


    it('intoObj - missing val', () =>
        expect(

            [{key: 2, val: 7}, {key: 8}]
                .reduce(intoObj('key', 'val'), {}))

            .toEqual({2: 7, 8: undefined}));


    it('setOn', () => {

        const o: any = {a: 'b'};
        setOn(o, 'a')('d');
        expect(o['a']).toBe('d');
    });


    it('setOn - create path - object', () => {

        const o: any = {};
        setOn(o,'a')('d');
        expect(o['a']).toBe('d');
    });


    it('setOn - create path - array and object', () => {

        const o: any = {};
        setOn(o, 'a.[1]')('d');
        expect(o['a'][1]).toBe('d');
    });

    it('setOn - nested', () => {

        const o: any = {a: {b: 'c'}};
        setOn(o, 'a.b')('d');
        expect(o['a']['b']).toBe('d');
    });


    it('setOn - nested - create path', () => {

        const o: any = {};
        setOn(o, 'a.b')('d');
        expect(o['a']['b']).toBe('d');
    });


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


    // xit('reimplement takeOrMake', () => { TODO review, maybe updateConnectedDocsForDocumentDeletion
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