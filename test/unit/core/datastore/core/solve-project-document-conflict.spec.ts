import {sameset} from 'tsfun';
import {Document} from 'idai-components-2';
import {solveProjectDocumentConflict} from '../../../../../app/core/datastore/core/solve-project-document-conflicts';
import {clone} from '../../../../../app/core/util/object-util';


describe('solveProjectDocumentConflict', () => {

    it('2 identical resources', async done => {

        const current: Document = {
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                type: 'Object',
                aField: 'aValue',
                relations: {}
            }
        };
        (current as any)['_conflicts'] = ['c1'];

        const conflictedDocs = {

            c1: {
                created: { user: '', date: new Date() },
                modified: [],
                resource: {
                    id: '1',
                    type: 'Object',
                    aField: 'aValue',
                    relations: {}
                },
                '_rev': 'c1'
            }
        } as {[revisionId: string]: Document};

        let squashRevisionIds: string[] = [];

        const result = await solveProjectDocumentConflict(
            current,
            ['c1'],
            (_: string, revisionId: string) => Promise.resolve(clone(conflictedDocs[revisionId])),
            (document: Document, squashRevisionIds_: string[]) => {
                squashRevisionIds = squashRevisionIds_;
                return Promise.resolve(document);
            }
        );

        expect(result.resource['aField']).toEqual('aValue');
        expect(squashRevisionIds).toEqual(['c1']);
        done();
    });


    it('current is empty', async done => {

        const current: Document = {
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                type: 'Object',
                relations: {}
            }
        };
        (current as any)['_conflicts'] = ['c1'];

        const conflictedDocs = {

            c1: {
                created: { user: '', date: new Date() },
                modified: [],
                resource: {
                    id: '1',
                    type: 'Object',
                    aField: 'aValue',
                    relations: {}
                },
                '_rev': 'c1'
            }
        } as {[revisionId: string]: Document};

        let squashRevisionIds: string[] = [];

        const result = await solveProjectDocumentConflict(
            current,
            ['c1'],
            (_: string, revisionId: string) => Promise.resolve(clone(conflictedDocs[revisionId])),
            (document: Document, squashRevisionIds_: string[]) => {
                squashRevisionIds = squashRevisionIds_;
                return Promise.resolve(document);
            }
        );

        expect(result.resource['aField']).toEqual('aValue');
        expect(squashRevisionIds).toEqual(['c1']);
        done();
    });


    it('conflicted is empty', async done => {

        const current: Document = {
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                type: 'Object',
                aField: 'aValue',
                relations: {}
            }
        };
        (current as any)['_conflicts'] = ['c1'];

        const conflictedDocs = {

            c1: {
                created: { user: '', date: new Date() },
                modified: [],
                resource: {
                    id: '1',
                    type: 'Object',
                    relations: {}
                },
                '_rev': 'c1'
            }
        } as {[revisionId: string]: Document};

        let squashRevisionIds: string[] = [];

        const result = await solveProjectDocumentConflict(
            current,
            ['c1'],
            (_: string, revisionId: string) => Promise.resolve(clone(conflictedDocs[revisionId])),
            (document: Document, squashRevisionIds_: string[]) => {
                squashRevisionIds = squashRevisionIds_;
                return Promise.resolve(document);
            }
        );

        expect(result.resource['aField']).toEqual('aValue');
        expect(squashRevisionIds).toEqual(['c1']);
        done();
    });


    it('solve rightmost 2 of 3 - thereby unify staff', async done => {

        const current: Document = {
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                type: 'Object',
                staff: ['a'],
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
                    'aField': 'aValue',
                    relations: {}
                }
            },
            c2: {
                created: { user: '', date: new Date('2018') },
                modified: [],
                resource: {
                    id: '1',
                    type: 'Object',
                    staff: ['b'],
                    relations: {}
                }
            },
            c3: {
                created: { user: '', date: new Date('2019') },
                modified: [],
                resource: {
                    id: '1',
                    type: 'Object',
                    staff: ['c'],
                    relations: {}
                }
            }
        };

        conflictedDocs['c1']['_rev'] = 'c1';
        conflictedDocs['c2']['_rev'] = 'c2';
        conflictedDocs['c3']['_rev'] = 'c3';

        let squashRevisionIds: string[] = [];

        const result = await solveProjectDocumentConflict(
            current,
            ['c1', 'c2', 'c3'],
            (_: string, revisionId: string) => Promise.resolve(clone(conflictedDocs[revisionId])),
            (document: Document, squashRevisionIds_: string[]) => {
                squashRevisionIds = squashRevisionIds_;
                return Promise.resolve(document);
            }
        );

        expect(sameset(result.resource['staff'])(['a', 'b', 'c'])).toBeTruthy();
        expect(squashRevisionIds).toEqual(['c2', 'c3']);
        done();
    });


    it('solve c1 and c3 - thereby unify campaigns', async done => {

        const current: Document = {
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                id: '1',
                type: 'Object',
                campaigns: ['1'],
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
                    campaigns: ['2'],
                    relations: {}
                }
            },
            c2: {
                created: { user: '', date: new Date('2018') },
                modified: [],
                resource: {
                    id: '1',
                    type: 'Object',
                    aField: 'aValue',
                    relations: {}
                }
            },
            c3: {
                created: { user: '', date: new Date('2019') },
                modified: [],
                resource: {
                    id: '1',
                    type: 'Object',
                    campaigns: ['3'],
                    relations: {}
                }
            }
        };

        conflictedDocs['c1']['_rev'] = 'c1';
        conflictedDocs['c2']['_rev'] = 'c2';
        conflictedDocs['c3']['_rev'] = 'c3';

        let squashRevisionIds: string[] = [];

        const result = await solveProjectDocumentConflict(
            current,
            ['c1', 'c2', 'c3'],
            (_: string, revisionId: string) => Promise.resolve(clone(conflictedDocs[revisionId])),
            (document: Document, squashRevisionIds_: string[]) => {
                squashRevisionIds = squashRevisionIds_;
                return Promise.resolve(document);
            }
        );

        expect(sameset(result.resource['campaigns'])(['1', '2', '3'])).toBeTruthy();
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
            ['c1', 'c2', 'c3'],
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
                aField: 'aValue',
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
                    aField: 'aValue2',
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
                    aField: 'aValue2',
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
                    aField: 'aValue3',
                    relations: {}
                }
            }
        };

        conflictedDocs['c1']['_rev'] = 'c1';
        conflictedDocs['c2']['_rev'] = 'c2';
        conflictedDocs['c3']['_rev'] = 'c3';

        let squashRevisionIds: string[] = [];

        const result = await solveProjectDocumentConflict(
            current,
            ['c1', 'c2', 'c3'],
            (_: string, revisionId: string) => Promise.resolve(clone(conflictedDocs[revisionId])),
            (document: Document, squashRevisionIds_: string[]) => {
                squashRevisionIds = squashRevisionIds_;
                return Promise.resolve(document);
            }
        );

        expect(sameset(result.resource['campaigns'])(['1', '2', '3'])).toBeTruthy();
        expect(result.resource['aField']).toEqual('aValue');
        expect(squashRevisionIds).toEqual([]);
        done();
    });
});