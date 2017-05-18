import {Settings} from "./settings";
const remote = require('electron').remote;
const fs = remote.require('fs');

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class SettingsSerializer {

    public load(): Promise<Settings> {

        return new Promise((resolve,reject) => {

            fs.readFile(remote.getGlobal('configPath'), 'utf-8', (err, content) => {
                if (err) {
                    reject(err);
                } else {
                    console.log("content",JSON.parse(content));
                    let settings = JSON.parse(content);
                    if (!settings.server) settings.server = {};
                    if (!settings.remoteSites) settings.remoteSites = [];
                    resolve(settings);
                }
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

        if (settings.userName && settings.userName.length > 0) {
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
