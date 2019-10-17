import {equal} from 'tsfun';
import {ProjectResourceConflictResolution} from '../../../../../app/core/datastore/core/project-resource-conflict-resolution';


describe('ProjectResourceConflictResolution', () => {

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

        const result = ProjectResourceConflictResolution.solveProjectResourceConflicts([left, right])[0];

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

        const [resolvedResource1, _] = ProjectResourceConflictResolution.solveProjectResourceConflicts([left, right]);
        expect(equal(resolvedResource1)(expectedResult)).toBeTruthy();

        const [resolvedResource2, __] = ProjectResourceConflictResolution.solveProjectResourceConflicts([right, left]);
        expect(equal(resolvedResource2)(expectedResult)).toBeTruthy();
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
            campaigns: [],
            type: 'Object',
            relations: {}
        };

        const [resolvedResource, indicesOfResolvedResources] = ProjectResourceConflictResolution.solveProjectResourceConflicts([left, right]);
        expect(equal(resolvedResource)(expectedResult)).toBeTruthy();
        expect(indicesOfResolvedResources).toEqual([0]);
    });


    it('unify staff and campaigns', () => {

        const left = {
            id: '1',
            identifier: 'project-name',
            staff: ['a', 'b'],
            campaigns: ['1', '2'],
            type: 'Object',
            relations: {}
        };

        const right = {
            id: '1',
            identifier: 'project-name',
            staff: ['b', 'c'],
            campaigns: ['2', '3'],
            type: 'Object',
            relations: {}
        };


        const expectedResult = {
            id: '1',
            identifier: 'project-name',
            staff: ['a', 'b', 'c'],
            campaigns: ['1', '2', '3'],
            type: 'Object',
            relations: {}
        };

        const [resolvedResource, indicesOfResolvedResources] = ProjectResourceConflictResolution.solveProjectResourceConflicts([left, right]);
        expect(equal(resolvedResource)(expectedResult)).toBeTruthy();
        expect(indicesOfResolvedResources).toEqual([0]);
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

        const [resolvedResource, indicesOfResolvedResources] = ProjectResourceConflictResolution.solveProjectResourceConflicts([left, right]);
        expect(indicesOfResolvedResources.length).toBe(0);
        expect(equal(right)(resolvedResource)).toBeTruthy();
    });


    it('skip one, solve another', () => {

        const left = {
            id: '1',
            identifier: 'project-name',
            type: 'Object',
            staff: [],
            relations: {}
        };

        const middle = {
            id: '1',
            identifier: 'project-name',
            aField: 'aValue2',
            type: 'Object',
            relations: {}
        };

        const right = {
            id: '1',
            identifier: 'project-name',
            staff: ['a', 'b'],
            type: 'Object',
            relations: {}
        };

        const result = {
            id: '1',
            identifier: 'project-name',
            staff: ['a', 'b'],
            campaigns: [],
            type: 'Object',
            relations: {}
        };

        const [resolvedResource, indicesOfResolvedResources] = ProjectResourceConflictResolution.solveProjectResourceConflicts([left, middle, right]);
        expect(indicesOfResolvedResources).toEqual([0]);
        expect(equal(result)(resolvedResource)).toBeTruthy();
    });


    it('createResourceForNewRevisionFrom', () => {

        const one = {
            id: '1',
            identifier: 'project-name',
            staff: ['a', 'b'],
            aField: 'aValue',
            type: 'Object',
            relations: {}
        };

        const two = {
            id: '1',
            identifier: 'project-name',
            type: 'Object',
            relations: {}
        };

        const three = {
            id: '1',
            identifier: 'project-name',
            staff: ['b', 'c'],
            bField: 'bValue',
            type: 'Object',
            relations: {}
        };

        const result = ProjectResourceConflictResolution.createResourceForNewRevisionFrom([one, two, three]);
        expect(result['aField']).toBeUndefined();
        expect(result['bField']).toBe('bValue');
        expect(result['staff']).toEqual(['a', 'b', 'c']);
    })
});