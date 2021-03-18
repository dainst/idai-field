import {ProjectsModalComponent} from '../../../../src/app/components/navbar/projects-modal.component';
import {M} from '../../../../src/app/components/messages/m';
import {StateSerializer} from '../../../../src/app/core/common/state-serializer';


/**
 * @author Daniel de Oliveira
 */
describe('ProjectsModalComponent', () => {

    let projectsModalComponent: ProjectsModalComponent;
    let settingsProvider;
    let settingsService;
    let messages;
    let menuService;


    beforeEach(() => {
        settingsProvider = jasmine.createSpyObj('settingsProvider', ['getSettings'])
        settingsService = jasmine.createSpyObj('settingsService', ['deleteProject']);
        messages = jasmine.createSpyObj('messages', ['add']);
        menuService = jasmine.createSpyObj('menuService', ['setContext']);

        projectsModalComponent = new ProjectsModalComponent(
            undefined,
            settingsProvider,
            settingsService,
            undefined,
            messages,
            new StateSerializer(),
            undefined,
            menuService
        );
    });


    it('cannot delete last project', async done => {

        settingsProvider.getSettings.and.returnValue({ dbs: ['current']});

        projectsModalComponent.selectedProject = 'current';
        projectsModalComponent.projectToDelete = 'current';

        await projectsModalComponent.deleteProject();
        expect(messages.add).toHaveBeenCalledWith([M.RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST]);
        done();
    });


    it('do not create with existing name', async done => {

        settingsProvider.getSettings.and.returnValue({ dbs: ['existing'] });

        projectsModalComponent.newProject = 'existing';

        await projectsModalComponent.createProject();
        expect(messages.add).toHaveBeenCalledWith([M.RESOURCES_ERROR_PROJECT_NAME_EXISTS, 'existing']);
        done();
    });
});
