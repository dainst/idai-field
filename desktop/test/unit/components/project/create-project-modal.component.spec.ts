import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { M } from '../../../../src/app/components/messages/m';
import { CreateProjectModalComponent } from '../../../../src/app/components/project/create-project-modal.component';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('CreateProjectModalComponent', () => {

    let createProjectModalComponent: CreateProjectModalComponent;
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

        createProjectModalComponent = new CreateProjectModalComponent(
            { close: () => {} } as NgbActiveModal,
            settingsService,
            settingsProvider,
            messages,
            undefined,
            undefined,
            undefined
        );
    });


    test('cannot create project with existing identifier', async () => {

        settingsProvider.getSettings.mockReturnValue({ dbs: ['existing'], selectedProject: 'existing' });

        createProjectModalComponent.projectIdentifier = 'existing';

        await createProjectModalComponent.createProject();
        expect(messages.add).toHaveBeenCalledWith([M.PROJECT_CREATION_ERROR_IDENTIFIER_EXISTS, 'existing']);
    });
});
