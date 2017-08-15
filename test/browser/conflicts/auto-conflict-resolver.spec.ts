import {DatastoreErrors} from 'idai-components-2/datastore';
import {AutoConflictResolver} from '../../../app/conflicts/auto-conflict-resolver';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('AutoConflictResolver', () => {

        const mockDatastore = jasmine.createSpyObj('datastore',
            ['update', 'getRevision', 'removeRevision', 'getRevisionHistory']);

        const autoConflictResolver = new AutoConflictResolver(mockDatastore);

        const createDocument = (id: string, rev: string, identifier: string, shortDescription: string, user: string) => {

            return {
                _id: id,
                _rev: rev,
                resource: {
                    id: id,
                    identifier: identifier,
                    shortDescription: shortDescription,
                    type: 'object',
                    relations: {}
                },
                modified: [ { date: new Date(), user: user } ],
                created: { date: new Date(), user: user }
            };
        };

        const configureMockDatastore = (originalRevision, conflictedRevision, latestRevision) => {

            const revisionHistory = [
                { rev: originalRevision['_rev'], status: 'available' },
                { rev: conflictedRevision['_rev'], status: 'available' },
                { rev: latestRevision['_rev'], status: 'available' }
            ];

            mockDatastore.getRevisionHistory.and.callFake(() => Promise.resolve(revisionHistory));
            mockDatastore.getRevision.and.callFake((resourceId, revisionId) => {
                if (resourceId != originalRevision.resource.id) Promise.reject([DatastoreErrors.DOCUMENT_NOT_FOUND]);

                switch(revisionId) {
                    case originalRevision['_rev']:
                        return Promise.resolve(originalRevision);
                    case conflictedRevision['_rev']:
                        return Promise.resolve(conflictedRevision);
                    case latestRevision['_rev']:
                        return Promise.resolve(latestRevision);
                    default:
                        return Promise.reject([DatastoreErrors.DOCUMENT_NOT_FOUND]);
                }
            });
            mockDatastore.update.and.callFake(() => Promise.resolve());
            mockDatastore.removeRevision.and.callFake(() => Promise.resolve());
        };

        it('autosolve a conflict', (done) => {

            const originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
            const conflictedRevision = createDocument('id1', '2-abc', 'identifier1_changed', 'shortDescription1',
                'testuser1');
            const latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1_changed',
                'testuser2');
            configureMockDatastore(originalRevision, conflictedRevision, latestRevision);

            autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision).then(() => {
                expect(latestRevision.resource.identifier).toEqual('identifier1_changed');
                expect(latestRevision.resource.shortDescription).toEqual('shortDescription1_changed');
                expect(mockDatastore.update).toHaveBeenCalled();
                expect(mockDatastore.removeRevision).toHaveBeenCalled();
            }).catch(err => {
                fail(err);
            }).then(done);
        });


    });
}