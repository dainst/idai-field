import { Settings } from './settings';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


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
                    settings.selectedProject = '';
                    resolve(remote.getGlobal('setConfigDefaults')(settings));
                }
            });
        });
    }


    public store(settings: Settings): Promise<any> {

        if (!settings) return Promise.resolve(undefined);

        let configToWrite: any = {};

        configToWrite['languages'] = settings.languages;
        configToWrite['isAutoUpdateActive'] = settings.isAutoUpdateActive;
        configToWrite['hostPassword'] = settings.hostPassword;
        configToWrite['hideHiddenFieldsInConfigurationEditor'] = settings.hideHiddenFieldsInConfigurationEditor;

        configToWrite['syncTargets'] = Object.keys(settings.syncTargets).reduce((result, projectName) => {
            const syncTarget = settings.syncTargets[projectName];
            if (syncTarget.address || syncTarget.password) result[projectName] = syncTarget;
            return result;
        }, {});

        if (settings.username && settings.username.length > 0) {
            configToWrite['username'] = settings.username;
        }

        if (settings.imagestorePath) {
            configToWrite['imagestorePath'] = settings.imagestorePath;
        }

        if (settings.dbs) {
            configToWrite['dbs'] = settings.dbs;
        }

        if (remote) return this.writeConfigFile(configToWrite);
        else return Promise.resolve(); // only for synctest
    }


    private writeConfigFile(config: any): Promise<any> {

        return new Promise((resolve, reject) => {
            fs.writeFile(remote.getGlobal('configPath'), JSON.stringify(config), (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(undefined);
                }
            });
        });
    }
}
