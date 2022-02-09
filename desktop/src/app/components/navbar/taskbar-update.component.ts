import { Component, NgZone, Input } from '@angular/core';
import { SettingsProvider } from '../../core/settings/settings-provider';


const ipcRenderer = typeof window !== 'undefined'
  ? window.require('electron').ipcRenderer
  : require('electron').ipcRenderer;


@Component({
    selector: 'taskbar-update',
    templateUrl: './taskbar-update.html'
})
/**
 * @author Thomas Kleinke
 */
export class TaskbarUpdateComponent {

    @Input() isSyncStatusShown: boolean;

    public version: string;
    public progressPercent: number = -1;
    public downloadComplete: boolean = false;
    public downloadInterrupted: boolean = false;
    public downloadError: boolean = false;

    private errorTimeout: any = undefined;


    constructor(private settingsProvider: SettingsProvider, zone: NgZone) {

        ipcRenderer.on('downloadProgress', (event: any, downloadInfo: any) => {
            zone.run(() => {
                this.progressPercent = Math.round(downloadInfo.progressPercent);
                this.version = downloadInfo.version;
                if (this.progressPercent === 100) this.waitForError(zone);
            });
        });

        ipcRenderer.on('updateDownloaded', () => {
            zone.run(() => {
                this.stopWaitingForError();
                this.downloadComplete = true;
            });
        });

        ipcRenderer.on('downloadInterrupted', () => {
            zone.run(() => {
                if (this.progressPercent > -1) {
                    this.stopWaitingForError();
                    this.downloadInterrupted = true;
                }
            });
        });
    }


    public isAutoUpdateActive = () => this.settingsProvider.getSettings().isAutoUpdateActive;


    public waitForError(zone: NgZone) {

        this.errorTimeout = setTimeout(() => {
            zone.run(() => {
                this.downloadError = true;
            });
        }, 30000);
    }


    private stopWaitingForError() {

        if (this.errorTimeout) clearTimeout(this.errorTimeout);
        this.errorTimeout = undefined;
    }
}
