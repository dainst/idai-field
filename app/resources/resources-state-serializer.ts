import {Injectable} from '@angular/core';
import {ResourcesViewState} from './resources-view-state';
import {SettingsService} from '../settings/settings-service';

const remote = require('electron').remote;
const fs = remote.require('fs');

/**
 * @author Thomas Kleinke
 */
@Injectable()
export class ResourcesStateSerializer {

    constructor(private settingsService: SettingsService) {}

    public load(): Promise<{ [viewName: string]: ResourcesViewState }> {

        return new Promise(resolve => {

            if (this.settingsService.getSelectedProject() == 'test') return resolve({});

            fs.readFile(this.getFilePath(), 'utf-8', (err, content) => {
                if (err) {
                    resolve({});
                } else {
                    resolve(JSON.parse(content));
                }
            });
        });
    }

    public store(resourcesStateMap: { [viewName: string]: ResourcesViewState }): Promise<any> {

        return new Promise((resolve, reject) => {

            if (this.settingsService.getSelectedProject() == 'test') return resolve();

            fs.writeFile(this.getFilePath(), JSON.stringify(resourcesStateMap), err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private getFilePath(): string {

        return remote.app.getPath('appData') + '/' + remote.app.getName()
            + '/resources-state-' + this.settingsService.getSelectedProject() + '.json';
    }
}
