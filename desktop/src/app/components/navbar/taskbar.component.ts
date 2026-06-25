import { Component, OnInit } from '@angular/core';
import { SettingsProvider } from '../../services/settings/settings-provider';

import { electronRemote as remote } from 'src/app/electron/electron';


@Component({
    selector: 'taskbar',
    templateUrl: './taskbar.html',
    standalone: false
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class TaskbarComponent implements OnInit {

    public isLinux: boolean;

    private projectIdentifier: string;


    constructor(private settingsProvider: SettingsProvider) {

        this.projectIdentifier = this.settingsProvider.getSettings().selectedProject;
    }


    ngOnInit() {
        
        this.isLinux = remote.getGlobal('os') === 'Linux';
    }


    public showSyncStatus = () => this.projectIdentifier !== 'test';
}
