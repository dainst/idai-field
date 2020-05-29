import {ResultSets} from '../../../../../src/app/core/datastore/index/result-sets';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ResultSets', () => {

    it('basic stuff', () => {

        const r: ResultSets = ResultSets.make();

        ResultSets.combine(r, ['1', '2'] as any);
        ResultSets.combine(r,['2', '2'] as any);
        ResultSets.combine(r,['2','3'] as any);

        expect(ResultSets.collapse(r)).toEqual(['2']);
    });


    it('no intersection', () => {

        const r: ResultSets = ResultSets.make();

        ResultSets.combine(r,['1','2'] as any);
        ResultSets.combine(r,['3','4'] as any);

        expect(ResultSets.collapse(r)).toEqual([]);
    });


    it('no intersection with more results', () => {

        const r: ResultSets = ResultSets.make();

        ResultSets.combine(r,['1','2'] as any);
        ResultSets.combine(r,['2','3'] as any);
        ResultSets.combine(r,['4','5'] as any);

        expect(ResultSets.collapse(r)).toEqual([]);
    });


    it('subtract', () => {

        const r: ResultSets = ResultSets.make();

        ResultSets.combine(r,['1', '2', '3', '4'] as any);
        ResultSets.combine(r,['3', '4'] as any, true);

        expect(ResultSets.collapse(r)).toEqual(['1', '2']);
    });


    it('subtract and add multiple', () => {

        const r: ResultSets = ResultSets.make();

        ResultSets.combine(r,['1', '2', '3', '4'] as any);
        ResultSets.combine(r,['2', '3', '4', '5'] as any);
        ResultSets.combine(r,['3'] as any, true);
        ResultSets.combine(r,['4'] as any, true);

        expect(ResultSets.collapse(r)).toEqual(['2']);
    });
});
