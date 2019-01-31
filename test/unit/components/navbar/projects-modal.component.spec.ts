import {ProjectsModalComponent} from '../../../../app/components/navbar/projects-modal.component';
import {M} from '../../../../app/components/m';


/**
 * @author Daniel de Oliveira
 */
describe('ProjectsModalComponent', () => {

    let projectsModalComponent: ProjectsModalComponent;
    let settingsService;
    let messages;


    beforeEach(() => {
        settingsService = jasmine.createSpyObj(
            'settingsService',['deleteProject', 'getDbs']
        );
        messages = jasmine.createSpyObj('messages', ['add']);
        projectsModalComponent = new ProjectsModalComponent(
            undefined, settingsService, undefined, messages
        );
    });


    it('cannot delete last project', async done => {

        settingsService.getDbs.and.returnValue(['current']);

        projectsModalComponent.selectedProject = 'current';
        projectsModalComponent.projectToDelete = 'current';

        await projectsModalComponent.deleteProject();
        expect(messages.add).toHaveBeenCalledWith([M.RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST]);
        done();
    });


    it('do not create with existing name', async done => {

        settingsService.getDbs.and.returnValue(['existing']);

        projectsModalComponent.newProject = 'existing';

        await projectsModalComponent.createProject();
        expect(messages.add).toHaveBeenCalledWith([M.RESOURCES_ERROR_PROJECT_NAME_EXISTS, 'existing']);
        done();
    });
});