import {Injectable} from '@angular/core';
const fs = window.require('fs')
import {StateSerializer} from './state-serializer';
import {SettingsService} from '../settings/settings-service';

const remote = window.require('electron').remote;


export type StateType = 'resources-state'|'matrix-state'|'tabs-state';


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


    public delete(stateType: StateType): Promise<any> {

        return new Promise((resolve, reject) => {

            const filePath: string = this.getFilePath(stateType);
            if (!fs.existsSync(filePath)) return resolve();

            fs.unlink(filePath, (err: any) => {
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
