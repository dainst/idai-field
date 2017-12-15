import {ResultSets} from '../../../../app/core/datastore/core/result-sets';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('ResultSets', () => {

        it('basic stuff', () => {

            let r: ResultSets = ResultSets.make();

            r = r.combine([{id:'1'},{id:'2'}]);
            r = r.combine([{id:'2'},{id:'2'}]);
            r = r.combine([{id:'2'},{id:'3'}]);

            expect(r.intersect()).toEqual([{id:'2'}]);
        });


        it('no intersection', () => {

            let r: ResultSets = ResultSets.make();

            r = r.combine([{id:'1'},{id:'2'}]);
            r = r.combine([{id:'3'},{id:'4'}]);

            expect(r.intersect()).toEqual([]);
        });


        it('no intersection with more results', () => {

            let r: ResultSets = ResultSets.make();

            r = r.combine([{id:'1'},{id:'2'}]);
            r = r.combine([{id:'2'},{id:'3'}]);
            r = r.combine([{id:'4'},{id:'5'}]);

            expect(r.intersect()).toEqual([]);
        });


        it('subtract', () => {

            let r: ResultSets = ResultSets.make();

            r = r.combine([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
            r = r.combine([{ id: '3' }, { id: '4' }], 'subtract');

            expect(r.intersect()).toEqual([{ id: '1' }, { id: '2' }]);
        });


        it('subtract and add multiple', () => {

            let r: ResultSets = ResultSets.make();

            r = r.combine([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
            r = r.combine([{ id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }]);
            r = r.combine([{ id: '3' }], 'subtract');
            r = r.combine([{ id: '4' }], 'subtract');

            expect(r.intersect()).toEqual([{ id: '2' }]);
        });
    });
}