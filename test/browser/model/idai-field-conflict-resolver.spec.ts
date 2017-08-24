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

        // TODO add test for no result if not all conflicts resolved

        it('autosolve a conflict', () => {

            const originalRevision = createDocument('id1', '1-xyz', 'identifier1', 'shortDescription1', 'testuser1');
            const conflictedRevision = createDocument('id1', '2-abc', 'identifier1_changed', 'shortDescription1',
                'testuser1');
            const latestRevision = createDocument('id1', '2-def', 'identifier1', 'shortDescription1_changed',
                'testuser2');

            const updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision)

            expect(updatedLatestRevision.resource.identifier).toEqual('identifier1_changed');
            expect(updatedLatestRevision.resource.shortDescription).toEqual('shortDescription1_changed');
        });

        it('do not autosolve on relation conflict', () => {

            const originalRevision = createDocument('1', '1-xyz', 'identifier', 'shortDescription', 'testuser1');
            const conflictedRevision = createDocument('1', '2-abc', 'identifier', 'shortDescription',
                'testuser1');
            const latestRevision = createDocument('1', '2-def', 'identifier', 'shortDescription',
                'testuser2');

            latestRevision.resource.relations['isRecordedIn'] = ['2'];

            const updatedLatestRevision = autoConflictResolver.tryToSolveConflict(latestRevision, conflictedRevision, originalRevision);
            expect(updatedLatestRevision).toBeUndefined();
        });
    });
}