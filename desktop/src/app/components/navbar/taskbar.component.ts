import { Component, OnInit } from '@angular/core';
import { SettingsProvider } from '../../services/settings/settings-provider';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


@Component({
    selector: 'taskbar',
    templateUrl: './taskbar.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class TaskbarComponent implements OnInit {

    public isLinux: boolean;

    private projectName: string;


    constructor(private settingsProvider: SettingsProvider) {

        this.projectName = this.settingsProvider.getSettings().selectedProject;
    }


    ngOnInit() {
        
        this.isLinux = remote.getGlobal('os') === 'Linux';
    }


    public showSyncStatus = () => this.projectName !== 'test';
}
