import {AutoConflictResolvingExtension} from '../../../app/datastore/auto-conflict-resolving-extension';
/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('AutoConflictResolvingExtension', () => {

        it('match one with with different search terms', done => {

            const datastore = jasmine.createSpyObj('datastore', ['fetch']);
            const conflictResolver = jasmine.createSpyObj('conflictResolver', ['tryToSolveConflict']);
            const extension = new AutoConflictResolvingExtension();

            extension.setDatastore(datastore);
            extension.setConflictResolver(conflictResolver);

            extension.autoResolve({
               resource: {
                   type: 'object',
                   id: '1',
                   relations: {}
               }
            }, 'testuser').then(() => {
                done();
            })
        });

    });
}