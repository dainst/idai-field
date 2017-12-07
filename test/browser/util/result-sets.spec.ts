import {ResultSets} from '../../../app/util/result-sets';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('ResultSets', () => {

        it('basic stuff', () => {

            let r: ResultSets = ResultSets.make();

            r = ResultSets.add(r, [{id:'1'},{id:'2'}]);
            r = ResultSets.add(r, [{id:'2'},{id:'2'}]);
            r = ResultSets.add(r, [{id:'2'},{id:'3'}]);

            expect(ResultSets.intersect(r, e => e.id)).toEqual([{id:'2'}]);
        });


        it('no intersection', () => {

            let r: ResultSets = ResultSets.make();

            r = ResultSets.add(r, [{id:'1'},{id:'2'}]);
            r = ResultSets.add(r, [{id:'3'},{id:'4'}]);

            expect(ResultSets.intersect(r, e => e.id)).toEqual([]);
        });


        it('no intersection with more results', () => {

            let r: ResultSets = ResultSets.make();

            r = ResultSets.add(r, [{id:'1'},{id:'2'}]);
            r = ResultSets.add(r, [{id:'2'},{id:'3'}]);
            r = ResultSets.add(r, [{id:'4'},{id:'5'}]);

            expect(ResultSets.intersect(r, e => e.id)).toEqual([]);
        });


        it('subtract', () => {

            let r: ResultSets = ResultSets.make();

            r = ResultSets.add(r, [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
            r = ResultSets.subtract(r, [{ id: '3' }, { id: '4' }]);

            expect(ResultSets.intersect(r, e => e.id)).toEqual([{ id: '1' }, { id: '2' }]);
        });


        it('subtract and add multiple', () => {

            let r: ResultSets = ResultSets.make();

            r = ResultSets.add(r, [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
            r = ResultSets.add(r, [{ id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }]);
            r = ResultSets.subtract(r, [{ id: '3' }]);
            r = ResultSets.subtract(r, [{ id: '4' }]);

            expect(ResultSets.intersect(r, e => e.id)).toEqual([{ id: '2' }]);
        });
    });
}