import { Router } from '@angular/router';
import { Injectable, NgZone } from '@angular/core';
import { SettingsService } from '../core/settings/settings-service';
import { reload } from '../core/common/reload';

const ipcRenderer = typeof window !== 'undefined' ? window.require('electron').ipcRenderer : require('electron').ipcRenderer;
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


type MenuContext = 'default'|'docedit'|'modal'|'projects'|'geometryEdit'|'mapLayersEdit'|'georeferenceEdit';


export module MenuContext {

    export const DEFAULT = 'default';
    export const DOCEDIT = 'docedit';
    export const MODAL = 'modal';
    export const PROJECTS = 'projects';
    export const GEOMETRY_EDIT = 'geometryEdit';
    export const MAP_LAYERS_EDIT = 'mapLayersEdit';
    export const GEOREFERENCE_EDIT = 'georeferenceEdit';
}


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MenuService {

    private context: MenuContext;


    constructor(private router: Router,
                private zone: NgZone,
                private settingsService: SettingsService) {}


    public getContext = () => this.context;


    public setContext(context: MenuContext) {

        this.context = context;
        if (remote) remote.getGlobal('setMenuContext')(context);
    }


    public initialize() {

        ipcRenderer.on('menuItemClicked', async (event: any, menuItem: string, projectName?: string) => {
            await this.onMenuItemClicked(menuItem, projectName);
        });

        this.setContext('default');
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
