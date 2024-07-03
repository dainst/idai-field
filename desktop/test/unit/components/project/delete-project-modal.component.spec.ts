import { describe, expect, test, beforeEach } from '@jest/globals';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { M } from '../../../../src/app/components/messages/m';
import { DeleteProjectModalComponent } from '../../../../src/app/components/project/delete-project-modal.component';
import { StateSerializer } from '../../../../src/app/services/state-serializer';


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

        settingsProvider = {
            getSettings: jest.fn()
        };

        settingsService = {
            deleteProject: jest.fn()
        };

        messages = {
            add: jest.fn()
        };

        deleteProjectModalComponent = new DeleteProjectModalComponent(
            { close: () => {} } as NgbActiveModal,
            new StateSerializer(),
            settingsService,
            settingsProvider,
            messages
        );
    });


    test('cannot delete last project', async () => {

        settingsProvider.getSettings.mockReturnValue({ dbs: ['current'], selectedProject: 'current' });

        deleteProjectModalComponent.projectIdentifier = 'current';
        deleteProjectModalComponent.confirmDeletionProjectIdentifier = 'current';

        await deleteProjectModalComponent.confirmDeletion();
        expect(messages.add).toHaveBeenCalledWith([M.RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST]);
    });
});
