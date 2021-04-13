import {Injectable} from '@angular/core';
import {StateSerializer} from './state-serializer';
import {SettingsProvider} from '../settings/settings-provider';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


export type StateType = 'resources-state'|'matrix-state'|'tabs-state';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class StandardStateSerializer extends StateSerializer {

    constructor(private settingsProvider: SettingsProvider) {

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

            if (this.settingsProvider.getSettings().selectedProject === 'test') return resolve(undefined);

            fs.writeFile(this.getFilePath(stateType),
                    JSON.stringify(stateObject), (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(undefined);
                }
            });
        });
    }


    public delete(stateType: StateType): Promise<any> {

        return new Promise((resolve, reject) => {

            const filePath: string = this.getFilePath(stateType);
            if (!fs.existsSync(filePath)) return resolve(undefined);

            fs.unlink(filePath, (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(undefined);
                }
            });
        });
    }


    private getFilePath(stateType: StateType): string {

        return remote.getGlobal('appDataPath') + '/' +  stateType + '-'
            + this.settingsProvider.getSettings().selectedProject + '.json';
    }
}
