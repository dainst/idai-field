import { Router } from '@angular/router';
import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { Document, ObserverUtil } from 'idai-field-core';
import { reloadAndSwitchToHomeRoute } from '../services/reload';
import { SettingsService } from '../services/settings/settings-service';
import { Menus } from '../services/menus';
import { ProjectModalLauncher } from '../services/project-modal-launcher';

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
                private projectModalLauncher: ProjectModalLauncher) {}


    public initialize() {

        ipcRenderer.on('menuItemClicked', async (event: any, menuItem: string, projectName?: string) => {
            await this.onMenuItemClicked(menuItem, projectName);
        });

        this.menuService.setContext('default');
    }


    public async onMenuItemClicked(menuItem: string, projectName?: string) {

        if (menuItem === 'openProject') {
            await this.settingsService.selectProject(projectName);
            reloadAndSwitchToHomeRoute();
        } else if (menuItem === 'createProject') {
            await this.zone.run(() => this.projectModalLauncher.createProject());
        } else if (menuItem === 'editProject') {
            await this.zone.run(() => this.projectModalLauncher.editProject());
        }  else if (menuItem === 'projectInformation') {
            await this.zone.run(() => this.projectModalLauncher.openInformationModal());
        } else if (menuItem === 'projectImages') {
            await this.zone.run(() => this.projectModalLauncher.openProjectImageViewModal());
        } else if (menuItem === 'deleteProject') {
            await this.zone.run(() => this.projectModalLauncher.deleteProject());
        } else if (menuItem === 'projectSynchronization') {
            await this.zone.run(() => this.projectModalLauncher.openSynchronizationModal());
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
