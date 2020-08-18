import {Router} from '@angular/router';
import {Injectable, NgZone} from '@angular/core';

const ipcRenderer = typeof window !== 'undefined' ? window.require('electron').ipcRenderer : require('electron').ipcRenderer;
const remote = typeof window !== 'undefined' ? window.require('electron').remote : require('electron').remote;


type MenuContext = 'loading'|'default'|'docedit'|'modal'|'projects'|'geometryedit';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MenuService {

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

        this.setContext('default');
    }


    public async onMenuItemClicked(menuItem: string) {

        await this.zone.run(async () => await this.router.navigate([menuItem]));
    }
}
