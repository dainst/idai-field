import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, Document } from 'idai-field-core';
import { DoceditComponent } from '../components/docedit/docedit.component';
import { CreateProjectModalComponent } from '../components/project/create-project-modal.component';
import { DeleteProjectModalComponent } from '../components/project/delete-project-modal.component';
import { ProjectInformationModalComponent } from '../components/project/project-information-modal.component';
import { SynchronizationModalComponent } from '../components/project/synchronization-modal.component';
import { ViewModalLauncher } from '../components/viewmodal/view-modal-launcher';
import { MenuContext } from './menu-context';
import { Menus } from './menus';
import { SettingsProvider } from './settings/settings-provider';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ProjectModalLauncher {

    constructor(private modalService: NgbModal,
                private menuService: Menus,
                private viewModalLauncher: ViewModalLauncher,
                private datastore: Datastore,
                private settingsProvider: SettingsProvider) {}


   public async createProject() {

        const menuContext: MenuContext = this.menuService.getContext();
        this.setModalContext(menuContext);

        const modalRef = this.modalService.open(
            CreateProjectModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );

        try {
            await modalRef.result;
        } catch(err) {
            // Create project modal has been canceled
        }

        this.menuService.setContext(menuContext);
    }


    public async editProject(activeGroup: string = 'stem') {

        const menuContext: MenuContext = this.menuService.getContext();
        this.menuService.setContext(MenuContext.DOCEDIT);

        const projectDocument: Document = await this.datastore.get('project');

        const modalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false, animation: false }
        );
        modalRef.componentInstance.setDocument(projectDocument);
        modalRef.componentInstance.activeGroup = activeGroup;

        try {
            await modalRef.result;
        } catch(err) {
            // Docedit modal has been canceled
        }

        this.menuService.setContext(menuContext);
    }


    public async deleteProject(projectName: string) {

        const menuContext: MenuContext = this.menuService.getContext();
        this.setModalContext(menuContext);

        const modalRef = this.modalService.open(
            DeleteProjectModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );

        modalRef.componentInstance.projectName = projectName;

        try {
            await modalRef.result;
        } catch(err) {
            // Delete project modal has been canceled
        }

        this.menuService.setContext(menuContext);
    }


    public async openSynchronizationModal() {

        const menuContext: MenuContext = this.menuService.getContext();
        this.setModalContext(menuContext);

        const modalRef = this.modalService.open(
            SynchronizationModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );

        try {
            await modalRef.result;
        } catch(err) {
            // Synchronization project modal has been canceled
        }

        this.menuService.setContext(menuContext);
    }


    public async openInformationModal() {

        const menuContext: MenuContext = this.menuService.getContext();
        this.setModalContext(menuContext);

        const modalRef = this.modalService.open(
            ProjectInformationModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );

        try {
            await modalRef.result;
        } catch(err) {
            // Information modal has been canceled
        }

        this.menuService.setContext(menuContext);
    }


    public async openProjectImageViewModal() {

        await this.viewModalLauncher.openImageViewModal(
            await this.datastore.get('project'), 'view'
        );
    }
    

    private setModalContext(currentMenuContext: MenuContext) {

        this.menuService.setContext(
            currentMenuContext === MenuContext.CONFIGURATION
                ? MenuContext.CONFIGURATION_MODAL
                : MenuContext.MODAL
        );
    }
}
