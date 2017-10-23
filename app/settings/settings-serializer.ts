import {Settings} from './settings';

const remote = require('electron').remote;
const fs = remote.require('fs');

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class SettingsSerializer {

    public load(): Promise<Settings> {

        return new Promise((resolve,reject) => {

            fs.readFile(remote.getGlobal('configPath'), 'utf-8', (err: any, content: any) => {
                if (err) {
                    reject(err);
                } else {
                    let settings = JSON.parse(content);
                    if (!settings.syncTarget) settings.syncTarget = {};
                    if (!settings.remoteSites) settings.remoteSites = [];
                    resolve(settings);
                }
            });
        });
    }


    public store(settings: Settings): Promise<any> {

        if (!settings) return Promise.resolve(undefined);

        let configToWrite: any = {};

        if (settings.isSyncActive) {
            configToWrite['isSyncActive'] = settings.isSyncActive;
        }

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
