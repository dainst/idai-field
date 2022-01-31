import { Router } from '@angular/router';
import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { ObserverUtil } from 'idai-field-core';
import { MenuContext } from './menu-context';
import { SettingsService } from './settings/settings-service';
import { reload } from './reload';

const ipcRenderer = typeof window !== 'undefined' ? window.require('electron').ipcRenderer : require('electron').ipcRenderer;
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Menus {

    private context: MenuContext;
    private menuContextObservers: Array<Observer<MenuContext>> = [];


    constructor(private router: Router,
        private zone: NgZone,
        private settingsService: SettingsService) {}


    public menuContextNotifications =
        (): Observable<MenuContext> => ObserverUtil.register(this.menuContextObservers);

    public getContext = () => this.context;


    public setContext(context: MenuContext) {

        this.context = context;
        if (remote) remote.getGlobal('setMenuContext')(context);
        ObserverUtil.notify(this.menuContextObservers, context);
    }


    public initialize() {

        ipcRenderer.on('menuItemClicked', async (event: any, menuItem: string, projectName?: string) => {
            await this.onMenuItemClicked(menuItem, projectName);
        });

        this.setContext(MenuContext.DEFAULT);
    }


    public async onMenuItemClicked(menuItem: string, projectName?: string) {

        if (menuItem === 'openProject') {
            await this.settingsService.selectProject(projectName);
            reload();
        } else {
            await this.zone.run(async () => await this.router.navigate([menuItem]));
        }
    }
}
