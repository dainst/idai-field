import { completeWithTemplate } from '../../../src/app/util/complete-with-template';


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


    // TODO use this in field-category-converter
    // first make a template for identifier, then, depending on case, for corresponding relation
    // with this, apply to struct. see if takeOrMake is still necessary then
    it('can also be used to merge templates first - then apply ', () => {

        const template = completeWithTemplate({ a: { b: 3 } }, { a: { c: 4 } });
        const result = completeWithTemplate({}, template );
        expect(result['a']['b']).toBe(3);
        expect(result['a']['c']).toBe(4);
    });
});
