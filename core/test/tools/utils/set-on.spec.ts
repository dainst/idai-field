import { InPlace } from '../../../src/tools/in-place';


describe('setOn', () => {

    it('setOn', () => {

        const o: any = {a: 'b'};
        InPlace.setOn(o, 'a')('d');
        expect(o['a']).toBe('d');
    });


    it('setOn - create path - object', () => {

        const o: any = {};
        InPlace.setOn(o, 'a')('d');
        expect(o['a']).toBe('d');
    });


    it('setOn - create path - array and object', () => {

        const o: any = {};
        InPlace.setOn(o, ['a', 1])('d');
        expect(o['a'][1]).toBe('d');
    });

    it('setOn - nested', () => {

        const o: any = {a: {b: 'c'}};
        InPlace.setOn(o, ['a','b'])('d');
        expect(o['a']['b']).toBe('d');
    });


    it('setOn - nested - create path', () => {

        const o: any = {};
        InPlace.setOn(o, ['a','b'])('d');
        expect(o['a']['b']).toBe('d');
    });
});
