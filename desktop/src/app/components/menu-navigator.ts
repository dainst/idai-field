import { Router } from '@angular/router';
import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { ObserverUtil } from 'idai-field-core';
import { reloadAndSwitchToHomeRoute } from '../services/reload';
import { SettingsService } from '../services/settings/settings-service';
import { Menus } from '../services/menus';
import { MenuModalLauncher } from '../services/menu-modal-launcher';

const ipcRenderer = globalThis.require('electron')?.ipcRenderer;


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
                private menuModalLauncher: MenuModalLauncher) {}


    public initialize() {

        ipcRenderer.on('menuItemClicked', async (event: any, menuItem: string, projectIdentifier?: string) => {
            await this.onMenuItemClicked(menuItem, projectIdentifier);
        });

        this.menuService.setContext('default');
    }


    public async onMenuItemClicked(menuItem: string, projectIdentifier?: string) {

        switch(menuItem) {
            case 'openProject':
                await this.settingsService.selectProject(projectIdentifier);
                reloadAndSwitchToHomeRoute();
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
}
