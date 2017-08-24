import {Document} from 'idai-components-2/core';
import {ConflictResolvingExtension} from '../../../app/datastore/conflict-resolving-extension';

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ConflictResolvingExtension', () => {

        it('match one with with different search terms', done => {

            const originalRevision: Document = {
                resource: {
                    type: 'object',
                    id: '1',
                    relations: {}
                },
                created: {user: 'testuser1', date: new Date()},
                modified: [{user: 'testuser1', date: new Date()}]
            };
            originalRevision['_rev'] = '1-hij';

            const conflictedRevision: Document = {
                resource: {
                    type: 'object',
                    id: '1',
                    relations: {}
                },
                created: {user: 'testuser1', date: new Date()},
                modified: [{user: 'testuser1', date: new Date()}]
            };
            conflictedRevision['_rev'] = '2-xyz';

            const latestRevision: Document = {
                resource: {
                    type: 'object',
                    id: '1',
                    relations: {}
                },
                created: {user: 'testuser1', date: new Date()},
                modified: [{user: 'testuser1', date: new Date()}]
            };
            latestRevision['_rev'] = '2-abc';
            latestRevision['_conflicts'] = ['2-xyz'];

            const datastore = jasmine.createSpyObj('datastore', ['fetchRevision', 'fetch',
                'removeRevision']);
            const db = jasmine.createSpyObj('db', [ 'put']);
            const conflictResolver = jasmine.createSpyObj('conflictResolver', ['tryToSolveConflict']);
            const extension = new ConflictResolvingExtension();

            conflictResolver.tryToSolveConflict.and.returnValue({
                resolvedConflicts: 1,
                unresolvedConflicts: 0
            });

            db.put.and.callFake(() => Promise.resolve(undefined));
            datastore.removeRevision.and.callFake(() => Promise.resolve(undefined));
            datastore.fetchRevision.and.callFake((resourceId, revisionId) => {
                if (resourceId != '1') return Promise.reject(undefined);

                if (revisionId == '2-xyz') return Promise.resolve(conflictedRevision);
                if (revisionId == '1-hij') return Promise.resolve(originalRevision);
                return Promise.reject(undefined);
            });
            datastore.fetch.and.callFake((resourceId, options) => {
                if (resourceId != '1') return Promise.reject(undefined);
                if (options.revs_info == true) {
                    return Promise.resolve({_revs_info: [{rev: '1-hij', status: 'available'}]});
                } else {
                    return Promise.reject(undefined);
                }
            });

            extension.setDatastore(datastore);
            extension.setDb(db);
            extension.setConflictResolver(conflictResolver);

            extension.autoResolve(latestRevision, 'testuser1').then(() => {
                expect(conflictResolver.tryToSolveConflict)
                    .toHaveBeenCalledWith(
                        latestRevision, conflictedRevision, originalRevision);
                expect(db.put).toHaveBeenCalledWith(latestRevision, { force: true });
                done();
            })
        });
    });
}