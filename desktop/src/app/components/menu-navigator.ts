import { Router } from '@angular/router';
import { Injectable, NgZone } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap/modal';
import { Observable, Observer } from 'rxjs';
import { ObserverUtil, PouchdbDatastore } from 'idai-field-core';
import { reloadAndSwitchToHomeRoute } from '../services/reload';
import { SettingsService } from '../services/settings/settings-service';
import { Menus } from '../services/menus';
import { MenuModalLauncher } from '../services/menu-modal-launcher';
import { MenuContext } from '../services/menu-context';
import { ClosingModalComponent } from './widgets/closing-modal.component';
import { SerializationService } from '../services/serialization-service';

const ipcRenderer = window.require('electron')?.ipcRenderer;


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MenuNavigator {

    private configurationMenuObservers: Array<Observer<string>> = [];


    constructor(private router: Router,
                private zone: NgZone,
                private settingsService: SettingsService,
                private menuService: Menus,
                private menuModalLauncher: MenuModalLauncher,
                private modalService: NgbModal,
                private serializationService: SerializationService,
                private pouchdbDatastore: PouchdbDatastore) {}


    public initialize() {

        ipcRenderer.on('menuItemClicked', async (event: any, menuItem: string, projectIdentifier?: string) => {
            await this.onMenuItemClicked(menuItem, projectIdentifier);
        });

        this.menuService.setContext('default');
    }


    public async onMenuItemClicked(menuItem: string, projectIdentifier?: string) {

        if (![MenuContext.DEFAULT, MenuContext.CONFIGURATION].includes(this.menuService.getContext())) return;

        switch(menuItem) {
            case 'openProject':
                this.openProject(projectIdentifier);
                break;
            case 'createProject':
                await this.zone.run(() => this.menuModalLauncher.createProject());
                break;
            case 'editProject':
                await this.zone.run(() => this.menuModalLauncher.editProject());
                break;
            case 'projectInformation':
                await this.zone.run(() => this.menuModalLauncher.openInformationModal());
                break;
            case 'projectImages':
                await this.zone.run(() => this.menuModalLauncher.openProjectImageViewModal());
                break;
            case 'deleteProject':
                await this.zone.run(() => this.menuModalLauncher.deleteProject(projectIdentifier));
                break;
            case 'projectSynchronization':
                await this.zone.run(() => this.menuModalLauncher.openSynchronizationModal());
                break;
            case 'projectLanguages':
            case 'valuelists':
            case 'importConfiguration':
            case 'exportConfiguration':
                await this.zone.run(() => ObserverUtil.notify(this.configurationMenuObservers, menuItem));
                break;
            default:
                await this.zone.run(async () => await this.router.navigate([menuItem]));
        }
    }


    public configurationMenuNotifications =
        (): Observable<string> => ObserverUtil.register(this.configurationMenuObservers);   
    

    private async openProject(projectIdentifier: string) {

        if (await this.getDocumentCount() >= 10000) this.openClosingModal();
        
        await this.serializationService.serialize();

        await this.settingsService.selectProject(projectIdentifier);
        reloadAndSwitchToHomeRoute();
    }


    private openClosingModal() {

        this.menuService.setContext(MenuContext.BLOCKING_MODAL);

        const modalRef: NgbModalRef = this.modalService.open(
            ClosingModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );
        modalRef.componentInstance.mode = 'closeProject';
    }


    private async getDocumentCount(): Promise<number> {

        return (await this.pouchdbDatastore.getDb().info()).doc_count;
    }
}
