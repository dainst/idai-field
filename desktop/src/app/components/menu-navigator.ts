import { Router } from '@angular/router';
import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { ObserverUtil } from 'idai-field-core';
import { reloadAndSwitchToHomeRoute } from '../services/reload';
import { SettingsService } from '../services/settings/settings-service';
import { Menus } from '../services/menus';
import { MenuModalLauncher } from '../services/menu-modal-launcher';

const ipcRenderer = typeof window !== 'undefined' ? window.require('electron').ipcRenderer : require('electron').ipcRenderer;


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

        if (menuItem === 'openProject') {
            await this.settingsService.selectProject(projectIdentifier);
            reloadAndSwitchToHomeRoute();
        } else if (menuItem === 'createProject') {
            await this.zone.run(() => this.menuModalLauncher.createProject());
        } else if (menuItem === 'editProject') {
            await this.zone.run(() => this.menuModalLauncher.editProject());
        }  else if (menuItem === 'projectInformation') {
            await this.zone.run(() => this.menuModalLauncher.openInformationModal());
        } else if (menuItem === 'projectImages') {
            await this.zone.run(() => this.menuModalLauncher.openProjectImageViewModal());
        } else if (menuItem === 'deleteProject') {
            await this.zone.run(() => this.menuModalLauncher.deleteProject(projectIdentifier));
        } else if (menuItem === 'projectSynchronization') {
            await this.zone.run(() => this.menuModalLauncher.openSynchronizationModal());
        } else if (menuItem === 'projectLanguages' || menuItem === 'valuelists'
                || menuItem === 'importConfiguration') {
            await this.zone.run(() => ObserverUtil.notify(this.configurationMenuObservers, menuItem));
        } else {
            await this.zone.run(async () => await this.router.navigate([menuItem]));
        }
    }


    public configurationMenuNotifications =
        (): Observable<string> => ObserverUtil.register(this.configurationMenuObservers);   
}
