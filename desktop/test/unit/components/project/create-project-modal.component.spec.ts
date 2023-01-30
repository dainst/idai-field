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
        
        settingsProvider = jasmine.createSpyObj('settingsProvider', ['getSettings'])
        settingsService = jasmine.createSpyObj('settingsService', ['deleteProject']);
        messages = jasmine.createSpyObj('messages', ['add']);

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


    it('cannot create project with existing identifier', async done => {

        settingsProvider.getSettings.and.returnValue({ dbs: ['existing'], selectedProject: 'existing' });

        createProjectModalComponent.projectIdentifier = 'existing';

        await createProjectModalComponent.createProject();
        expect(messages.add).toHaveBeenCalledWith([M.PROJECT_CREATION_ERROR_IDENTIFIER_EXISTS, 'existing']);
        done();
    });
});
