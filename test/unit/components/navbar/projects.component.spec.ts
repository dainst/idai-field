/**
 * @author Daniel de Oliveira
 */
import {ProjectsComponent} from '../../../../app/components/navbar/projects.component';
import {M} from '../../../../app/components/m';

describe('ProjectsComponent', () => {

    let projectsComponent: ProjectsComponent;
    let settingsService;
    let messages;

    beforeEach(() => {
        settingsService = jasmine.createSpyObj('settingsService',['deleteProject', 'getDbs']);
        messages = jasmine.createSpyObj('messages', ['add']);
        projectsComponent = new ProjectsComponent(settingsService, undefined, messages);
    });


    it('cannot delete last project', async done => {

        settingsService.getDbs.and.returnValue(['current']);

        projectsComponent.selectedProject = 'current';
        projectsComponent.projectToDelete = 'current';

        await projectsComponent.deleteProject();
        expect(messages.add).toHaveBeenCalledWith([M.RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST]);
        done();
    });


    it('do not create with existing name', async done => {

        settingsService.getDbs.and.returnValue(['existing']);

        projectsComponent.newProject = 'existing';

        await projectsComponent.createProject();
        expect(messages.add).toHaveBeenCalledWith([M.RESOURCES_ERROR_PROJECT_NAME_EXISTS, 'existing']);
        done();
    });
});