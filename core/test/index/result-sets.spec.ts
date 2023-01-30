import { ResultSets } from '../../src/index/result-sets';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ResultSets', () => {

    it('basic stuff', () => {

        const r = ResultSets.make<string>();

        ResultSets.combine(r, ['1', '2']);
        ResultSets.combine(r, ['2', '2']);
        ResultSets.combine(r, ['2','3']);

        expect(ResultSets.collapse(r)).toEqual(['2']);
    });


    it('no intersection', () => {

        const r = ResultSets.make<string>();

        ResultSets.combine(r, ['1','2']);
        ResultSets.combine(r, ['3','4']);

        expect(ResultSets.collapse(r)).toEqual([]);
    });


    it('no intersection with more results', () => {

        const r = ResultSets.make<string>();

        ResultSets.combine(r, ['1','2']);
        ResultSets.combine(r, ['2','3']);
        ResultSets.combine(r, ['4','5']);

        expect(ResultSets.collapse(r)).toEqual([]);
    });


    it('subtract', () => {

        const r = ResultSets.make<string>();

        ResultSets.combine(r, ['1', '2', '3', '4']);
        ResultSets.combine(r, ['3', '4'], true);

        expect(ResultSets.collapse(r)).toEqual(['1', '2']);
    });


    it('subtract and add multiple', () => {

        const r = ResultSets.make<string>();

        ResultSets.combine(r, ['1', '2', '3', '4']);
        ResultSets.combine(r, ['2', '3', '4', '5']);
        ResultSets.combine(r, ['3'], true);
        ResultSets.combine(r, ['4'], true);

        expect(ResultSets.collapse(r)).toEqual(['2']);
    });
});
