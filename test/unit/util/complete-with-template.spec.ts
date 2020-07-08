import {completeWithTemplate} from '../../../src/app/core/util/complete-with-template';

describe('completeWithTemplate', () => {

    it('base case', () => {

        const result = completeWithTemplate({}, { a: 1 });
        expect(result['a']).toBe(1);
    });


    it('do not overwrite', () => {

        const result = completeWithTemplate({ a: 2 }, { a: 1 });
        expect(result['a']).toBe(2);
    });


    it('do not overwrite 2', () => {

        const result = completeWithTemplate({ a: 3 }, { a: { b: 1 } });
        expect(result['a']).toBe(3);
    });


    it('do not overwrite false', () => {

        const result = completeWithTemplate({ a: false }, { a: 3 });
        expect(result['a']).toBe(false);
    });


    it('recursive case 1', () => {

        const result = completeWithTemplate({}, { a: { b: 1 } });
        expect(result['a']['b']).toBe(1);
    });


    it('recursive case 2', () => {

        const result = completeWithTemplate({ a: {} }, { a: { b: 1 } });
        expect(result['a']['b']).toBe(1);
    });


    it('recursive case - do not overwrite', () => {

        const result = completeWithTemplate({ a: { b: 2 } }, { a: { b: 1 } });
        expect(result['a']['b']).toBe(2);
    });
});
