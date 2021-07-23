import { Router } from '@angular/router';
import { Injectable, NgZone } from '@angular/core';
import { MenuContext } from './menu-context';

const ipcRenderer = typeof window !== 'undefined' ? window.require('electron').ipcRenderer : require('electron').ipcRenderer;
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Menus {

    private context: MenuContext;


    constructor(private router: Router,
                private zone: NgZone) {}


    public getContext = () => this.context;


    public setContext(context: MenuContext) {

        this.context = context;
        if (remote) remote.getGlobal('setMenuContext')(context);
    }


    public initialize() {

        ipcRenderer.on('menuItemClicked', async (event: any, menuItem: string) => {
            await this.onMenuItemClicked(menuItem);
        });

        this.setContext(MenuContext.DEFAULT);
    }


    public async onMenuItemClicked(menuItem: string) {

        await this.zone.run(async () => await this.router.navigate([menuItem]));
    }
}
