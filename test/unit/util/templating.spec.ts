import {Templating} from '../../../src/app/core/util/templating';
import complateWithTemplate = Templating.complateWithTemplate;

describe('templating', () => {

    it('complateWithTemplate - base case', () => {

        const result = complateWithTemplate({}, { a: 1 });
        expect(result['a']).toBe(1);
    });


    it('complateWithTemplate - do not overwrite', () => {

        const result = complateWithTemplate({ a: 2 }, { a: 1 });
        expect(result['a']).toBe(2);
    });


    it('complateWithTemplate - do not overwrite 2', () => {

        const result = complateWithTemplate({ a: 3 }, { a: { b: 1 } });
        expect(result['a']).toBe(3);
    });


    it('complateWithTemplate - do not overwrite false', () => {

        const result = complateWithTemplate({ a: false }, { a: 1 });
        expect(result['a']).toBe(false);
    });


    it('complateWithTemplate - recursive case 1', () => {

        const result = complateWithTemplate({}, { a: { b: 1 } });
        expect(result['a']['b']).toBe(1);
    });


    it('complateWithTemplate - recursive case 2', () => {

        const result = complateWithTemplate({ a: {} }, { a: { b: 1 } });
        expect(result['a']['b']).toBe(1);
    });


    it('complateWithTemplate - recursive case - do not overwrite', () => {

        const result = complateWithTemplate({ a: { b: 2 } }, { a: { b: 1 } });
        expect(result['a']['b']).toBe(2);
    });
});
