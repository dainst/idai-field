import {Settings} from './settings';

// import fs from 'fs';
var fs = window.require("fs"); // TODO review

const remote = window.require('electron').remote;

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class SettingsSerializer {

    public load(): Promise<Settings> {

        return new Promise((resolve, reject) => {

            fs.readFile(remote.getGlobal('configPath'), 'utf-8', (err: any, content: any) => {
                if (err) {
                    reject(err);
                } else {
                    const settings = JSON.parse(content);
                    resolve(remote.getGlobal('setConfigDefaults')(settings));
                }
            });


          // TODO resolve(undefined)
        });
    }


    public store(settings: Settings): Promise<any> {

        if (!settings) return Promise.resolve(undefined);

        let configToWrite: any = {};

        configToWrite['locale'] = settings.locale;
        configToWrite['isAutoUpdateActive'] = settings.isAutoUpdateActive;
        configToWrite['isSyncActive'] = settings.isSyncActive;
        configToWrite['hostPassword'] = settings.hostPassword;

        if (settings.syncTarget && (settings.syncTarget['password']
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

        // TODO if (remote) return this.writeConfigFile(configToWrite);
        else return Promise.resolve(); // only for synctest
    }


    private writeConfigFile(config: any): Promise<any> {

        return new Promise((resolve, reject) => {
          resolve(undefined)
          /*
            fs.writeFile(remote.getGlobal('configPath'), JSON.stringify(config), (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });

           */
        });
    }
}
