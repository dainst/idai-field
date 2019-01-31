import {ResultSets} from '../../../../../app/core/datastore/index/result-sets';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ResultSets', () => {

    it('basic stuff', () => {

        let r: ResultSets = ResultSets.make();

        ResultSets.combine(r, [{id:'1'},{id:'2'}]);
        ResultSets.combine(r,[{id:'2'},{id:'2'}]);
        ResultSets.combine(r,[{id:'2'},{id:'3'}]);

        expect(ResultSets.collapse(r)).toEqual([{id:'2'}]);
    });


    it('no intersection', () => {

        let r: ResultSets = ResultSets.make();

        ResultSets.combine(r,[{id:'1'},{id:'2'}]);
        ResultSets.combine(r,[{id:'3'},{id:'4'}]);

        expect(ResultSets.collapse(r)).toEqual([]);
    });


    it('no intersection with more results', () => {

        let r: ResultSets = ResultSets.make();

        ResultSets.combine(r,[{id:'1'},{id:'2'}]);
        ResultSets.combine(r,[{id:'2'},{id:'3'}]);
        ResultSets.combine(r,[{id:'4'},{id:'5'}]);

        expect(ResultSets.collapse(r)).toEqual([]);
    });


    it('subtract', () => {

        let r: ResultSets = ResultSets.make();

        ResultSets.combine(r,[{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
        ResultSets.combine(r,[{ id: '3' }, { id: '4' }], 'subtract');

        expect(ResultSets.collapse(r)).toEqual([{ id: '1' }, { id: '2' }]);
    });


    it('subtract and add multiple', () => {

        let r: ResultSets = ResultSets.make();

        ResultSets.combine(r,[{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
        ResultSets.combine(r,[{ id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }]);
        ResultSets.combine(r,[{ id: '3' }], 'subtract');
        ResultSets.combine(r,[{ id: '4' }], 'subtract');

        expect(ResultSets.collapse(r)).toEqual([{ id: '2' }]);
    });
});