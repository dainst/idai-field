import {Router} from '@angular/router';
import {Injectable} from '@angular/core';

const ipcRenderer = require('electron').ipcRenderer;


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MenuService {

    constructor(private router: Router) {}


    public initialize() {

        ipcRenderer.on('menuItemClicked', async (event: any, menuItem: string) => {
            console.log('Menu item clicked!', menuItem);
            await this.onMenuItemClicked(menuItem);
        });
    }


    private async onMenuItemClicked(menuItem: string) {

        await this.router.navigate([menuItem]);
    }
}