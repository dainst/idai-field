import {AfterViewChecked, Component, ElementRef, ViewChild} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbPopover} from '@ng-bootstrap/ng-bootstrap';
import {Messages} from 'idai-components-2';
import {SettingsService} from '../../core/settings/settings-service';
import {DoceditComponent} from '../docedit/docedit.component';
import {M} from '../m';
import {ProjectNameValidator} from '../../common/project-name-validator';

const remote = require('electron').remote;

@Component({
    selector: 'projects-modal',
    moduleId: module.id,
    templateUrl: './projects-modal.html',
    host: {
        '(document:click)': 'handleClick($event)',
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ProjectsModalComponent implements AfterViewChecked {

    public selectedProject: string;
    public newProject: string = '';
    public projectToDelete: string = '';

    private focusInput: boolean = false;

    @ViewChild('createPopover') private createPopover: NgbPopover;
    @ViewChild('deletePopover') private deletePopover: NgbPopover;
    @ViewChild('newProjectInput') private newProjectInput: ElementRef;
    @ViewChild('deleteProjectInput') private deleteProjectInput: ElementRef;


    constructor(public activeModal: NgbActiveModal,
                private settingsService: SettingsService,
                private modalService: NgbModal,
                private messages: Messages) {
    }


    ngAfterViewChecked() {

        if (this.focusInput) {
            if (this.newProjectInput) this.newProjectInput.nativeElement.focus();
            if (this.deleteProjectInput) this.deleteProjectInput.nativeElement.focus();
            this.focusInput = false;
        }
    }


    public getProjects = () => this.settingsService.getDbs();


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') {
            if (this.createPopover.isOpen()) {
                this.createPopover.close();
            } else if (this.deletePopover.isOpen()) {
                this.deletePopover.close();
            } else {
                this.activeModal.close();
            }
        }
    }


    public reset() {

        this.projectToDelete = '';
        this.newProject = '';
    }


    public openMenu(popover: any) {

        this.reset();
        popover.toggle();
        this.focusInput = true;
    }


    public async selectProject() {

        this.settingsService.stopSync();

        await this.settingsService.selectProject(this.selectedProject);
        ProjectsModalComponent.reload();
    }


    public async createProject() {

        const validationErrorMessage: string[]|undefined = ProjectNameValidator.validate(
            this.newProject, this.getProjects()
        );
        if (validationErrorMessage) return this.messages.add(validationErrorMessage);

        this.settingsService.stopSync();

        await this.settingsService.createProject(
            this.newProject,
            remote.getGlobal('switches')
            && remote.getGlobal('switches').destroy_before_create
        );
        ProjectsModalComponent.reload();
    }


    public async deleteProject() {

        if (!this.canDeleteProject()) return;

        this.settingsService.stopSync();

        await this.settingsService.deleteProject(this.selectedProject);
        this.selectedProject = this.getProjects()[0];
        ProjectsModalComponent.reload();
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


    public handleClick(event: Event) {

        let target: any = event.target;
        let insideCreatePopover: boolean = false;
        let insideDeletePopover: boolean = false;

        do {
            if (target.id === 'new-project-menu' || target.id === 'new-project-button') {
                insideCreatePopover = true;
            }
            if (target.id === 'delete-project-menu' || target.id === 'delete-project-button') {
                insideDeletePopover = true;
            }
            target = target.parentNode;
        } while (target);

        if (!insideCreatePopover && this.createPopover.isOpen()) this.createPopover.close();
        if (!insideDeletePopover && this.deletePopover.isOpen()) this.deletePopover.close();
    }


    private canDeleteProject() {

        if (!this.projectToDelete || (this.projectToDelete === '')) {
            return false;
        }
        if (this.projectToDelete !== this.selectedProject) {
            this.messages.add([M.RESOURCES_WARNING_PROJECT_NAME_NOT_SAME]);
            return false;
        }
        if (this.getProjects().length < 2) {
            this.messages.add([M.RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST]);
            return false;
        }
        return true;
    }


    // We have to reload manually since protractor's selectors apparently aren't reliably working as they
    // should after a reload. So we will do this by hand in the E2Es.
    private static reload() {

        if (!remote.getGlobal('switches') || !remote.getGlobal('switches').prevent_reload) {
            window.location.reload();
        }
    }
}