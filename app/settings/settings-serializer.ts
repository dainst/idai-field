import {Settings} from "./settings";

const remote = require('electron').remote;
const fs = remote.require('fs');

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class SettingsSerializer {

    public load(): Promise<Settings> {

        return new Promise((resolve) => {

            resolve({
                userName: remote.getGlobal('config')['userName'],
                remoteSites: remote.getGlobal('config')['remoteSites'],
                server: remote.getGlobal('config')['server'],
                dbs: remote.getGlobal('config')['dbs']
            });
        });
    }

    public store(settings: Settings): Promise<any> {

        let configToWrite = {};

        let remoteSites = [];
        if (settings.remoteSites.length > 0) {
            for (let remoteSite of settings.remoteSites) {
                if (remoteSite['ipAddress'] && remoteSite['ipAddress'].length > 0) {
                    remoteSites.push(remoteSite);
                }
            }
        }
        if (remoteSites.length > 0) {
            configToWrite['remoteSites'] = remoteSites;
        }

        if (settings.server['userName'] || settings.server['password'] || settings.server['ipAddress'] ||
            settings.server['port']) {
            configToWrite['server'] = settings.server;
        }

        if (settings.userName.length > 0) {
            configToWrite['userName'] = settings.userName;
        }

        if (settings.dbs) {
            configToWrite['dbs'] = settings.dbs;
        }

        return this.writeConfigFile(configToWrite);
    }

    private writeConfigFile(config: any): Promise<any> {

        return new Promise((resolve, reject) => {
            fs.writeFile(remote.getGlobal('configPath'), JSON.stringify(config), err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
