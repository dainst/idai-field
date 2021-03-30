import { setOn } from '../../../src/tools/utils';


describe('setOn', () => {

    it('setOn', () => {

        const o: any = {a: 'b'};
        setOn(o, 'a')('d');
        expect(o['a']).toBe('d');
    });


    it('setOn - create path - object', () => {

        const o: any = {};
        setOn(o, 'a')('d');
        expect(o['a']).toBe('d');
    });


    it('setOn - create path - array and object', () => {

        const o: any = {};
        setOn(o, ['a', 1])('d');
        expect(o['a'][1]).toBe('d');
    });

    it('setOn - nested', () => {

        const o: any = {a: {b: 'c'}};
        setOn(o, ['a','b'])('d');
        expect(o['a']['b']).toBe('d');
    });


    it('setOn - nested - create path', () => {

        const o: any = {};
        setOn(o, ['a','b'])('d');
        expect(o['a']['b']).toBe('d');
    });
});
