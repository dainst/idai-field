import {Component, OnInit, ViewChild, TemplateRef} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Messages} from 'idai-components-2/messages';
import {SettingsService} from '../../core/settings/settings-service';
import {M} from '../../m';
import {DoceditComponent} from "../docedit/docedit.component";
import {PouchdbManager} from "../../core/datastore/pouchdb-manager";
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

    public ready: boolean = false;
    public projects: string[];
    public selectedProject: string;
    public newProject: string = '';
    public projectToDelete: string = '';

    @ViewChild('projectsModalTemplate') public modalTemplate: TemplateRef<any>;

    private modalRef: NgbModalRef;

    constructor(private settingsService: SettingsService,
                private modalService: NgbModal,
                private messages: Messages,
                private pouchdbManager: PouchdbManager) {
    }

    ngOnInit() {

        this.settingsService.ready.then(() => {
            this.ready = true;
            this.selectedProject = this.settingsService.getSelectedProject();
            this.projects = this.settingsService.getSettings().dbs.slice(0);
        });
    }

    public reset() {

        this.projectToDelete = '';
        this.newProject = '';
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

        if (!this.canDeleteProject()) return;

        return this.settingsService.deleteProject(this.selectedProject).then(() => {
            this.projects.splice(this.projects.indexOf(this.selectedProject), 1);
            this.selectedProject = this.projects[0];
            return this.switchProjectDb();
        });
    }

    public editProject() {

        this.pouchdbManager.getDb().get(this.selectedProject).then(document => {
            const doceditRef = this.modalService.open(DoceditComponent, { size: 'lg', backdrop: 'static' });
            doceditRef.componentInstance.setDocument(document);
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
            .then(() => {
                // we have to reload manually since protractor's selectors apparently aren't reliably working as they should after a reload. so we will do this by hand in the E2Es
                if (!remote.getGlobal('switches') || !remote.getGlobal('switches').prevent_reload) {
                    window.location.reload();
                }
            });
    }
}
