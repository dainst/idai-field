"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var number_util_1 = require("../../../app/util/number-util");
/**
 * @author Thomas Kleinke
 */
describe('NumberUtil', function () {
    it('validate unsigned float', function () {
        expect(number_util_1.validateUnsignedFloat('1234')).toBe(true);
        expect(number_util_1.validateUnsignedFloat('-1234')).toBe(false);
        expect(number_util_1.validateUnsignedFloat('1.234')).toBe(true);
        expect(number_util_1.validateUnsignedFloat('.234')).toBe(true);
        expect(number_util_1.validateUnsignedFloat('-1.234')).toBe(false);
        expect(number_util_1.validateUnsignedFloat('ABC1.234')).toBe(false);
        expect(number_util_1.validateUnsignedFloat('1.234ABC')).toBe(false);
        expect(number_util_1.validateUnsignedFloat('ABC')).toBe(false);
        expect(number_util_1.validateUnsignedFloat('123.')).toBe(false);
        expect(number_util_1.validateUnsignedFloat('')).toBe(false);
    });
    it('validate float', function () {
        expect(number_util_1.validateFloat('1234')).toBe(true);
        expect(number_util_1.validateFloat('-1234')).toBe(true);
        expect(number_util_1.validateFloat('1.234')).toBe(true);
        expect(number_util_1.validateFloat('.234')).toBe(true);
        expect(number_util_1.validateFloat('-1.234')).toBe(true);
        expect(number_util_1.validateFloat('ABC1.234')).toBe(false);
        expect(number_util_1.validateFloat('1.234ABC')).toBe(false);
        expect(number_util_1.validateFloat('ABC')).toBe(false);
        expect(number_util_1.validateFloat('123.')).toBe(false);
        expect(number_util_1.validateFloat('')).toBe(false);
    });
    it('validate unsigned int', function () {
        expect(number_util_1.validateUnsignedInt('1234')).toBe(true);
        expect(number_util_1.validateUnsignedInt('-1234')).toBe(false);
        expect(number_util_1.validateUnsignedInt('1.234')).toBe(false);
        expect(number_util_1.validateUnsignedInt('.234')).toBe(false);
        expect(number_util_1.validateUnsignedInt('-1.234')).toBe(false);
        expect(number_util_1.validateUnsignedInt('ABC1.234')).toBe(false);
        expect(number_util_1.validateUnsignedInt('1.234ABC')).toBe(false);
        expect(number_util_1.validateUnsignedInt('ABC')).toBe(false);
        expect(number_util_1.validateUnsignedInt('123.')).toBe(false);
        expect(number_util_1.validateUnsignedInt('')).toBe(false);
    });
});
//# sourceMappingURL=number-util.spec.js.map