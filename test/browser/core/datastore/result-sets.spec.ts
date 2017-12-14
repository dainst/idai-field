import {ResultSets} from '../../../../app/core/datastore/core/result-sets';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('ResultSets', () => {

        it('basic stuff', () => {

            let r: ResultSets = ResultSets.make();

            r = r.combine([{id:'1'},{id:'2'}] as any);
            r = r.combine([{id:'2'},{id:'2'}] as any);
            r = r.combine([{id:'2'},{id:'3'}] as any);

            expect(r.intersect()).toEqual([{id:'2'}] as any);
        });


        it('no intersection', () => {

            let r: ResultSets = ResultSets.make();

            r = r.combine([{id:'1'},{id:'2'}] as any);
            r = r.combine([{id:'3'},{id:'4'}] as any);

            expect(r.intersect()).toEqual([]);
        });


        it('no intersection with more results', () => {

            let r: ResultSets = ResultSets.make();

            r = r.combine([{id:'1'},{id:'2'}] as any);
            r = r.combine([{id:'2'},{id:'3'}] as any);
            r = r.combine([{id:'4'},{id:'5'}] as any);

            expect(r.intersect()).toEqual([]);
        });


        it('subtract', () => {

            let r: ResultSets = ResultSets.make();

            r = r.combine([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }] as any);
            r = r.combine([{ id: '3' }, { id: '4' }] as any, 'subtract');

            expect(r.intersect()).toEqual([{ id: '1' }, { id: '2' }] as any);
        });


        it('subtract and add multiple', () => {

            let r: ResultSets = ResultSets.make();

            r = r.combine([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }] as any);
            r = r.combine([{ id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }] as any);
            r = r.combine([{ id: '3' }] as any, 'subtract');
            r = r.combine([{ id: '4' }] as any, 'subtract');

            expect(r.intersect()).toEqual([{ id: '2' }] as any);
        });
    });
}