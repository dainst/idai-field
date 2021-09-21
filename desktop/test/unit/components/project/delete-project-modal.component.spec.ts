import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { M } from '../../../../src/app/components/messages/m';
import { DeleteProjectModalComponent } from '../../../../src/app/components/project/delete-project-modal.component';
import { StateSerializer } from '../../../../src/app/core/common/state-serializer';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('DeleteProjectModalComponent', () => {

    let deleteProjectModalComponent: DeleteProjectModalComponent;
    let settingsProvider;
    let settingsService;
    let messages;


    beforeEach(() => {
        settingsProvider = jasmine.createSpyObj('settingsProvider', ['getSettings'])
        settingsService = jasmine.createSpyObj('settingsService', ['deleteProject']);
        messages = jasmine.createSpyObj('messages', ['add']);

        deleteProjectModalComponent = new DeleteProjectModalComponent(
            { close: () => {} } as NgbActiveModal,
            new StateSerializer(),
            settingsService,
            settingsProvider,
            messages
        );
    });


    it('cannot delete last project', async done => {

        settingsProvider.getSettings.and.returnValue({ dbs: ['current'], selectedProject: 'current' });

        deleteProjectModalComponent.confirmDeletionProjectName = 'current';

        await deleteProjectModalComponent.confirmDeletion();
        expect(messages.add).toHaveBeenCalledWith([M.RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST]);
        done();
    });
});
