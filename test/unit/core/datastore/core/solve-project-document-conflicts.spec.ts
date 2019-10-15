import {equal} from 'tsfun';
import {solveConflictBetween2ProjectDocuments} from '../../../../../app/core/datastore/core/solve-project-document-conflicts';


describe('solveProjectDocumentConflicts', () => {

    it('two identical resources', () => {

        const left = {
            created: { user: 'anonymous1', date: new Date() },
            modified: [],
            resource: {
                identifier: 'project-name',
                id: '1',
                type: 'Object',
                relations: {}
            }
        };

        const right = {
            created: { user: 'anonymous2', date: new Date() },
            modified: [],
            resource: {
                identifier: 'project-name',
                id: '1',
                type: 'Object',
                relations: {}
            }
        };

        const result = solveConflictBetween2ProjectDocuments(left, right);

        const expectedResult = {
            created: { user: 'anonymous2', date: new Date() },
            modified: [],
            resource: {
                identifier: 'project-name',
                id: '1',
                type: 'Object',
                relations: {}
            }
        };

        expect(equal(result.resource)(expectedResult.resource)).toBeTruthy();
    });


    it('one is empty', () => {

        const left = {
            created: { user: 'anonymous1', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                identifier: 'project-name',
                type: 'Object',
                relations: {}
            }
        };

        const right = {
            created: { user: 'anonymous2', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                identifier: 'project-name',
                aField: 'aValue',
                type: 'Object',
                relations: {}
            }
        };


        const expectedResult = {
            created: { user: 'anonymous2', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                identifier: 'project-name',
                aField: 'aValue',
                type: 'Object',
                relations: {}
            }
        };

        const result1 = solveConflictBetween2ProjectDocuments(left, right);
        expect(equal(result1.resource)(expectedResult.resource)).toBeTruthy();

        const result2 = solveConflictBetween2ProjectDocuments(right, left);
        expect(equal(result2.resource)(expectedResult.resource)).toBeTruthy();
    });


    it('unify staff', () => {

        const left = {
            created: { user: 'anonymous1', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                identifier: 'project-name',
                staff: ['a', 'b'],
                type: 'Object',
                relations: {}
            }
        };

        const right = {
            created: { user: 'anonymous2', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                identifier: 'project-name',
                staff: ['b', 'c'],
                type: 'Object',
                relations: {}
            }
        };


        const expectedResult = {
            created: { user: 'anonymous2', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                identifier: 'project-name',
                staff: ['a', 'b', 'c'],
                type: 'Object',
                relations: {}
            }
        };

        const result = solveConflictBetween2ProjectDocuments(left, right);
        expect(equal(result.resource)(expectedResult.resource)).toBeTruthy();
    });


    it('do not unify staff', () => {

        const left = {
            created: { user: 'anonymous1', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                identifier: 'project-name',
                staff: ['a', 'b'],
                aField: 'aValue',
                type: 'Object',
                relations: {}
            }
        };

        const right = {
            created: { user: 'anonymous2', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                identifier: 'project-name',
                staff: ['b', 'c'],
                bField: 'bValue',
                type: 'Object',
                relations: {}
            }
        };

        try {
            solveConflictBetween2ProjectDocuments(left, right);
            fail();
        } catch {} // expected
    });
});