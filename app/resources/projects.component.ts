import {Component, OnInit, ViewChild} from '@angular/core';
import {Messages} from 'idai-components-2/messages';
import {SettingsService} from '../settings/settings-service';
import {ResourcesComponent} from './resources.component';
import {M} from '../m';

@Component({
    selector: 'projects',
    moduleId: module.id,
    templateUrl: './projects.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})

/**
 * @author Thomas Kleinke
 */
export class ProjectsComponent implements OnInit {

    public ready: boolean = false;
    public projects: string[];
    public selectedProject: string;
    public newProject: string = '';

    @ViewChild('popover') private popover;

    constructor(private settingsService: SettingsService,
                private resourcesComponent: ResourcesComponent,
                private messages: Messages) {
    }

    ngOnInit() {

        this.settingsService.ready.then(() => {
            this.ready = true;
            this.selectedProject = this.settingsService.getSelectedProject();
            this.projects = this.settingsService.getProjects().slice(0);
        });
    }

    public reset() {

        this.newProject = '';
    }

    public selectProject(project: string) {

        this.selectedProject = project;
        this.updateProjectSettings();
    }

    public createProject() {

        if (this.newProject == '') {
            return this.messages.add([M.RESOURCES_ERROR_NO_PROJECT_NAME]);
        }

        if (this.projects.indexOf(this.newProject) > -1) {
            return this.messages.add([M.RESOURCES_ERROR_PROJECT_NAME_EXISTS, this.newProject]);
        }

        this.popover.close();

        this.projects.push(this.newProject);
        this.selectedProject = this.newProject;
        this.updateProjectSettings();
    }

    private updateProjectSettings() {

        this.settingsService.setProjectSettings(this.projects, this.selectedProject)
            .then(() => this.settingsService.activateSettings(true))
            .then(() => this.resourcesComponent.initialize())
            .catch(msgWithParams => {
                if (msgWithParams) this.messages.add(msgWithParams)
            });
    }

    private handleClick(event) {

        if (!this.popover) return;

        let target = event.target;
        let inside = false;

        do {
            if (target.id == 'new-project-button' || target.id == 'new-project-menu') {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) this.popover.close();
    }
}
