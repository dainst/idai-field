import {Settings} from './settings';

const remote = require('electron').remote;
import * as fs from 'fs';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class SettingsSerializer {

    public store(settings: Settings): Promise<any> {

        if (!settings) return Promise.resolve(undefined);

        let configToWrite: any = {};

        configToWrite['isAutoUpdateActive'] = settings.isAutoUpdateActive;
        configToWrite['isSyncActive'] = settings.isSyncActive;

        if (settings.syncTarget && (settings.syncTarget['username'] || settings.syncTarget['password']
                || settings.syncTarget['address'])) {
            configToWrite['syncTarget'] = settings.syncTarget;
        }

        if (settings.username && settings.username.length > 0) {
            configToWrite['username'] = settings.username;
        }

        if (settings.imagestorePath) {
            configToWrite['imagestorePath'] = settings.imagestorePath;
        }

        if (settings.dbs) {
            configToWrite['dbs'] = settings.dbs;
        }

        return this.writeConfigFile(configToWrite);
    }


    private writeConfigFile(config: any): Promise<any> {

        return new Promise((resolve, reject) => {
            fs.writeFile(remote.getGlobal('configPath'), JSON.stringify(config), (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
