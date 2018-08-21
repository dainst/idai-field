import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Messages} from 'idai-components-2';
import {SettingsService} from '../../core/settings/settings-service';
import {M} from '../../m';
import {DoceditComponent} from "../docedit/docedit.component";

const remote = require('electron').remote;

@Component({
    selector: 'projects',
    moduleId: module.id,
    templateUrl: './projects.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ProjectsComponent implements OnInit {

    private static PROJECT_NAME_MAX_LENGTH = 18;

    public selectedProject: string;
    public newProject: string = '';
    public projectToDelete: string = '';

    @ViewChild('projectsModalTemplate') public modalTemplate: TemplateRef<any>;

    private modalRef: NgbModalRef;


    constructor(private settingsService: SettingsService,
                private modalService: NgbModal,
                private messages: Messages) {
    }


    public getProjects = () => this.settingsService.getDbs();


    ngOnInit() {

        this.selectedProject = this.settingsService.getSelectedProject();
    }


    public reset() {

        this.projectToDelete = '';
        this.newProject = '';
    }


    public openModal() {

        this.modalRef = this.modalService.open(this.modalTemplate);
    }


    public async selectProject() {

        await this.settingsService.selectProject(this.selectedProject);
        ProjectsComponent.reload();
    }


    public async createProject() {

        if (this.newProject === '') return this.messages.add([M.RESOURCES_ERROR_NO_PROJECT_NAME]);
        if (this.getProjects().includes(this.newProject)) {
            return this.messages.add([M.RESOURCES_ERROR_PROJECT_NAME_EXISTS, this.newProject]);
        }

        const lengthDiff = this.newProject.length - ProjectsComponent.PROJECT_NAME_MAX_LENGTH;
        if (lengthDiff > 0) {
            return this.messages.add([M.RESOURCES_ERROR_PROJECT_NAME_LENGTH, lengthDiff.toString()]);
        }

        const allowed = /^[0-9a-z\-_]+$/.test(this.newProject);
        if (!allowed) {
            return this.messages.add([M.RESOURCES_ERROR_PROJECT_NAME_SYMBOLS]);
        }

        await this.settingsService.createProject(
            this.newProject,
            remote.getGlobal('switches') && remote.getGlobal('switches').destroy_before_create
        );
        ProjectsComponent.reload();
    }


    public async deleteProject() {

        if (!this.canDeleteProject()) return;
        await this.settingsService.deleteProject(this.selectedProject);
        this.selectedProject = this.getProjects()[0];
        ProjectsComponent.reload();
    }


    public async editProject() {

        const document = this.settingsService.getProjectDocument();

        const doceditRef = this.modalService.open(DoceditComponent, { size: 'lg', backdrop: 'static' });
        doceditRef.componentInstance.setDocument(document);

        await doceditRef.result.then(
            () => this.settingsService.loadProjectDocument(),
            closeReason => {}
        );
    }


    private canDeleteProject() {

        if (!this.projectToDelete || (this.projectToDelete === '')) {
            return false;
        }
        if (this.projectToDelete !== this.selectedProject) {
            this.messages.add([M.RESOURCES_ERROR_PROJECT_NAME_NOT_SAME]);
            return false;
        }
        if (this.getProjects().length < 2) {
            this.messages.add([M.RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST]);
            return false;
        }
        return true;
    }


    // we have to reload manually since protractor's selectors apparently aren't reliably working as they should after a reload. so we will do this by hand in the E2Es
    private static reload() {

        if (!remote.getGlobal('switches') || !remote.getGlobal('switches').prevent_reload) {
            window.location.reload();
        }
    }
}