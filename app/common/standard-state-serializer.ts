import {Injectable} from '@angular/core';
import {SettingsService} from '../core/settings/settings-service';

const remote = require('electron').remote;
import * as fs from 'fs';
import {StateSerializer} from "./state-serializer";


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class StandardStateSerializer extends StateSerializer {

    public static RESOURCES_STATE: string = 'resources-state';

    constructor(private settingsService: SettingsService) {
        super();
    }


    public async load(): Promise<any> {

        return new Promise(resolve => {

            fs.readFile(this.getFilePath(), 'utf-8', (err: any, content: any) => {
                if (err) {
                    resolve({});
                } else {
                    try {
                        resolve(JSON.parse(content));
                    } catch (_) {
                        resolve({})
                    }

                }
            });
        });
    }


    public store(stateObject: any): Promise<any> {

        return new Promise((resolve, reject) => {

            if (this.settingsService.getSelectedProject() == 'test') return resolve();

            fs.writeFile(this.getFilePath(),
                    JSON.stringify(stateObject), (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }


    private getFilePath(): string {

        return remote.getGlobal('appDataPath') + '/' + StandardStateSerializer.RESOURCES_STATE + '-'
            + this.settingsService.getSelectedProject() + '.json';
    }
}
