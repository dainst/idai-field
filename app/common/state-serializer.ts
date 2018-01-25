import {Injectable} from '@angular/core';
import {SettingsService} from '../core/settings/settings-service';

const remote = require('electron').remote;
const fs = remote.require('fs');

@Injectable()
/**
 * @author Thomas Kleinke
 */
export class StateSerializer {

    public static RESOURCES_STATE: string = 'resources-state';

    constructor(private settingsService: SettingsService) {}


    /**
     * @param stateType can be either RESOURCES_STATE or IMAGES_STATE
     */
    public async load(stateType: string): Promise<any> {

        if (this.settingsService.getSelectedProject() == 'test') {
            return {
                project: {
                    navigationPaths: {},
                    layerIds: {'test' : ['o25']},
                    mode: 'map'
                },
                excavation : {
                    navigationPaths: {'t1':{elements:[]}},
                    layerIds: {'t1' : ['o25']},
                    mode: 'map'
                }
            };
        }

        return new Promise(resolve => {

            fs.readFile(this.getFilePath(stateType), 'utf-8', (err: any, content: any) => {
                if (err) {
                    resolve({});
                } else {
                    resolve(JSON.parse(content));
                }
            });
        });
    }


    /**
     * @param stateType can be either RESOURCES_STATE or IMAGES_STATE
     */
    public store(stateType: string, stateObject: any): Promise<any> {

        return new Promise((resolve, reject) => {

            if (this.settingsService.getSelectedProject() == 'test') return resolve();

            fs.writeFile(this.getFilePath(stateType), JSON.stringify(stateObject), (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }


    private getFilePath(stateType: string): string {

        return remote.getGlobal('appDataPath') + '/' + stateType + '-'
            + this.settingsService.getSelectedProject() + '.json';
    }
}
