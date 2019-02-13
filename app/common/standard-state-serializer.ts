import {Injectable} from '@angular/core';
import * as fs from 'fs';
import {StateSerializer} from './state-serializer';
import {SettingsService} from '../core/settings/settings-service';

const remote = require('electron').remote;


export type StateType = 'resources-state'|'matrix-state';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class StandardStateSerializer extends StateSerializer {

    constructor(private settingsService: SettingsService) {

        super();
    }


    public async load(stateType: StateType): Promise<any> {

        return new Promise(resolve => {

            fs.readFile(this.getFilePath(stateType), 'utf-8', (err: any, content: any) => {
                if (err) {
                    resolve({});
                } else {
                    try {
                        resolve(JSON.parse(content));
                    } catch (_) {
                        resolve({});
                    }
                }
            });
        });
    }


    public store(stateObject: any, stateType: StateType): Promise<any> {

        return new Promise((resolve, reject) => {

            if (this.settingsService.getSelectedProject() === 'test') return resolve();

            fs.writeFile(this.getFilePath(stateType),
                    JSON.stringify(stateObject), (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }


    private getFilePath(stateType: StateType): string {

        return remote.getGlobal('appDataPath') + '/' +  stateType + '-'
            + this.settingsService.getSelectedProject() + '.json';
    }
}
