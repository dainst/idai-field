import {ChangeDetectorRef, Component} from '@angular/core';
import {SettingsService} from '../../core/settings/settings-service';

const ipcRenderer = require('electron').ipcRenderer;


@Component({
    moduleId: module.id,
    selector: 'taskbar-update',
    templateUrl: './taskbar-update.html'
})
/**
 * @author Thomas Kleinke
 */
export class TaskbarUpdateComponent {

    public version: string;
    public progressPercent: number = -1;
    public downloadComplete: boolean = false;


    constructor(private settingsService: SettingsService,
        changeDetectorRef: ChangeDetectorRef) {

        ipcRenderer.on('downloadProgress', (event: any, downloadInfo: any) => {
            this.progressPercent = Math.round(downloadInfo.progressPercent);
            this.version = downloadInfo.version;
            changeDetectorRef.detectChanges();
        });

        ipcRenderer.on('updateDownloaded', () => {
            this.downloadComplete = true;
            changeDetectorRef.detectChanges();
        });
    }


    public isAutoUpdateActive = () => this.settingsService.isAutoUpdateActive();
}