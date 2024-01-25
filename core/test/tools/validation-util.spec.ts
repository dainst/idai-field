import { validateFloat, validateInt, validateUnsignedFloat, validateUnsignedInt,
    validateUrl } from '../../src/tools/validation-util';


/**
 * @author Thomas Kleinke
 */
describe('ValidationUril', () => {

    it('validate int', () => {

        expect(validateInt('1234')).toBe(true);
        expect(validateInt('-1234')).toBe(true);
        expect(validateInt('1.234')).toBe(false);
        expect(validateInt('.234')).toBe(false);
        expect(validateInt('-1.234')).toBe(false);
        expect(validateInt('ABC1.234')).toBe(false);
        expect(validateInt('1.234ABC')).toBe(false);
        expect(validateInt('ABC')).toBe(false);
        expect(validateInt('123.')).toBe(false);
        expect(validateInt('')).toBe(false);
    });


    it('validate unsigned int', () => {

        expect(validateUnsignedInt('1234')).toBe(true);
        expect(validateUnsignedInt('-1234')).toBe(false);
        expect(validateUnsignedInt('1.234')).toBe(false);
        expect(validateUnsignedInt('.234')).toBe(false);
        expect(validateUnsignedInt('-1.234')).toBe(false);
        expect(validateUnsignedInt('ABC1.234')).toBe(false);
        expect(validateUnsignedInt('1.234ABC')).toBe(false);
        expect(validateUnsignedInt('ABC')).toBe(false);
        expect(validateUnsignedInt('123.')).toBe(false);
        expect(validateUnsignedInt('')).toBe(false);
    });


    it('validate float', () => {

        expect(validateFloat('1234')).toBe(true);
        expect(validateFloat('-1234')).toBe(true);
        expect(validateFloat('1.234')).toBe(true);
        expect(validateFloat('.234')).toBe(true);
        expect(validateFloat('-1.234')).toBe(true);
        expect(validateFloat('ABC1.234')).toBe(false);
        expect(validateFloat('1.234ABC')).toBe(false);
        expect(validateFloat('ABC')).toBe(false);
        expect(validateFloat('123.')).toBe(false);
        expect(validateFloat('')).toBe(false);
    });


    it('validate unsigned float', () => {

        expect(validateUnsignedFloat('1234')).toBe(true);
        expect(validateUnsignedFloat('-1234')).toBe(false);
        expect(validateUnsignedFloat('1.234')).toBe(true);
        expect(validateUnsignedFloat('.234')).toBe(true);
        expect(validateUnsignedFloat('-1.234')).toBe(false);
        expect(validateUnsignedFloat('ABC1.234')).toBe(false);
        expect(validateUnsignedFloat('1.234ABC')).toBe(false);
        expect(validateUnsignedFloat('ABC')).toBe(false);
        expect(validateUnsignedFloat('123.')).toBe(false);
        expect(validateUnsignedFloat('')).toBe(false);
    });


    it('validate URL', () => {
        
        expect(validateUrl('http://www.example.de')).toBe(true);
        expect(validateUrl('https://www.example.de')).toBe(true);
        expect(validateUrl('http://localhost:4000')).toBe(true);
        expect(validateUrl('http://example.de')).toBe(true);
        expect(validateUrl('http://abc')).toBe(false);
        expect(validateUrl('www.example.de')).toBe(false);
        expect(validateUrl('abc')).toBe(false);
    });
});
