import {equal} from 'tsfun';
import {solveProjectResourceConflicts} from '../../../../../app/core/datastore/core/solve-project-resource-conflicts';


describe('solveProjectResourceConflicts', () => {

    it('two identical resources', () => {

        const left = {
            identifier: 'project-name',
            id: '1',
            type: 'Object',
            relations: {}
        };

        const right = {
            identifier: 'project-name',
            id: '1',
            type: 'Object',
            relations: {}
        };

        const result = solveProjectResourceConflicts([left, right])[0];

        const expectedResult = {
            identifier: 'project-name',
            id: '1',
            type: 'Object',
            relations: {}
        };

        expect(equal(result)(expectedResult)).toBeTruthy();
    });


    it('one is empty', () => {

        const left = {
            id: '1',
            identifier: 'project-name',
            type: 'Object',
            relations: {}
        };

        const right = {
            id: '1',
            identifier: 'project-name',
            aField: 'aValue',
            type: 'Object',
            relations: {}
        };


        const expectedResult = {
            id: '1',
            identifier: 'project-name',
            aField: 'aValue',
            type: 'Object',
            relations: {}
        };

        const result1 = solveProjectResourceConflicts([left, right])[0];
        expect(equal(result1)(expectedResult)).toBeTruthy();

        const result2 = solveProjectResourceConflicts([right, left])[0];
        expect(equal(result2)(expectedResult)).toBeTruthy();
    });


    it('unify staff', () => {

        const left = {
            id: '1',
            identifier: 'project-name',
            staff: ['a', 'b'],
            type: 'Object',
            relations: {}
        };

        const right = {
            id: '1',
            identifier: 'project-name',
            staff: ['b', 'c'],
            type: 'Object',
            relations: {}
        };


        const expectedResult = {
            id: '1',
            identifier: 'project-name',
            staff: ['a', 'b', 'c'],
            type: 'Object',
            relations: {}
        };

        const result = solveProjectResourceConflicts([left, right])[0];
        expect(equal(result)(expectedResult)).toBeTruthy();
    });


    it('do not unify staff', () => {

        const left = {
            id: '1',
            identifier: 'project-name',
            staff: ['a', 'b'],
            aField: 'aValue',
            type: 'Object',
            relations: {}
        };

        const right = {
            id: '1',
            identifier: 'project-name',
            staff: ['b', 'c'],
            bField: 'bValue',
            type: 'Object',
            relations: {}
        };

        const result = solveProjectResourceConflicts([left, right]);
        expect(result.length).toBe(2);
        expect(equal(left)(result[0])).toBeTruthy();
        expect(equal(right)(result[1])).toBeTruthy();
    });
});