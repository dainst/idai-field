import {Component, OnInit, ViewChild, TemplateRef} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Messages} from 'idai-components-2/messages';
import {SettingsService} from './settings/settings-service';
import {M} from './m';

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
 * @author Daniel de Oliveira
 */
export class ProjectsComponent implements OnInit {

    public ready: boolean = false;
    public projects: string[];
    public selectedProject: string;
    public newProject: string = '';
    public projectToDelete: string = '';

    @ViewChild('projectsModalTemplate') public modalTemplate: TemplateRef<any>;
    @ViewChild('popover') private popover;
    @ViewChild('deletePopover') private deletePopover;

    private modalRef: NgbModalRef;

    constructor(private settingsService: SettingsService,
                private modalService: NgbModal,
                private messages: Messages) {
    }

    ngOnInit() {

        this.settingsService.ready.then(() => {
            this.ready = true;
            this.selectedProject = this.settingsService.getSelectedProject();
            this.projects = this.settingsService.getProjects().slice(0);
        });
    }

    public openModal() {

        this.modalRef = this.modalService.open(this.modalTemplate);
    }

    public selectProject() {

        return this.switchProjectDb();
    }

    public createProject() {

        if (this.newProject == '') {
            return this.messages.add([M.RESOURCES_ERROR_NO_PROJECT_NAME]);
        }

        if (this.projects.indexOf(this.newProject) > -1) {
            return this.messages.add([M.RESOURCES_ERROR_PROJECT_NAME_EXISTS, this.newProject]);
        }

        this.projects.unshift(this.newProject);
        this.selectedProject = this.newProject;
        this.switchProjectDb(true);
    }

    public deleteProject() {

        if (!this.canDeleteProject()) return this.deletePopover.close();

        return this.settingsService.deleteProject(this.selectedProject).then(() => {
            this.projects.splice(this.projects.indexOf(this.selectedProject), 1);
            this.selectedProject = this.projects[0];
            return this.switchProjectDb();
        });
    }

    private canDeleteProject() {

        if (!this.projectToDelete || (this.projectToDelete == '')) {
            return false;
        }
        if (this.projectToDelete != this.selectedProject) {
            this.messages.add([M.RESOURCES_ERROR_PROJECT_NAME_NOT_SAME]);
            return false;
        }
        if (this.projects.length < 2) {
            this.messages.add([M.RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST]);
            return false;
        }
        return true;
    }

    private switchProjectDb(create = false) {

        return this.settingsService.setProjectSettings(
                this.projects, this.selectedProject, true, create)
            .then(() => window.location.reload());
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
