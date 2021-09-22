import { Component } from '@angular/core';
import { SettingsProvider } from '../../core/settings/settings-provider';


@Component({
    selector: 'taskbar',
    templateUrl: './taskbar.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class TaskbarComponent {

    private projectName: string;


    constructor(private settingsProvider: SettingsProvider) {

        this.projectName = this.settingsProvider.getSettings().selectedProject;
    }


    public showSyncStatus = () => this.projectName !== 'test';
}
