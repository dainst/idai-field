import {sameset} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {solveProjectDocumentConflict} from '../../../../../app/core/datastore/core/solve-project-document-conflicts';
import {clone} from '../../../../../app/core/util/object-util';
import {last} from '../../../../../app/core/datastore/core/helpers';


describe('solveProjectDocumentConflict', () => {


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
            (resources: Array<Resource>) => [last(resources), [1, 2]], // simulate that 2 conflicts got solved
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
            (resources: Array<Resource>) => [last(resources), [0, 2]], // simulate that 2 conflicts got solved
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


    it('solve all', async done => {

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
            (resources: Array<Resource>) => [last(resources), [0, 1, 2]], // simulate that all conflicts got solved
            (_: string) => Promise.resolve(clone(current)),
            (_: string, revisionId: string) => Promise.resolve(clone(conflictedDocs[revisionId])),
            (document: Document, squashRevisionIds_: string[]) => {
                squashRevisionIds = squashRevisionIds_;
                return Promise.resolve(document);
            }
        );

        expect(squashRevisionIds).toEqual(['c1', 'c2', 'c3']);
        done();
    });


    it('crush after unsuccesful resolution', async done => {

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
                    campaigns: ['1', '3'],
                    relations: {}
                }
            },
            c2: {
                created: { user: '', date: new Date('2018') },
                modified: [],
                resource: {
                    id: '1',
                    campaigns: ['1', '2'],
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
                    campaigns: ['2', '3'],
                    relations: {}
                }
            }
        };

        conflictedDocs['c1']['_rev'] = 'c1';
        conflictedDocs['c2']['_rev'] = 'c2';
        conflictedDocs['c3']['_rev'] = 'c3';

        let squashRevisionIds: string[] = [];

        const resultDoc = await solveProjectDocumentConflict(
            current,
            (resources: Array<Resource>) => [last(resources), []], // simulate that all conflicts got solved
            (_: string) => Promise.resolve(clone(current)),
            (_: string, revisionId: string) => Promise.resolve(clone(conflictedDocs[revisionId])),
            (document: Document, squashRevisionIds_: string[]) => {
                squashRevisionIds = squashRevisionIds_;
                return Promise.resolve(document);
            }
        );

        expect(sameset(resultDoc.resource['campaigns'])(['1', '2', '3'])).toBeTruthy();
        expect(squashRevisionIds).toEqual([]);
        done();
    });
});