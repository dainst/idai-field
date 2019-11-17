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
    public downloadInterrupted: boolean = false;
    public downloadError: boolean = false;

    private errorTimeout: any = undefined;


    constructor(private settingsService: SettingsService, changeDetectorRef: ChangeDetectorRef) {

        ipcRenderer.on('downloadProgress', (event: any, downloadInfo: any) => {
            this.progressPercent = Math.round(downloadInfo.progressPercent);
            this.version = downloadInfo.version;
            if (this.progressPercent === 100) this.waitForError(changeDetectorRef);
            changeDetectorRef.detectChanges();
        });

        ipcRenderer.on('updateDownloaded', () => {
            this.stopWaitingForError();
            this.downloadComplete = true;
            changeDetectorRef.detectChanges();
        });

        ipcRenderer.on('downloadInterrupted', () => {
            if (this.progressPercent > -1) {
                this.stopWaitingForError();
                this.downloadInterrupted = true;
                changeDetectorRef.detectChanges();
            }
        });
    }


    public isAutoUpdateActive = () => this.settingsService.isAutoUpdateActive();


    public waitForError(changeDetectorRef: ChangeDetectorRef) {

        this.errorTimeout = setTimeout(() => {
            this.downloadError = true;
            changeDetectorRef.detectChanges();
        }, 10000);
    }


    private stopWaitingForError() {

        if (this.errorTimeout) clearTimeout(this.errorTimeout);
        this.errorTimeout = undefined;
    }
}