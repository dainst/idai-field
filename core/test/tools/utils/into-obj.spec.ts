import { intoObj } from '../../../src/tools/utils';


describe('intoObj', () => {

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
});
