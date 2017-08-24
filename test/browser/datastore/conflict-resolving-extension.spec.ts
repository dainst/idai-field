import {Document} from 'idai-components-2/core';
import {ConflictResolvingExtension} from '../../../app/datastore/conflict-resolving-extension';
import {isNullOrUndefined} from 'util';
import {unescape} from 'querystring';

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ConflictResolvingExtension', () => {

        let originalRevision: Document;
        let conflictedRevision: Document;
        let latestRevision: Document;

        let datastore;
        let db;
        let conflictResolver;
        let extension;

        beforeEach(() => {
            originalRevision = {
                resource: {
                    type: 'object',
                    id: '1',
                    relations: {}
                },
                created: {user: 'testuser1', date: new Date()},
                modified: [{user: 'testuser1', date: new Date()}]
            };
            originalRevision['_rev'] = '1-hij';

            conflictedRevision = {
                resource: {
                    type: 'object',
                    id: '1',
                    relations: {}
                },
                created: {user: 'testuser1', date: new Date()},
                modified: [{user: 'testuser1', date: new Date()}]
            };
            conflictedRevision['_rev'] = '2-xyz';

            latestRevision = {
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

            datastore = jasmine.createSpyObj('datastore', ['fetchRevision', 'fetch',
                'removeRevision']);
            db = jasmine.createSpyObj('db', [ 'put']);
            conflictResolver = jasmine.createSpyObj('conflictResolver', ['tryToSolveConflict']);

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

            extension = new ConflictResolvingExtension();
            extension.setDatastore(datastore);
            extension.setDb(db);
            extension.setConflictResolver(conflictResolver);
        });

        it('update one doc', done => {

            conflictResolver.tryToSolveConflict.and.returnValue(latestRevision);

            extension.autoResolve(latestRevision, 'testuser1').then(() => {
                expect(conflictResolver.tryToSolveConflict)
                    .toHaveBeenCalledWith(
                        latestRevision, conflictedRevision, originalRevision);
                expect(db.put).toHaveBeenCalledWith(latestRevision, { force: true });
                done();
            })
        });

        it('do not update doc if conflicts not resolved', done => {

            conflictResolver.tryToSolveConflict.and.returnValue(undefined);

            extension.autoResolve(latestRevision, 'testuser1').then(() => {
                expect(conflictResolver.tryToSolveConflict)
                    .toHaveBeenCalledWith(
                        latestRevision, conflictedRevision, originalRevision);
                expect(db.put).not.toHaveBeenCalled();
                done();
            })
        });
    });
}