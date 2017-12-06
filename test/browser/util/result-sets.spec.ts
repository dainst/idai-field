import {ResultSets} from '../../../app/util/result-sets';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('ResultSets', () => {

        it('basic stuff', () => {

            let r = new ResultSets();

            r.add([{id:'1'},{id:'2'}]);
            r.add([{id:'2'},{id:'2'}]);
            r.add([{id:'2'},{id:'3'}]);

            expect(r.intersect(e => e.id)).toEqual([{id:'2'}]);
        });


        it('no intersection', () => {

            let r = new ResultSets();

            r.add([{id:'1'},{id:'2'}]);
            r.add([{id:'3'},{id:'4'}]);

            expect(r.intersect(e => e.id)).toEqual([]);
        });


        it('no intersection with more results', () => {

            let r = new ResultSets();

            r.add([{id:'1'},{id:'2'}]);
            r.add([{id:'2'},{id:'3'}]);
            r.add([{id:'4'},{id:'5'}]);

            expect(r.intersect(e => e.id)).toEqual([]);
        });


        it('subtract', () => {

            let r = new ResultSets();

            r.add([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
            r.subtract([{ id: '3' }, { id: '4' }]);

            expect(r.intersect(e => e.id)).toEqual([{ id: '1' }, { id: '2' }]);
        });

        it('subtract and add multiple', () => {

            let r = new ResultSets();

            r.add([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
            r.add([{ id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }]);
            r.subtract([{ id: '3' }]);
            r.subtract([{ id: '4' }]);

            expect(r.intersect(e => e.id)).toEqual([{ id: '2' }]);
        });
    });
}