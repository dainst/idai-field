import { Router } from '@angular/router';
import { Injectable, NgZone } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, Document } from 'idai-field-core';
import { DoceditComponent } from './docedit/docedit.component';
import {SettingsService} from '../services/settings/settings-service';
import {reload} from '../services/reload';
import {MenuContext} from '../services/menu-context';
import {Menus} from '../services/menus';

const ipcRenderer = typeof window !== 'undefined' ? window.require('electron').ipcRenderer : require('electron').ipcRenderer;


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MenuNavigator {

    constructor(private router: Router,
                private zone: NgZone,
                private settingsService: SettingsService,
                private datastore: Datastore,
                private modalService: NgbModal,
                private menuService: Menus) {}


    public initialize() {

        ipcRenderer.on('menuItemClicked', async (event: any, menuItem: string, projectName?: string) => {
            await this.onMenuItemClicked(menuItem, projectName);
        });

        this.menuService.setContext('default');
    }


    public async onMenuItemClicked(menuItem: string, projectName?: string) {

        console.log(menuItem, projectName)

        if (menuItem === 'openProject') {
            await this.settingsService.selectProject(projectName);
            reload();
        } else if (menuItem === 'editProject') {
            await this.zone.run(async () => this.editProject());
        } else {
            await this.zone.run(async () => await this.router.navigate([menuItem]));
        }
    }


    public async editProject(activeGroup: string = 'stem') {

        this.menuService.setContext(MenuContext.DOCEDIT);

        const projectDocument: Document = await this.datastore.get('project');

        const doceditRef = this.modalService.open(DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        doceditRef.componentInstance.setDocument(projectDocument);
        doceditRef.componentInstance.activeGroup = activeGroup;

        try {
            await doceditRef.result;
        } catch(err) {
            // Docedit modal has been canceled
        }

        this.menuService.setContext(MenuContext.DEFAULT);
    }
}
