import {Router} from '@angular/router';
import {Injectable, NgZone} from '@angular/core';

const ipcRenderer = require('electron').ipcRenderer;


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MenuService {

    constructor(private router: Router,
                private zone: NgZone) {}


    public initialize() {

        ipcRenderer.on('menuItemClicked', async (event: any, menuItem: string) => {
            await this.onMenuItemClicked(menuItem);
        });
    }


    private async onMenuItemClicked(menuItem: string) {

        await this.zone.run(async () => await this.router.navigate([menuItem]));
    }
}