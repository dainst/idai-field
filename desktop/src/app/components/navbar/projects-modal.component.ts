import { AfterViewChecked, AfterViewInit, Component, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { Document, Datastore } from 'idai-field-core';
import { AngularUtility } from '../../angular/angular-utility';
import { reload } from '../../core/common/reload';
import { StateSerializer } from '../../core/common/state-serializer';
import { ProjectNameValidator } from '../../core/model/project-name-validator';
import { SettingsProvider } from '../../core/settings/settings-provider';
import { SettingsService } from '../../core/settings/settings-service';
import { DoceditComponent } from '../docedit/docedit.component';
import { MenuContext, MenuService } from '../menu-service';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { ProjectNameValidatorMsgConversion } from '../messages/project-name-validator-msg-conversion';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


@Component({
    selector: 'projects-modal',
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
export class ProjectsModalComponent implements AfterViewInit, AfterViewChecked {

    public selectedProject: string;
    public newProject: string = '';
    public projectToDelete: string = '';
    public openConflictResolver: boolean = false;

    private focusInput: boolean = false;

    @ViewChild('createPopover', { static: false }) private createPopover: NgbPopover;
    @ViewChild('deletePopover', { static: false }) private deletePopover: NgbPopover;


    constructor(public activeModal: NgbActiveModal,
                private settingsProvider: SettingsProvider,
                private settingsService: SettingsService,
                private modalService: NgbModal,
                private messages: Messages,
                private stateSerializer: StateSerializer,
                private datastore: Datastore,
                private menuService: MenuService) {
    }


    async ngAfterViewInit() {

        if (this.openConflictResolver) await this.editProject('conflicts');
    }


    ngAfterViewChecked() {

        if (this.focusInput) {
            AngularUtility.focusElementInNgTemplate('new-project-input');
            AngularUtility.focusElementInNgTemplate('delete-project-input');
            this.focusInput = false;
        }
    }


    public getProjects = () => this.settingsProvider.getSettings().dbs;


    public onKeyDown(event: KeyboardEvent) {

        if (this.menuService.getContext() === MenuContext.PROJECTS && event.key === 'Escape') {
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


    public async selectProject(project: string) {

        await this.settingsService.selectProject(project);
        ProjectsModalComponent.reload();
    }


    public async createProject() {

        const validationErrorMessage: string[]|undefined =
            ProjectNameValidatorMsgConversion.convert(
                ProjectNameValidator.validate(this.newProject, this.getProjects())
            );
        if (validationErrorMessage) return this.messages.add(validationErrorMessage);

        await this.settingsService.createProject(
            this.newProject,
            remote.getGlobal('switches')
            && remote.getGlobal('switches').destroy_before_create
        );
        ProjectsModalComponent.reload();
    }


    public async deleteProject() {

        if (!this.canDeleteProject()) return;

        try {
            await this.stateSerializer.delete('resources-state');
            await this.stateSerializer.delete('matrix-state');
            await this.stateSerializer.delete('tabs-state');
        } catch (err) {
            // Ignore state file deletion errors
        }

        await this.settingsService.deleteProject(this.selectedProject);
        this.selectedProject = this.getProjects()[0];

        ProjectsModalComponent.reload();
    }


    public async editProject(activeGroup: string = 'stem') {

        this.menuService.setContext(MenuContext.DOCEDIT);

        const projectDocument: Document = await this.datastore.get('project');

        const doceditRef = this.modalService.open(DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        doceditRef.componentInstance.setDocument(projectDocument);
        doceditRef.componentInstance.activeGroup = activeGroup;

        try {
            await doceditRef.result;
        } catch(err) {
            // Docedit modal has been canceled
        }

        this.menuService.setContext(MenuContext.PROJECTS);
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
            reload();
        }
    }
}
