import {IdaiFieldConflictResolver} from '../../../app/model/idai-field-conflict-resolver';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('IdaiFieldConflictResolver', () => {

        const autoConflictResolver = new IdaiFieldConflictResolver();

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

        it('autosolve a conflict', () => {

            const originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
            const conflictedRevision = createDocument('id1', '2-abc', 'identifier1_changed', 'shortDescription1',
                'testuser1');
            const latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1_changed',
                'testuser2');

            autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision)

            expect(latestRevision.resource.identifier).toEqual('identifier1_changed');
            expect(latestRevision.resource.shortDescription).toEqual('shortDescription1_changed');
        });
    });
}