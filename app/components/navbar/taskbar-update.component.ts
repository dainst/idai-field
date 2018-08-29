import {ChangeDetectorRef, Component} from '@angular/core';

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

    public progressPercent: number = -1;
    public downloadComplete: boolean = false;


    constructor(changeDetectorRef: ChangeDetectorRef) {

        ipcRenderer.on('downloadProgress', (event: any, progress: any) => {
            this.progressPercent = Math.round(progress.percent);
            changeDetectorRef.detectChanges();
        });

        ipcRenderer.on('updateDownloaded', (value: boolean) => {
            this.downloadComplete = value;
            changeDetectorRef.detectChanges();
        });
    }
}