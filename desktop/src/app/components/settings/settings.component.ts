import {Component, OnInit} from '@angular/core';
import {equal} from 'tsfun';
import {SettingsService} from '../../core/settings/settings-service';
import {Settings} from '../../core/settings/settings';
import {M} from '../messages/m';
import {TabManager} from '../../core/tabs/tab-manager';
import {Messages} from '../messages/messages';
import {reload} from '../../core/common/reload';
import {MenuContext, MenuService} from '../menu-service';
import {SettingsProvider} from '../../core/settings/settings-provider';

const address = typeof window !== 'undefined' ? window.require('address') : require('address');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


@Component({
    templateUrl: './settings.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class SettingsComponent implements OnInit {

    public settings: Settings;
    public ipAddress: string = address.ip();
    public saving: boolean = false;


    constructor(private settingsProvider: SettingsProvider,
                private settingsService: SettingsService,
                private messages: Messages,
                private tabManager: TabManager,
                private menuService: MenuService) {}


    ngOnInit() {

        this.settings = this.settingsProvider.getSettings();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public toggleSync() {

        this.settings.isSyncActive = !this.settings.isSyncActive;
    }


    public toggleAutoUpdate() {

        this.settings.isAutoUpdateActive = !this.settings.isAutoUpdateActive;
    }


    public async save() {

        this.saving = true;
        const languagesChanged: boolean
            = !equal(this.settings.languages)(this.settingsProvider.getSettings().languages);

        try {
            await this.settingsService.updateSettings(this.settings);
        } catch (err) {
            this.saving = false;
            this.messages.add([M.SETTINGS_ERROR_MALFORMED_ADDRESS]);
            return;
        }

        await this.handleSaveSuccess(languagesChanged);
    }


    public async chooseImagestoreDirectory() {

        const result: any = await remote.dialog.showOpenDialog(
            remote.getCurrentWindow(),
            {
                properties: ['openDirectory', 'createDirectory'],
                defaultPath: this.settings.imagestorePath
            }
        );

        if (result && result.filePaths.length > 0) {
            this.settings.imagestorePath = result.filePaths[0];
        }
    }


    private async handleSaveSuccess(languagesChanged: boolean) {

        remote.getGlobal('updateConfig')(this.settings);

        if (languagesChanged) {
            reload();
        } else {
            try {
                await this.settingsService.setupSync();
                this.messages.add([M.SETTINGS_SUCCESS]);
            } catch (err) {
                console.error(err);
            } finally {
                this.saving = false;
            }
        }
    }
}
