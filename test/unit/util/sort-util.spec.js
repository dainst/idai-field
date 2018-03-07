"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sort_util_1 = require("../../../app/util/sort-util");
/**
 * @author Sebastian Cuy
 */
describe('SortUtil', function () {
    it('should sort strings alphanumerically', function () {
        expect(sort_util_1.SortUtil.alnumCompare('abc', 'abd')).toEqual(-1);
        expect(sort_util_1.SortUtil.alnumCompare('abd', 'abc')).toEqual(1);
        expect(sort_util_1.SortUtil.alnumCompare('abc', 'abc')).toEqual(0);
        expect(sort_util_1.SortUtil.alnumCompare('1', '2')).toEqual(-1);
        expect(sort_util_1.SortUtil.alnumCompare('2', '1')).toEqual(1);
        expect(sort_util_1.SortUtil.alnumCompare('1', '1')).toEqual(0);
        expect(sort_util_1.SortUtil.alnumCompare('2', '10')).toEqual(-1);
        expect(sort_util_1.SortUtil.alnumCompare('10', '2')).toEqual(1);
        expect(sort_util_1.SortUtil.alnumCompare('10', '10')).toEqual(0);
        expect(sort_util_1.SortUtil.alnumCompare('item2', 'item10')).toEqual(-1);
        expect(sort_util_1.SortUtil.alnumCompare('item10', 'item2')).toEqual(1);
        expect(sort_util_1.SortUtil.alnumCompare('item', 'item1')).toEqual(-1);
        expect(sort_util_1.SortUtil.alnumCompare('item1', 'item')).toEqual(1);
        expect(sort_util_1.SortUtil.alnumCompare('item101', 'item10a')).toEqual(1);
        expect(sort_util_1.SortUtil.alnumCompare('item10a', 'item101')).toEqual(-1);
        expect(sort_util_1.SortUtil.alnumCompare('a1b2c3d4', 'asdfghjkl')).toEqual(-1);
        expect(sort_util_1.SortUtil.alnumCompare('asdfghjkl', 'a1b2c3d4')).toEqual(1);
    });
    it('should sort strings alphabetically', function () {
        expect(sort_util_1.SortUtil.compare('abc', 'abd')).toEqual(-1);
        expect(sort_util_1.SortUtil.compare('abd', 'abc')).toEqual(1);
        expect(sort_util_1.SortUtil.compare('abc', 'abc')).toEqual(0);
    });
    it('should sort strings alphabetically and descending', function () {
        var comp = sort_util_1.SortUtil.compareDescending(sort_util_1.SortUtil.compare);
        expect(comp('abc', 'abd')).toEqual(1);
        expect(comp('abd', 'abc')).toEqual(-1);
        expect(comp('abc', 'abc')).toBe(0); // "toBe" necessary since -0 does not equal 0
    });
});
//# sourceMappingURL=sort-util.spec.js.map