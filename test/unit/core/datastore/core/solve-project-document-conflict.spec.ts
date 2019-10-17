import {Document} from 'idai-components-2';
import {solveProjectDocumentConflict} from '../../../../../app/core/datastore/core/solve-project-document-conflicts';
import {clone} from '../../../../../app/core/util/object-util';
import {Resources} from '../../../../../app/core/datastore/core/project-resource-conflict-resolution';
import {DatastoreUtil} from '../../../../../app/core/datastore/core/datastore-util';
import last = DatastoreUtil.last;


describe('solveProjectDocumentConflict', () => {


    it('basic', async done => {

        const current: Document = {
            created: { user: '', date: new Date('2019') },
            modified: [],
            resource: {
                id: '1',
                type: 'Object',
                relations: {}
            }
        };
        (current as any)['_conflicts'] = ['_'];

        const conflicted: Document = {
            created: { user: '', date: new Date('2019') },
            modified: [],
            resource: {
                id: '1',
                type: 'Object',
                relations: {}
            }
        };

        const solved = await solveProjectDocumentConflict(
            current,
            (resources: Resources) => [last(resources), [0]],
            last,
            (_: string) => Promise.resolve(clone(current)),
            (_: string, __: string) => Promise.resolve(clone(conflicted)),
            (document: Document) => {
                return Promise.resolve(document);
            }
        );

        expect(solved.resource.id).toBe('1'); // TODO improve
        done();
    });


    it('solve rightmost 2 of 3', async done => {

        const current: Document = {
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                type: 'Object',
                relations: {}
            }
        };
        (current as any)['_conflicts'] = ['c1', 'c2', 'c3'];

        const conflictedDocs: {[revisionId: string]: Document} = {

            c1: {
                created: { user: '', date: new Date('2017') },
                modified: [],
                resource: {
                    id: '1',
                    type: 'Object',
                    relations: {}
                }
            },
            c2: {
                created: { user: '', date: new Date('2018') },
                modified: [],
                resource: {
                    id: '1',
                    type: 'Object',
                    relations: {}
                }
            },
            c3: {
                created: { user: '', date: new Date('2019') },
                modified: [],
                resource: {
                    id: '1',
                    type: 'Object',
                    relations: {}
                }
            }
        };

        conflictedDocs['c1']['_rev'] = 'c1';
        conflictedDocs['c2']['_rev'] = 'c2';
        conflictedDocs['c3']['_rev'] = 'c3';

        let squashRevisionIds: string[] = [];

        await solveProjectDocumentConflict(
            current,
            (resources: Resources) => [last(resources), [1, 2]], // simulate that 2 conflicts got solved
            last,    // just resolve to the last resource
            (_: string) => Promise.resolve(clone(current)),
            (_: string, revisionId: string) => Promise.resolve(clone(conflictedDocs[revisionId])),
            (document: Document, squashRevisionIds_: string[]) => {
                squashRevisionIds = squashRevisionIds_;
                return Promise.resolve(document);
            }
        );

        expect(squashRevisionIds).toEqual(['c2', 'c3']);
        done();
    });


    it('solve c1 and c3', async done => {

        const current: Document = {
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                type: 'Object',
                relations: {}
            }
        };
        (current as any)['_conflicts'] = ['c1', 'c2', 'c3'];

        const conflictedDocs: {[revisionId: string]: Document} = {

            c1: {
                created: { user: '', date: new Date('2017') },
                modified: [],
                resource: {
                    id: '1',
                    type: 'Object',
                    relations: {}
                }
            },
            c2: {
                created: { user: '', date: new Date('2018') },
                modified: [],
                resource: {
                    id: '1',
                    type: 'Object',
                    relations: {}
                }
            },
            c3: {
                created: { user: '', date: new Date('2019') },
                modified: [],
                resource: {
                    id: '1',
                    type: 'Object',
                    relations: {}
                }
            }
        };

        conflictedDocs['c1']['_rev'] = 'c1';
        conflictedDocs['c2']['_rev'] = 'c2';
        conflictedDocs['c3']['_rev'] = 'c3';

        let squashRevisionIds: string[] = [];

        await solveProjectDocumentConflict(
            current,
            (resources: Resources) => [last(resources), [0, 2]], // simulate that 2 conflicts got solved
            last,    // just resolve to the last resource
            (_: string) => Promise.resolve(clone(current)),
            (_: string, revisionId: string) => Promise.resolve(clone(conflictedDocs[revisionId])),
            (document: Document, squashRevisionIds_: string[]) => {
                squashRevisionIds = squashRevisionIds_;
                return Promise.resolve(document);
            }
        );

        expect(squashRevisionIds).toEqual(['c1', 'c3']);
        done();
    });
});