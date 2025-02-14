import { Injectable } from '@angular/core';
import { SettingsProvider } from '../settings/settings-provider';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class AutoBackupService {

    constructor(private settingsProvider: SettingsProvider) {}


    public start() {

        const projectName: string = this.settingsProvider.getSettings().selectedProject;
        const backupDirectoryPath: string = this.settingsProvider.getSettings().backupDirectoryPath;
        const worker = new Worker(new URL('./create-backup.worker', import.meta.url));
        worker.onmessage = ({ data }) => console.log(data);
        worker.postMessage({ projectName, backupDirectoryPath });
    }    
}
